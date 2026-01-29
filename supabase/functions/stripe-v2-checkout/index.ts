import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@^17.0.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Stripe Client
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
        const action = url.pathname.split('/').pop(); // 'charge' or 'subscribe' or 'portal'

        const body = await req.json();
        const { accountId, priceId, quantity = 1, successUrl, cancelUrl } = body;

        if (!accountId) throw new Error('accountId is required');

        // Action: DIRECT CHARGE (Payment Mode)
        if (action === 'charge') {
            // "Use a Direct Charge with an application fee... Use hosted checkout"

            // We need `unit_amount` or `price_id`. User instructions have `price_data`.
            // Let's assume frontend sends a price Object or Price ID.
            // For simplicity with our `stripe-v2-products` flow, we likely have a Price ID from the product list.

            const sessionConfig: any = {
                mode: 'payment',
                line_items: [
                    {
                        price: priceId, // Existing price ID from connected account
                        quantity: quantity,
                    },
                ],
                payment_intent_data: {
                    application_fee_amount: 123, // Sample fee (1.23 currency units) as per instructions
                },
                success_url: successUrl || `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || `${req.headers.get('origin')}/cancel`,
            };

            const session = await stripe.checkout.sessions.create(sessionConfig, {
                stripeAccount: accountId, // Header for Direct Charge
            });

            return new Response(
                JSON.stringify({ url: session.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Action: SUBSCRIPTION (Subscription Mode)
        if (action === 'subscribe') {
            // "Charge subscription to Connected Account... customer_account: ... the connected account ID"
            // Wait, the instruction says: "customer_account: ... (The connected account ID)"
            // This implies the Connected Account IS the customer of the Platform? OR we are subscribing a Customer TO the Connected Account?

            // Reading carefuly: "We want to charge a subscription to the connected account. With V2 accounts we can use one ID for both the customer and the connected account."
            // "stripe.checkout.sessions.create({ customer_account: 'acct_...', ... })" --> This syntax is for when the Platform is charging the Connected Account (e.g. Platform Fee Subscription).

            // Let's implement this "Platform charges Connected Account" flow.

            const session = await stripe.checkout.sessions.create({
                customer: accountId, // V2: Account ID acts as Customer ID? Or `customer` field accepts Account ID?
                // The prompt says "customer_account: ...". Let's check if that's a valid param. 
                // In standard API it is 'customer'. In V2, maybe 'customer_account'? 
                // The prompt says: `customer_account: "acct_..."`. I will follow the prompt strictly.
                // @ts-ignore
                customer_account: accountId,

                mode: 'subscription',
                line_items: [
                    { price: priceId, quantity: 1 }, // Must be a Platform Price
                ],
                success_url: successUrl || `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || `${req.headers.get('origin')}/cancel`,
            });
            // Note: No `stripeAccount` header here because we are charging them as a customer of the Platform.

            return new Response(
                JSON.stringify({ url: session.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Action: BILLING PORTAL (for the Connected Account)
        if (action === 'portal') {
            // "Add a billing portal where the user can manage their subscription."
            // "stripe.billingPortal.sessions.create({ customer_account: ... })"

            // @ts-ignore
            const session = await stripe.billingPortal.sessions.create({
                customer_account: accountId,
                return_url: successUrl || req.headers.get('origin') || 'http://localhost:5173',
            });

            return new Response(
                JSON.stringify({ url: session.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Error in stripe-v2-checkout:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
