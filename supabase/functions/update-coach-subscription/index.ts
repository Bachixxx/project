import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    // Parse request body
    const { coachId } = await req.json();

    // Validate required parameters
    if (!coachId) {
      return new Response(
        JSON.stringify({ error: 'Coach ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Get subscription plan ID
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('interval', 'month')
      .eq('is_test', true)
      .single();

    if (planError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription plan' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Update coach subscription
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        subscription_type: 'paid',
        subscription_plan_id: plan.id,
        client_limit: null, // unlimited clients
      })
      .eq('id', coachId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update coach subscription' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});