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
        .select('*')
        .eq('id', user.id)
        .single();

      if (coachError || !coach) {
        throw new Error(coachError?.message || 'Coach profile not found');
      }

      stripeCustomerId = coach.stripe_customer_id;

      // Smart Recovery Logic:
      // If no ID exists, OR if the existing ID has no active subscriptions, try to find a better one.
      let needsRecovery = !stripeCustomerId;

      if (stripeCustomerId && !clientId) {
        // Check if the current customer actually has subscriptions
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId, { expand: ['subscriptions'] });
          if (!customer.deleted && customer.subscriptions && customer.subscriptions.data.length === 0) {
            console.log(`Current customer ${stripeCustomerId} has NO subscriptions. Initiating recovery search...`);
            needsRecovery = true;
          }
        } catch (err) {
          console.error(`Error checking customer ${stripeCustomerId}, forcing recovery:`, err);
          needsRecovery = true;
        }
      }

      if (needsRecovery && coach.email) {
        console.log(`Searching for better Stripe Customer match for email ${coach.email}...`);

        try {
          const customers = await stripe.customers.list({
            email: coach.email,
            limit: 5,
            expand: ['data.subscriptions']
          });

          // Find customer with ACTIVE or TRIALING subscription
          const bestMatch = customers.data.find((c: any) =>
            c.subscriptions &&
            c.subscriptions.data.length > 0 &&
            ['active', 'trialing'].includes(c.subscriptions.data[0].status)
          );

          if (bestMatch) {
            console.log(`Found better match: Customer ${bestMatch.id} has active subscription.`);
            stripeCustomerId = bestMatch.id;

            // Update DB with the correct ID
            await supabase
              .from('coaches')
              .update({ stripe_customer_id: stripeCustomerId })
              .eq('id', coach.id);
          } else if (!stripeCustomerId && customers.data.length > 0) {
            // Fallback: If we had NO ID at all, just take the most recent one even if no sub
            stripeCustomerId = customers.data[0].id;
            // Update DB
            await supabase
              .from('coaches')
              .update({ stripe_customer_id: stripeCustomerId })
              .eq('id', coach.id);
          }
        } catch (searchError) {
          console.error("Error during recovery search:", searchError);
        }
      }

      returnUrl = `${req.headers.get('origin')}/profile`;
    }

    if (!stripeCustomerId) {
      throw new Error('Aucun compte client Stripe trouvé. Veuillez contacter le support.');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
      configuration: 'bpc_1Suwh9KjaGJ8zmprXtNMraQl', // Specific config with Cancel/Update
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