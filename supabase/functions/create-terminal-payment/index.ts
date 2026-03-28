import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const ALLOWED_ORIGINS = ['https://coachency.app', 'https://www.coachency.app'];
function corsHeaders(req: Request) {
    const origin = req.headers.get('Origin') ?? '';
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
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
        return new Response('ok', { headers: corsHeaders(req) });
    }

    try {
        // Authenticate the caller (coaches.id = auth.uid() directly)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 401,
            });
        }
        const token = authHeader.replace('Bearer ', '');
        const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 401,
            });
        }

        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY not configured');
        }
        const stripe = getStripe();

        const { coachId, amount, description, mode, priceId, clientEmail } = await req.json();
        console.log('Received:', { coachId, amount, description, mode, priceId, clientEmail });

        if (!coachId || (!amount && !priceId)) {
            throw new Error('Missing coachId or amount/priceId');
        }

        // 1. Get Coach's Connect Account ID
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('stripe_account_id, full_name')
            .eq('id', coachId)
            .single();

        if (coachError || !coach) throw new Error('Coach not found');
        if (!coach.stripe_account_id) throw new Error('Coach has not connected their Stripe account');

        // 2. Create a Customer (Required for V2 Accounts / Subscriptions)
        const customer = await stripe.customers.create({
            email: clientEmail || `guest_${Date.now()}@coachency.app`,
            name: clientEmail ? undefined : 'Client Terminal (Anonyme)',
            metadata: {
                coachId: coachId,
                source: 'terminal_v2'
            }
        });
        console.log('Created Customer:', customer.id);

        // 3. Handle Native Terminal Mode
        if (mode === 'native_terminal') {
            const unitAmount = Math.round(Number(amount) * 100);
            const applicationFee = Math.round(unitAmount * 0.01);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: unitAmount,
                currency: 'chf',
                payment_method_types: ['card_present'],
                capture_method: 'automatic',
                metadata: {
                    coachId: coachId,
                    description: description || 'Native Tap to Pay',
                    type: 'terminal_native'
                },
                application_fee_amount: applicationFee,
                transfer_data: {
                    destination: coach.stripe_account_id,
                },
                on_behalf_of: coach.stripe_account_id,
            });

            return new Response(
                JSON.stringify({ client_secret: paymentIntent.client_secret }),
                {
                    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
                    status: 200,
                },
            );
        }

        // 4. Create Checkout Session (Web Mode)
        let sessionParams: any = {
            customer: customer.id,
            payment_method_types: ['card'],
            ui_mode: 'hosted',
            metadata: {
                paymentType: 'terminal',
                coachId: coachId,
                description: description || 'Terminal Payment',
                mode: mode || 'payment'
            },
            success_url: `${req.headers.get('origin')}/terminal?payment_status=success`,
            cancel_url: `${req.headers.get('origin')}/terminal?payment_status=cancelled`,
        };

        if (mode === 'subscription') {
            if (!priceId) throw new Error('Missing priceId for subscription');

            sessionParams.mode = 'subscription';
            sessionParams.line_items = [{
                price: priceId,
                quantity: 1,
            }];

            sessionParams.subscription_data = {
                transfer_data: {
                    destination: coach.stripe_account_id,
                },
                application_fee_percent: 1,
            };
        } else {
            const unitAmount = Math.round(Number(amount) * 100);
            const applicationFee = Math.round(unitAmount * 0.01);

            sessionParams.mode = 'payment';
            sessionParams.line_items = [{
                price_data: {
                    currency: 'chf',
                    product_data: {
                        name: `Paiement à ${coach.full_name}`,
                        description: description || 'Paiement sans contact',
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            }];

            sessionParams.payment_intent_data = {
                application_fee_amount: applicationFee,
                transfer_data: {
                    destination: coach.stripe_account_id,
                },
            };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error: any) {
        console.error('Error creating terminal payment:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
