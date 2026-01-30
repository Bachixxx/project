import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { action, planId, name, amount, interval, coachId } = await req.json();

        if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured');

        // 1. CREATE Plan (Product + Price)
        if (action === 'create') {
            if (!name || !amount || !coachId) throw new Error('Missing required fields');

            // Create Product in Stripe
            const product = await stripe.products.create({
                name: name,
                metadata: {
                    coachId: coachId,
                    type: 'coach_plan'
                }
            });

            // Create Price in Stripe
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(Number(amount) * 100), // convert to cents
                currency: 'chf',
                recurring: {
                    interval: interval || 'month'
                },
            });

            // Insert into DB
            const { data, error } = await supabase
                .from('coach_plans')
                .insert({
                    coach_id: coachId,
                    name,
                    amount,
                    interval: interval || 'month',
                    stripe_product_id: product.id,
                    stripe_price_id: price.id,
                    active: true
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. DELETE Plan (Archive)
        if (action === 'delete') {
            if (!planId) throw new Error('Missing planId');

            // Get plan from DB
            const { data: plan, error: fetchError } = await supabase
                .from('coach_plans')
                .select('stripe_product_id, stripe_price_id')
                .eq('id', planId)
                .single();

            if (fetchError) throw fetchError;

            // Archive Product in Stripe (cannot delete if used, so archive is safer)
            if (plan.stripe_product_id) {
                await stripe.products.update(plan.stripe_product_id, { active: false });
            }

            // Mark as inactive in DB (soft delete)
            const { error: updateError } = await supabase
                .from('coach_plans')
                .update({ active: false })
                .eq('id', planId);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        throw new Error('Invalid action');

    } catch (error) {
        console.error('Error managing plan:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
