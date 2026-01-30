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

async function stripeRequest(method: string, path: string) {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/json',
        },
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

        // 2. Fetch Coach Profile
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single()

        if (coachError) throw coachError

        if (!coach.stripe_account_id) {
            return new Response(
                JSON.stringify({ isConnected: false, detailsSubmitted: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Fetch Stripe Account Status
        const account = await stripeRequest('GET', `/accounts/${coach.stripe_account_id}`);

        return new Response(
            JSON.stringify({
                isConnected: true,
                detailsSubmitted: account.details_submitted,
                payoutsEnabled: account.payouts_enabled,
                chargesEnabled: account.charges_enabled
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in get-stripe-status:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
