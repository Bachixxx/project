import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY environment variable is not set');
  console.error('Please configure STRIPE_SECRET_KEY in Supabase Edge Function secrets');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
  }
  return _stripe;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Starting create-checkout-session...');

    if (!stripeSecretKey) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to Supabase Edge Function secrets.');
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const request = await req.json();
    console.log('Request body:', JSON.stringify(request, null, 2));

    const { programId, clientId, coachId, appointmentId, successUrl, cancelUrl } = request;

    if ((!programId && !appointmentId) || !clientId || !coachId) {
      throw new Error('Missing required parameters: programId OR appointmentId, clientId, and coachId');
    }

    let productData: any = {};
    let unitAmount = 0;
    let applicationFeeAmount = 0;
    let destinationAccount = '';

    // CASE 1: Program Purchase
    if (programId) {
      // Get program details
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('*, coach:coaches(stripe_account_id)')
        .eq('id', programId)
        .single();

      if (programError) {
        return new Response(
          JSON.stringify({ error: programError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
      if (!program) {
        return new Response(
          JSON.stringify({ error: 'Program not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }

      productData = {
        name: program.name,
      };

      // Only include description if it's not empty
      if (program.description && program.description.trim() !== '') {
        productData.description = program.description;
      }

      unitAmount = Math.round(program.price * 100);

      if (program.coach.stripe_account_id) {
        applicationFeeAmount = Math.round(program.price * 100 * 0.1);
        destinationAccount = program.coach.stripe_account_id;
      }
    }
    // CASE 2: Appointment Purchase
    else if (appointmentId) {
      // Get appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*, coach:coaches(stripe_account_id)')
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        return new Response(
          JSON.stringify({ error: appointmentError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
      if (!appointment) {
        return new Response(
          JSON.stringify({ error: 'Appointment not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }

      productData = {
        name: appointment.title,
        description: `Séance ${appointment.type === 'group' ? 'de groupe' : 'privée'}`,
      };

      unitAmount = Math.round(appointment.price * 100);

      if (appointment.coach.stripe_account_id) {
        applicationFeeAmount = Math.round(appointment.price * 100 * 0.1);
        destinationAccount = appointment.coach.stripe_account_id;
      }
    }

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      return new Response(
        JSON.stringify({ error: clientError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = client.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.full_name,
        metadata: {
          clientId: client.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update client with Stripe customer ID
      await supabase
        .from('clients')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', client.id);
    }

    const sessionConfig: any = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: productData,
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        programId: programId,
        appointmentId: appointmentId,
        clientId: clientId,
        coachId: coachId,
      },
      invoice_creation: {
        enabled: true,
      },
    };

    // Only add payment_intent_data if coach has Stripe connected AND destination is valid
    if (destinationAccount) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: destinationAccount,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Successfully created checkout session:', session.id);
    console.log('Checkout URL:', session.url);
    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in create-checkout-session:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});