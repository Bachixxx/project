import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@^17.0.0'; // Using latest major version for V2 support

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
    if (!_stripe) {
        _stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16', // Core version, V2 is separate namespace
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
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY not configured');
        }
        const stripe = getStripe();
        const url = new URL(req.url);
        const action = url.pathname.split('/').pop(); // 'create-account' or 'onboard' or 'status'

        const { userId, email, name, accountId } = await req.json(); // Unified body parsing

        // 1. Create V2 Account
        // POST /stripe-v2-connect -> action implicitly handled by body in this simple routing? 
        // Or we can use a query param or switch on a field. 
        // Let's assume the client sends { action: 'create', ... } or { action: 'onboard', ... }

        // Actually, let's look at the implementation plan helper functions usually split by file, 
        // but here we can combine or just infer from data.

        // Let's handle "create" and "onboard" in one go for simplicity or split logic.
        // User wants "Use a 'Stripe Client' for all requests" and specific V2 calls.

        // Action: CREATE ACCOUNT
        if (action === 'create-account' || (!accountId && userId)) {
            if (!userId) throw new Error('UserId required');

            // Check if user already has an account mapping in DB (optional, but good practice)
            // For this DEMO, we will just create a new one or return existing if we were storing it.
            // Let's create a new one as per "Sample Integration" instructions.

            // Create V2 Account
            // @ts-ignore - Stripe V2 might not be fully typed in all TS definitions yet
            const account = await stripe.v2.core.accounts.create({
                display_name: name || 'Demo User',
                contact_email: email,
                identity: {
                    country: 'CH', // Hardcoded for this Swiss/EU coach appcontext, or 'US' for demo
                },
                dashboard: 'full', // As requested in V2 spec? No, requested 'full' dashboard 
                defaults: {
                    responsibilities: {
                        fees_collector: 'stripe',
                        losses_collector: 'stripe',
                    },
                },
                configuration: {
                    customer: {},
                    merchant: {
                        capabilities: {
                            card_payments: {
                                requested: true,
                            },
                        },
                    },
                },
            });

            // Store mapping in DB (optional for demo, but useful)
            // await supabase.from('user_stripe_accounts').insert({ user_id: userId, account_id: account.id });

            return new Response(
                JSON.stringify({ accountId: account.id, account }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Action: ONBOARD (Generate Account Link)
        if (action === 'onboard') {
            if (!accountId) throw new Error('AccountId required for onboarding');

            const origin = req.headers.get('origin') || 'http://localhost:5173';

            // @ts-ignore
            const accountLink = await stripe.v2.core.accountLinks.create({
                account: accountId,
                use_case: {
                    type: 'account_onboarding',
                    account_onboarding: {
                        configurations: ['merchant', 'customer'],
                        refresh_url: `${origin}/stripe-demo?status=refresh`,
                        return_url: `${origin}/stripe-demo?status=return&accountId=${accountId}`,
                    },
                },
            });

            return new Response(
                JSON.stringify({ url: accountLink.url }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Action: GET STATUS
        if (action === 'status') {
            if (!accountId) throw new Error('AccountId required');

            // @ts-ignore
            const account = await stripe.v2.core.accounts.retrieve(accountId, {
                include: ["configuration.merchant", "requirements"],
            });

            // Logic from user prompt
            const readyToProcessPayments = account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";
            // @ts-ignore
            const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
            const onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

            return new Response(
                JSON.stringify({
                    readyToProcessPayments,
                    onboardingComplete,
                    details: account
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Error in stripe-v2-connect:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
