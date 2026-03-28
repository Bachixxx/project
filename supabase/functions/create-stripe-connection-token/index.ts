import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function stripeRequest(method: string, path: string, body: Record<string, any>, apiKey: string, connectAccountId?: string) {
    const formBody = new URLSearchParams();
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

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (connectAccountId) {
        headers['Stripe-Account'] = connectAccountId;
    }

    return fetch(`https://api.stripe.com/v1${path}`, {
        method,
        headers,
        body: method === 'POST' ? formBody : undefined,
    });
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Authenticate the caller
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        const { stripe_account_id } = await req.json()

        if (!stripe_account_id) {
            throw new Error('Missing stripe_account_id')
        }

        // Verify the authenticated user owns this stripe_account_id (coaches.id = auth.uid() directly)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('id')
            .eq('id', user.id)
            .eq('stripe_account_id', stripe_account_id)
            .single();

        if (coachError || !coach) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: stripe account does not belong to authenticated user' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            );
        }

        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
        if (!STRIPE_SECRET_KEY) {
            throw new Error('Server misconfiguration: missing STRIPE_SECRET_KEY')
        }

        const response = await stripeRequest(
            'POST',
            '/terminal/connection_tokens',
            {},
            STRIPE_SECRET_KEY,
            stripe_account_id
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
