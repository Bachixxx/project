import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-key, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

let _stripe: Stripe | null = null;
const getStripe = (key: string): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2023-10-16'
    });
  }
  return _stripe;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!endpointSecret) {
  throw new Error('Missing Stripe webhook secret');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('Stripe-Signature');
    const stripeKey = req.headers.get('stripe-key');
    if (!signature || !stripeKey) {
      throw new Error('Missing required headers');
    }

    const stripe = getStripe(stripeKey.replace('Bearer ', ''));
    const body = await req.text();
    
    console.log('Webhook Details:', {
      signature,
      endpointSecret: endpointSecret ? 'present' : 'missing',
      bodyLength: body.length,
    });

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        console.log('Processing completed session:', session);

        if (session.mode === 'subscription') {
          const metadata = session.metadata || {};
          const coachId = metadata.coachId;
          
          if (!coachId) {
            throw new Error('No coachId in metadata');
          }

          const { error: updateError } = await supabase
            .from('coaches')
            .update({
              subscription_type: 'paid',
              client_limit: null, // unlimited clients
              stripe_subscription_id: session.subscription,
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', coachId);

          if (updateError) {
            throw updateError;
          }

          await supabase
            .from('subscription_history')
            .insert({
              coach_id: coachId,
              previous_type: 'free',
              new_type: 'paid',
              payment_id: session.payment_intent,
              notes: 'Subscription upgraded via Stripe checkout',
            });

          console.log('Successfully processed subscription for coach:', coachId);
        } else if (session.mode === 'payment') {
          const metadata = session.metadata || {};
          const { programId, clientId, coachId, appointmentId } = metadata;

          if (!clientId) {
            throw new Error('Missing required metadata: clientId');
          }

          // Handle program purchase
          if (programId) {
            const { data: existingProgram } = await supabase
              .from('client_programs')
              .select('id')
              .eq('client_id', clientId)
              .eq('program_id', programId)
              .maybeSingle();

            if (!existingProgram) {
              const { error: programError } = await supabase
                .from('client_programs')
                .insert({
                  client_id: clientId,
                  program_id: programId,
                  start_date: new Date().toISOString(),
                  status: 'active',
                  payment_status: 'paid',
                  payment_amount: session.amount_total ? session.amount_total / 100 : 0
                });

              if (programError) {
                throw programError;
              }

              console.log('Successfully added program to client:', { programId, clientId });
            }
          }

          // Handle appointment payment
          if (appointmentId) {
            const { error: paymentError } = await supabase
              .from('payments')
              .update({
                status: 'paid',
                payment_date: new Date().toISOString(),
              })
              .eq('appointment_id', appointmentId)
              .eq('client_id', clientId);

            if (paymentError) {
              throw paymentError;
            }

            console.log('Successfully processed payment for appointment:', appointmentId);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const coachId = metadata.coachId;
        
        if (!coachId) {
          throw new Error('No coachId in metadata');
        }

        const { error: updateError } = await supabase
          .from('coaches')
          .update({
            subscription_type: 'free',
            client_limit: 5,
            stripe_subscription_id: null,
            subscription_end_date: null,
          })
          .eq('id', coachId);

        if (updateError) {
          throw updateError;
        }

        await supabase
          .from('subscription_history')
          .insert({
            coach_id: coachId,
            previous_type: 'paid',
            new_type: 'free',
            notes: 'Subscription cancelled',
          });

        console.log('Successfully processed subscription cancellation for coach:', coachId);
        break;
      }

      default: {
        console.log('Unhandled event type:', event.type);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});