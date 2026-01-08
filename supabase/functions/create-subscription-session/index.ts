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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders     }, status: 200 })
  } 

  try {
    // Parse request body
    const body = await req.json();
    const { coachId, priceId, successUrl, cancelUrl } = body;

    // Validate required parameters
    if (!coachId || !priceId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'coachId, priceId, successUrl, and cancelUrl are required'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Get coach details
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    if (coachError) {
      console.error('Error fetching coach:', coachError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch coach details',
          details: coachError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create or retrieve Stripe customer
    const stripe = getStripe();
    
    let stripeCustomerId = coach.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: coach.email,
        name: coach.full_name,
        metadata: {
          coachId: coachId,
        },
      });
      stripeCustomerId = customer.id;

      // Update coach with Stripe customer ID
      await supabase
        .from('coaches')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', coachId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        coachId: coachId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
      },
      subscription_data: {
        metadata: {
          coachId: coachId,
        },
        trial_period_days: 14,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});