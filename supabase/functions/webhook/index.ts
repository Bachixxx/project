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

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );

    console.log('Processing webhook event:', event.type, event.id);

    // Idempotency: skip already-processed events
    const { data: existingEvent } = await supabase
      .from('stripe_processed_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log('Event already processed, skipping:', event.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Mark as processing BEFORE handling (PK prevents concurrent duplicates)
    const { error: markError } = await supabase
      .from('stripe_processed_events')
      .insert({ event_id: event.id });

    if (markError) {
      console.log('Concurrent duplicate detected, skipping:', event.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing successful payment intent:', paymentIntent.id);
        await handleSuccessfulPayment(paymentIntent);
        break;
      }

      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing completed session:', session);

        if (session.mode === 'subscription') {
          const metadata = session.metadata || {};
          const coachId = metadata.coachId;
          const type = metadata.type; // 'branding_addon' or undefined (default)

          if (!coachId) {
            throw new Error('No coachId in metadata');
          }

          // Atomic: UPDATE coaches + INSERT subscription_history in one transaction
          const { error: rpcError } = await supabase.rpc('process_subscription_event', {
            p_coach_id: coachId,
            p_action: 'activate',
            p_subscription_id: session.subscription,
            p_payment_id: session.payment_intent,
            p_type: type || null,
          });
          if (rpcError) throw rpcError;
          console.log(`Successfully activated subscription (type=${type || 'main'}) for coach:`, coachId);
        } else if (session.mode === 'payment') {
          await handleSuccessfulPayment(session);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata || {};
        const coachId = metadata.coachId;
        const subscriptionId = subscription.id;

        if (!coachId) {
          throw new Error('No coachId in metadata');
        }

        // Determine which subscription type is being cancelled
        const { data: coachData, error: fetchError } = await supabase
          .from('coaches')
          .select('stripe_subscription_id, branding_subscription_id, terminal_subscription_id')
          .eq('id', coachId)
          .single();

        if (fetchError) throw fetchError;

        let deactivateType: string | null = null;
        if (coachData.branding_subscription_id === subscriptionId) {
          deactivateType = 'branding_addon';
        } else if (coachData.terminal_subscription_id === subscriptionId) {
          deactivateType = 'terminal_addon';
        } else if (coachData.stripe_subscription_id === subscriptionId) {
          deactivateType = null; // main subscription
        } else {
          console.log('Unknown subscription ID, skipping:', subscriptionId);
          break;
        }

        // Atomic: UPDATE coaches + INSERT subscription_history in one transaction
        const { error: deactivateError } = await supabase.rpc('process_subscription_event', {
          p_coach_id: coachId,
          p_action: 'deactivate',
          p_subscription_id: subscriptionId,
          p_type: deactivateType,
        });
        if (deactivateError) throw deactivateError;
        console.log(`Successfully deactivated subscription (type=${deactivateType || 'main'}) for coach:`, coachId);
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
  } catch (error: any) {
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

async function handleSuccessfulPayment(object: any) {
  const metadata = object.metadata || {};
  const { programId, clientId, coachId, appointmentId, paymentType } = metadata;

  // Stripe Checkout Session uses `amount_total`, Payment Intent uses `amount`.
  const amountTotal = object.amount_total || object.amount || 0;
  const currency = object.currency || 'chf';
  const paymentIntentId = (object.payment_intent as string) || object.id;

  console.log(`Executing handleSuccessfulPayment: type=${paymentType}, clientId=${clientId}, coachId=${coachId}, appointmentId=${appointmentId}`);

  // Handle Terminal Payments (Anonymous/Ad-hoc)
  if (paymentType === 'terminal') {
    console.log('Successfully processed Terminal Payment for coach:', coachId);
    const description = object.description;
    const { error: terminalPayError } = await supabase.from('payments').insert({
      coach_id: coachId,
      amount: amountTotal / 100,
      status: 'paid',
      payment_method: 'online',
      payment_date: new Date().toISOString(),
      notes: description || 'Paiement sans contact (Terminal)',
      guest_name: (object as any).customer_details?.name || null,
      guest_email: (object as any).customer_details?.email || null
    });
    if (terminalPayError) {
      console.error('Error inserting terminal payment:', terminalPayError);
      throw terminalPayError;
    }
    return;
  }

  if (!clientId) {
    console.warn('Missing required metadata: clientId');
    return;
  }

  // Handle program purchase
  if (programId) {
    console.log(`Processing program purchase: ${programId} for client ${clientId}`);
    const { data: existingProgram } = await supabase
      .from('client_programs')
      .select('id')
      .eq('client_id', clientId)
      .eq('program_id', programId)
      .maybeSingle();

    if (!existingProgram) {
      const { error: programInsertError } = await supabase
        .from('client_programs')
        .insert({
          client_id: clientId,
          program_id: programId,
          start_date: new Date().toISOString(),
          status: 'active',
          payment_status: 'paid',
          payment_amount: amountTotal / 100
        });
      if (programInsertError) {
        console.error('Error inserting client program:', programInsertError);
        throw programInsertError;
      }
    }
  }

  // Handle appointment payment
  if (appointmentId) {
    console.log(`Processing appointment payment: ${appointmentId} for client: ${clientId}`);

    // 1. Register the client (idempotent)
    const { error: regError } = await supabase
      .from('appointment_registrations')
      .upsert({
        appointment_id: appointmentId,
        client_id: clientId,
        status: 'registered'
      }, { onConflict: 'appointment_id,client_id' });

    if (regError) {
      console.error('Error upserting registration:', regError);
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
      console.log('Updating existing payment record:', existingPayment.id);
      const { error: updateError } = await supabase.from('payments').update({
        status: 'paid',
        payment_method: 'stripe',
        payment_date: new Date().toISOString(),
        amount: amountTotal / 100,
        coach_id: coachId,
        notes: `[DBG] obj=${object.object} amt=${amountTotal} cid=${clientId} coa=${coachId} apt=${appointmentId} (Updated)`
      }).eq('id', existingPayment.id);
      if (updateError) {
        console.error('Error updating existing payment:', updateError);
        throw updateError;
      }
    } else {
      console.log('Inserting new payment record');
      const { error: insertError } = await supabase.from('payments').insert({
        appointment_id: appointmentId,
        client_id: clientId,
        coach_id: coachId,
        amount: amountTotal / 100,
        status: 'paid',
        payment_method: 'stripe',
        payment_date: new Date().toISOString(),
        notes: `[DBG] obj=${object.object} amt=${amountTotal} cid=${clientId} coa=${coachId} apt=${appointmentId} (New)`
      });
      if (insertError) {
        console.error('Error inserting payment record:', insertError);
        throw insertError;
      }
    }
  }

  // Send Payment Receipt Email
  try {
    const { data: clientData } = await supabase
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (clientData?.email) {
      await supabase.functions.invoke('send-email', {
        body: {
          to: clientData.email,
          template_name: 'payment.receipt',
          data: {
            amount: `${amountTotal / 100} ${currency.toUpperCase()}`,
            date: new Date().toLocaleDateString('fr-FR'),
            invoice_id: paymentIntentId,
            dashboard_url: 'https://coachency.app/client'
          }
        }
      });
    }
  } catch (emailError) {
    console.error('Failed to send payment receipt:', emailError);
  }
}