import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@13.11.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

function corsHeaders(req: Request) {
    const origin = req.headers.get('Origin') ?? '';
    const allowed = origin === 'https://coachency.app'
        || origin === 'https://www.coachency.app'
        || origin === 'https://melodious-faun-62e372.netlify.app'
        || origin.endsWith('--melodious-faun-62e372.netlify.app');
    return {
        'Access-Control-Allow-Origin': allowed ? origin : 'https://coachency.app',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    };
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

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

        if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured');

        const { action, planId, name, amount, interval, coachId } = await req.json();

        // 1. CREATE Plan (Product + Price)
        if (action === 'create') {
            if (!name || !amount || !coachId) throw new Error('Missing required fields');

            // Verify the authenticated user owns this coachId
            if (user.id !== coachId) {
                return new Response(JSON.stringify({ error: 'Forbidden: you can only manage your own plans' }), {
                    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 403,
                });
            }

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
                unit_amount: Math.round(Number(amount) * 100),
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
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. DELETE Plan (Archive)
        if (action === 'delete') {
            if (!planId) throw new Error('Missing planId');

            // Get plan and verify ownership (coaches.id = auth.uid())
            const { data: plan, error: fetchError } = await supabase
                .from('coach_plans')
                .select('coach_id, stripe_product_id, stripe_price_id')
                .eq('id', planId)
                .eq('coach_id', user.id)
                .single();

            if (fetchError || !plan) {
                return new Response(JSON.stringify({ error: 'Forbidden: plan not found or not yours' }), {
                    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 403,
                });
            }

            // Archive Product in Stripe (cannot delete if used)
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
                headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        throw new Error('Invalid action');

    } catch (error) {
        console.error('Error managing plan:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
