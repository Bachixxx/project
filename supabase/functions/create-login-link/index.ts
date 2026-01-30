import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper for Stripe V1 API
async function stripeRequest(method: string, path: string, body?: Record<string, any>) {
    const formBody = new URLSearchParams();

    if (body) {
        for (const key in body) {
            formBody.append(key, String(body[key]));
        }
    }

    const res = await fetch(`https://api.stripe.com/v1${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body ? formBody.toString() : undefined
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || `Stripe API Error: ${res.statusText}`);
    }
    return data;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) throw new Error('Invalid user token')

        // 2. Fetch Coach Profile logic
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single()

        if (coachError) throw coachError
        if (!coach.stripe_account_id) throw new Error('No Stripe account connected');

        // 3. Create Login Link
        console.log(`Creating login link for account ${coach.stripe_account_id}...`);

        const loginLink = await stripeRequest('POST', `/accounts/${coach.stripe_account_id}/login_links`);

        return new Response(
            JSON.stringify({ url: loginLink.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in create-login-link:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
