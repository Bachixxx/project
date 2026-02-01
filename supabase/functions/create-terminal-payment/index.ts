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
            // For Tap to Pay on iPhone (Native SDK)
            // We need a PaymentIntent with payment_method_types=['card_present']
            const unitAmount = Math.round(Number(amount) * 100);
            const applicationFee = Math.round(unitAmount * 0.01);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: unitAmount,
                currency: 'chf',
                payment_method_types: ['card_present'],
                capture_method: 'manual', // Terminal SDK usually requires manual capture or automatic? 
                // Actually for "Tap to Pay on iPhone" directly via SDK, we use manual then capture, or automatic.
                // Docs say: "capture_method": "manual" is common for Terminal to avoid unintended captures, but "automatic" works if we process immediately.
                // Let's use automatic for simplicity unless SDK complains.
                // Update: 'card_present' payments must be captured manually if we want to add tip etc, but for simple flow automatic is fine.
                // However, Capacitor Stripe Terminal plugin might expect one or the other.
                // Let's stick to 'manual' (default for terminal) or just standard.
                // Actually default is automatic logic but explicitly:
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
                on_behalf_of: coach.stripe_account_id, // Recommended for Direct charges or Destination charges where the coach is the merchant of record
            });

            return new Response(
                JSON.stringify({ client_secret: paymentIntent.client_secret }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                },
            );
        }

        // 4. Create Checkout Session (Web Mode)
        let sessionParams: any = {
            customer: customer.id, // Mandatory for V2 / Subscriptions
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
