import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

// '*' intentional: called from React Native app (no browser CORS restriction applies)
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
        return new Response(null, {
            headers: corsHeaders,
            status: 200
        });
    }

    try {
        // Authenticate the caller
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
            });
        }
        const token = authHeader.replace('Bearer ', '');
        const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
            });
        }

        const stripe = getStripe();
        const request = await req.json();
        const { appointmentId, clientId, coachId } = request;

        if (!appointmentId || !clientId || !coachId) {
            throw new Error('Missing required parameters: appointmentId, clientId, and coachId');
        }

        // 1. Fetch details
        const { data: appointment } = await supabase
            .from('appointments')
            .select('*, coach:coaches(stripe_account_id)')
            .eq('id', appointmentId)
            .single();

        if (!appointment) throw new Error('Appointment not found');
        if (!appointment.coach.stripe_account_id) {
            throw new Error('Coach Stripe account not connected');
        }

        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (!client) throw new Error('Client not found');

        // 2. Stripe Customer
        let stripeCustomerId = client.stripe_customer_id;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: client.email,
                name: client.full_name,
                metadata: { clientId: client.id },
            });
            stripeCustomerId = customer.id;
            await supabase.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', client.id);
        }

        // 3. Ephemeral Key
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: stripeCustomerId },
            { apiVersion: '2023-10-16' }
        );

        // 4. Payment Intent
        const unitAmount = Math.round(appointment.price * 100);
        const paymentIntentConfig: any = {
            amount: unitAmount,
            currency: 'chf',
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            application_fee_amount: Math.round(unitAmount * 0.1), // 10% fee
            transfer_data: {
                destination: appointment.coach.stripe_account_id,
            },
            metadata: {
                appointmentId: appointmentId,
                clientId: clientId,
                coachId: coachId,
                paymentType: 'appointment'
            }
        };

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

        return new Response(
            JSON.stringify({
                paymentIntent: paymentIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: stripeCustomerId,
                publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY')
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error: any) {
        console.error('Error in create-native-payment-sheet:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
