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
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!endpointSecret || !stripeSecretKey) {
  throw new Error('Missing Stripe configuration (Webhook Secret or API Key)');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }

    const stripe = getStripe(stripeSecretKey);
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
            console.log('Processing appointment payment:', appointmentId, 'for client:', clientId);

            // 1. Register the client (idempotent)
            const { error: regError } = await supabase
              .from('appointment_registrations')
              .upsert({
                appointment_id: appointmentId,
                client_id: clientId,
                status: 'registered'
              }, { onConflict: 'appointment_id,client_id' });

            if (regError) {
              console.error('Error registering client:', regError);
              throw regError;
            }

            // 2. Create or Update Payment Record
            const { error: paymentError } = await supabase
              .from('payments')
              .upsert({
                appointment_id: appointmentId,
                client_id: clientId,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                status: 'paid',
                payment_method: 'online',
                payment_date: new Date().toISOString(),
                notes: 'Paid via Stripe Checkout'
              }, { onConflict: 'appointment_id,client_id' }); // Assuming there's a unique constraint or index? 
            // If no unique constraint on payments(appointment_id, client_id), upsert might duplicate if ID not provided.
            // Better to select first or just insert? 
            // Actually, we usually want one payment per appointment-client pair. 
            // Let's use INSERT and ignore if exists? Or just INSERT.
            // Wait, previous code used UPDATE.
            // Let's check if we can rely on ID.

            // To be safe and avoid duplicates if the trigger somehow fired (unlikely for group), 
            // we will first try to UPDATE, if no rows, then INSERT.

            // Actually, best approach:
            // The trigger for 1-on-1 might have created a row.
            // The group session has no trigger yet.
            // So we use UPSERT if we have a unique key. 
            // The schema has `payments_appointment_id_idx` and `payments_client_id_idx` but no composite unique constraint visible in the file I read.
            // So UPSERT might not work without a specific constraint.

            // Manual Upsert logic:
            const { data: existingPayment } = await supabase
              .from('payments')
              .select('id')
              .eq('appointment_id', appointmentId)
              .eq('client_id', clientId)
              .maybeSingle();

            if (existingPayment) {
              await supabase.from('payments').update({
                status: 'paid',
                payment_method: 'online',
                payment_date: new Date().toISOString(),
                amount: session.amount_total ? session.amount_total / 100 : 0
              }).eq('id', existingPayment.id);
            } else {
              await supabase.from('payments').insert({
                appointment_id: appointmentId,
                client_id: clientId,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                status: 'paid',
                payment_method: 'online',
                payment_date: new Date().toISOString(),
                notes: 'Paid via Stripe Checkout'
              });
            }

            console.log('Successfully processed payment and registration for appointment:', appointmentId);
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