import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Secret Key from Adapty (Settings -> General -> API Keys -> Secret Key)
const ADAPTY_SECRET_KEY = Deno.env.get("ADAPTY_SECRET_KEY");

// Supabase Setup
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // 1. Verify User (Supabase Auth)
        // We create a client with the user's token to verify identity
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        const customerUserId = user.id;

        if (!ADAPTY_SECRET_KEY) {
            console.error("Missing ADAPTY_SECRET_KEY");
            throw new Error("Server misconfiguration");
        }

        // 2. Query Adapty API
        // GET https://api.adapty.io/api/v1/sdk/profiles/{customer_user_id}
        const response = await fetch(`https://api.adapty.io/api/v1/sdk/profiles/${customerUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Api-Key ${ADAPTY_SECRET_KEY}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Adapty API Error:', errText);
            throw new Error('Failed to verify subscription with Adapty');
        }

        const body = await response.json();
        const profile = body.data?.attributes;

        if (!profile) {
            throw new Error('Profile not found in Adapty');
        }

        // 3. Check Entitlement
        const accessLevels = profile.access_levels || {};
        const premiumAccess = accessLevels['premium'];

        if (premiumAccess && premiumAccess.is_active) {

            // Logic for Subscription Updates
            const expiresAt = premiumAccess.expires_at;
            const isLifetime = premiumAccess.is_lifetime;

            // Update Coach Record (Service Role)
            const { error } = await supabase
                .from('coaches')
                .update({
                    subscription_type: 'paid',
                    client_limit: null, // Unlimited
                    subscription_end_date: isLifetime ? '2099-12-31T23:59:59Z' : expiresAt,
                })
                .eq('id', customerUserId);

            if (error) throw error;
            console.log(`Synced coach ${customerUserId} to PAID (Expires: ${isLifetime ? 'Lifetime' : expiresAt})`);

            return new Response(JSON.stringify({ success: true, status: 'paid' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });

        } else {
            // Update Coach to FREE
            const { error } = await supabase
                .from('coaches')
                .update({
                    subscription_type: 'free',
                    client_limit: 5,
                    subscription_end_date: null,
                })
                .eq('id', customerUserId);

            if (error) throw error;
            console.log(`Synced coach ${customerUserId} to FREE`);

            return new Response(JSON.stringify({ success: true, status: 'free' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

    } catch (error: any) {
        console.error("Sync Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
