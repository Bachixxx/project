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

// Helper for Stripe V1 API (Form-URL-Encoded)
async function stripeRequest(method: string, path: string, body: Record<string, any>) {
    const formBody = new URLSearchParams();

    // Recursive function to append nested objects for Stripe Form encoding
    const appendToForm = (data: any, rootKey: string | null = null) => {
        for (const key in data) {
            const value = data[key];
            const formKey = rootKey ? `${rootKey}[${key}]` : key;

            if (typeof value === 'object' && value !== null) {
                appendToForm(value, formKey);
            } else {
                formBody.append(formKey, String(value));
            }
        }
    };
    appendToForm(body);

    const res = await fetch(`https://api.stripe.com/v1${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString()
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
            .select('stripe_account_id, email, full_name')
            .eq('id', user.id)
            .single()

        if (coachError) throw coachError

        let accountId = coach.stripe_account_id

        // 3. Create Account (V1 Express) if missing
        if (!accountId) {
            console.log('Creating new Stripe V1 Express account...')
            const account = await stripeRequest('POST', '/accounts', {
                type: 'express',
                email: coach.email,
                business_type: 'individual',
                business_profile: {
                    name: coach.full_name || 'Coach',
                    product_description: "Services de coaching sportif personnalisés"
                },
                metadata: {
                    supabase_user_id: user.id
                }
            });

            accountId = account.id;

            // Save to Supabase
            await supabase
                .from('coaches')
                .update({ stripe_account_id: accountId })
                .eq('id', user.id);
        }

        // 4. Create Account Link (Onboarding)
        const origin = req.headers.get('origin') || 'http://localhost:5173'
        console.log(`Creating onboarding link for ${accountId}...`);

        const accountLink = await stripeRequest('POST', '/account_links', {
            account: accountId,
            refresh_url: `${origin}/profile?stripe_connect=refresh`,
            return_url: `${origin}/profile?stripe_connect=success`,
            type: 'account_onboarding',
        });

        return new Response(
            JSON.stringify({ url: accountLink.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in create-connect-account:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
