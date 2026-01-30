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
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY not configured');
        }
        const stripe = getStripe();

        const { coachId, amount, description, mode, priceId } = await req.json();

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

        // 2. Create Checkout Session
        let sessionParams: any = {
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

            // Destination charge for subscription
            sessionParams.subscription_data = {
                transfer_data: {
                    destination: coach.stripe_account_id,
                },
                application_fee_percent: 1, // 1% Platform Fee
            };
        } else {
            // Standard One-Time Payment
            const unitAmount = Math.round(Number(amount) * 100); // Amount in cents
            const applicationFee = Math.round(unitAmount * 0.01); // 1% Platform Fee

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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error: any) {
        console.error('Error creating terminal payment:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
