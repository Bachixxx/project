
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { stripe_account_id } = await req.json()

        // 1. Validation de base
        if (!stripe_account_id) {
            throw new Error('Missing stripe_account_id')
        }

        // 2. Récupérer la clé API Stripe
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
        if (!STRIPE_SECRET_KEY) {
            throw new Error('Server misconfiguration: missing STRIPE_SECRET_KEY')
        }

        // 3. Appel Direct à l'API Stripe pour créer le connection_token
        // https://docs.stripe.com/api/terminal/connection_tokens/create
        const response = await stripeRequest(
            'POST',
            '/terminal/connection_tokens',
            {}, // Body empty usually sufficient for default location if not using explicit locations
            STRIPE_SECRET_KEY,
            stripe_account_id // IMPORTANT: On create token ON BEHALF of the connected account
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
