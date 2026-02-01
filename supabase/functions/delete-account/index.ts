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

if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
    console.error('Missing environment variables');
    throw new Error('Server Configuration Error: Missing required environment variables (STRIPE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Get the user from the authorization header (JWT)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Invalid user token');
        }

        const userId = user.id;
        console.log(`Starting account deletion for user: ${userId}`);

        // 2. Fetch coach details to get Stripe Customer ID
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('stripe_customer_id, stripe_account_id')
            .eq('id', userId)
            .single();

        if (coachError) {
            console.error('Error fetching coach:', coachError);
            // Proceeding with deletion even if coach record is missing/errored to ensure auth cleanup
        }

        // 3. Cancel Stripe Subscription (if exists)
        if (coach?.stripe_customer_id) {
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: coach.stripe_customer_id,
                    status: 'active',
                });

                for (const sub of subscriptions.data) {
                    await stripe.subscriptions.cancel(sub.id);
                    console.log(`Cancelled subscription: ${sub.id}`);
                }
            } catch (stripeError) {
                console.error('Error cancelling Stripe subscriptions:', stripeError);
                // Continue execution - don't block deletion on stripe error
            }
        }

        // 4. Force Cleanup of Public Data via RPC (Bypassing broken cascades)
        const { error: rpcError } = await supabase.rpc('cleanup_coach_data', { target_coach_id: userId });

        if (rpcError) {
            console.error('Error cleaning up coach data:', rpcError);
            // We continue anyway, as maybe the user was already partially deleted
        }

        // 5. Delete User from Supabase Auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        console.log(`Successfully deleted user: ${userId}`);

        return new Response(
            JSON.stringify({ message: 'Account deleted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error('Error deleting account:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
