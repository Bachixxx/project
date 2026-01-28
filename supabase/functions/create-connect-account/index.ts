import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Verify user authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) {
            throw new Error('Invalid user token')
        }

        // Check if coach profile exists
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('stripe_account_id, email, full_name')
            .eq('id', user.id)
            .single()

        if (coachError) throw coachError

        let accountId = coach.stripe_account_id

        // Create Stripe Account if doesn't exist
        if (!accountId) {
            console.log('Creating new Stripe Express account...')
            const account = await stripe.accounts.create({
                type: 'express',
                email: coach.email,
                business_type: 'individual',
                business_profile: {
                    name: coach.full_name,
                    product_description: "Services de coaching sportif personnalisés"
                },
                metadata: {
                    supabase_user_id: user.id
                }
            })
            accountId = account.id

            // Save to Supabase
            await supabase
                .from('coaches')
                .update({ stripe_account_id: accountId })
                .eq('id', user.id)
        }

        // Create Account Link for onboarding
        console.log(`Creating account link for ${accountId}...`)
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${req.headers.get('origin')}/profile?stripe_connect=refresh`,
            return_url: `${req.headers.get('origin')}/profile?stripe_connect=success`,
            type: 'account_onboarding',
        })

        return new Response(
            JSON.stringify({ url: accountLink.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
