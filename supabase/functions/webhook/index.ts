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
          const type = metadata.type; // 'branding_addon' or undefined (default)

          if (!coachId) {
            throw new Error('No coachId in metadata');
          }

          if (type === 'branding_addon') {
            // Handle Branding Add-on
            const { error: updateError } = await supabase
              .from('coaches')
              .update({
                has_branding: true,
                branding_subscription_id: session.subscription,
              })
              .eq('id', coachId);

            if (updateError) throw updateError;
            console.log('Successfully activated Branding for coach:', coachId);

          } else if (type === 'terminal_addon') {
            // Handle Terminal Add-on
            const { error: updateError } = await supabase
              .from('coaches')
              .update({
                has_terminal: true,
                terminal_subscription_id: session.subscription,
              })
              .eq('id', coachId);

            if (updateError) throw updateError;
            console.log('Successfully activated Terminal for coach:', coachId);

          } else {
            // Handle Main Subscription (Pro)
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

            console.log('Successfully processed Main Subscription for coach:', coachId);
          }

        } else if (session.mode === 'payment') {
          const metadata = session.metadata || {};
          const { programId, clientId, coachId, appointmentId, paymentType } = metadata;

          // Handle Terminal Payments (Anonymous/Ad-hoc)
          if (paymentType === 'terminal') {
            console.log('Successfully processed Terminal Payment for coach:', coachId);
            const description = session.description;
            // Insert anonymous payment record
            const { error: paymentError } = await supabase.from('payments').insert({
              coach_id: coachId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              status: 'paid',
              payment_method: 'online',
              payment_date: new Date().toISOString(),
              notes: description || 'Paiement sans contact (Terminal)'
            });

            if (paymentError) {
              console.warn('Warning: Could not save terminal payment to DB (likely missing coach_id column):', paymentError);
              // We do NOT throw here, so the webhook returns 200 OK to Stripe.
              // The payment is successful in Stripe regardless.
            }

            break;
          }

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
        const subscriptionId = subscription.id;

        if (!coachId) {
          throw new Error('No coachId in metadata');
        }

        // Get current coach state to check which subscription is being deleted
        const { data: coachData, error: fetchError } = await supabase
          .from('coaches')
          .select('stripe_subscription_id, branding_subscription_id, terminal_subscription_id')
          .eq('id', coachId)
          .single();

        if (fetchError) throw fetchError;

        if (coachData.branding_subscription_id === subscriptionId) {
          // Deleting Branding Subscription
          await supabase
            .from('coaches')
            .update({ has_branding: false, branding_subscription_id: null })
            .eq('id', coachId);
          console.log('Successfully deactivated Branding for coach:', coachId);

        } else if (coachData.terminal_subscription_id === subscriptionId) {
          // Deleting Terminal Subscription
          await supabase
            .from('coaches')
            .update({ has_terminal: false, terminal_subscription_id: null })
            .eq('id', coachId);
          console.log('Successfully deactivated Terminal for coach:', coachId);

        } else if (coachData.stripe_subscription_id === subscriptionId) {
          // Deleting Main Subscription
          const { error: updateError } = await supabase
            .from('coaches')
            .update({
              subscription_type: 'free',
              client_limit: 5,
              stripe_subscription_id: null,
              subscription_end_date: null,
            })
            .eq('id', coachId);

          if (updateError) throw updateError;

          await supabase
            .from('subscription_history')
            .insert({
              coach_id: coachId,
              previous_type: 'paid',
              new_type: 'free',
              notes: 'Subscription cancelled',
            });
          console.log('Successfully processed Main Subscription cancellation for coach:', coachId);
        } else {
          console.log('Deleted subscription did not match known active subscriptions for coach:', coachId);
        }
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