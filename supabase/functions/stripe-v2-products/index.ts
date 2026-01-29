import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@^17.0.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Stripe Client instantiation (standard V1/V2 unified client)
let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
    if (!_stripe) {
        _stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });
    }
    return _stripe;
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const stripe = getStripe();
        const url = new URL(req.url);
        const action = url.pathname.split('/').pop(); // 'create' or 'list'

        const { accountId, name, description, unitAmount, currency } = await req.json();

        if (!accountId) throw new Error('accountId is required');

        // Action: CREATE PRODUCT
        if (action === 'create') {
            // "Please set up a sample endpoint ... This should use the Stripe-Account header"

            // Note: The Stripe Node/Deno SDK handles the header via the second argument option { stripeAccount: ... }
            const product = await stripe.products.create({
                name: name,
                description: description || '',
                default_price_data: {
                    unit_amount: unitAmount, // in cents
                    currency: currency || 'chf',
                },
            }, {
                stripeAccount: accountId, // Used for Stripe-Account header
            });

            return new Response(
                JSON.stringify({ product }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Action: LIST PRODUCTS
        if (action === 'list') {
            const products = await stripe.products.list({
                limit: 20,
                active: true,
                expand: ['data.default_price'],
            }, {
                stripeAccount: accountId, // Header
            });

            return new Response(
                JSON.stringify({ products: products.data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Error in stripe-v2-products:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
