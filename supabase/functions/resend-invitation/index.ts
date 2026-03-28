import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = origin === 'https://coachency.app'
    || origin === 'https://www.coachency.app'
    || origin === 'https://melodious-faun-62e372.netlify.app'
    || origin.endsWith('--melodious-faun-62e372.netlify.app');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://coachency.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Always returns { success: true } regardless of outcome — no information leak.
// No auth required: this is a public endpoint for clients who can't log in.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  const ok = (req: Request) => new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
  );

  try {
    const { email } = await req.json();
    if (!email) return ok(req);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up client by email (service role — bypasses RLS)
    const { data: client } = await supabase
      .from('clients')
      .select('id, auth_id, full_name, coach:coaches(full_name, coach_code)')
      .eq('email', email)
      .maybeSingle();

    // Not found or already registered — return success silently
    if (!client || client.auth_id) return ok(req);

    // Open 24h registration window
    await supabase
      .from('clients')
      .update({ registration_access_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', client.id);

    // Send invitation email via send-email function (internal call with service role)
    const inviteUrl = `https://coachency.app/client/register?code=${client.coach.coach_code}&email=${encodeURIComponent(email)}`;
    await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        template_name: 'client.invite',
        data: {
          coach_name: client.coach.full_name,
          client_name: client.full_name,
          invite_url: inviteUrl,
        }
      }
    });

    return ok(req);
  } catch (error) {
    console.error('Error in resend-invitation:', error);
    // Always return success — don't reveal errors to caller
    return ok(req);
  }
});
