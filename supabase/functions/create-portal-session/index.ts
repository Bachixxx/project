import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }


  try {
    const stripe = getStripe();
    const requestData = await req.json().catch(() => ({})); // Handle empty body
    const { clientId } = requestData;

    let stripeCustomerId: string | null = null;
    let returnUrl = `${req.headers.get('origin')}/dashboard`;

    // 1. If clientId is provided, it's for a Client (existing logic)
    if (clientId) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        throw new Error(clientError?.message || 'Client not found');
      }
      stripeCustomerId = client.stripe_customer_id;
    }
    // 2. If no clientId, it's for the Authenticated Coach
    else {
      // Verify user authorization
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

      if (userError || !user) {
        throw new Error('Invalid user token');
      }

      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (coachError || !coach) {
        throw new Error(coachError?.message || 'Coach profile not found');
      }

      stripeCustomerId = coach.stripe_customer_id;
      returnUrl = `${req.headers.get('origin')}/profile`;
    }

    if (!stripeCustomerId) {
      throw new Error('No Stripe customer found for this account');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});