import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  try {
    // Authenticate: accept user JWT or service role key (for internal calls from DB triggers)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 401,
      });
    }
    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 401,
        });
      }
    }

    const { token: invitationToken, clientId } = await req.json();

    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email, full_name, coach:coaches(full_name)')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    // Construire l'URL d'invitation
    const invitationUrl = `${new URL(req.url).origin}/client/register?token=${invitationToken}`;

    // Simuler l'envoi d'email (à remplacer par votre service d'email)
    console.log('Sending invitation email to:', {
      to: client.email,
      subject: 'Invitation à rejoindre votre espace client',
      body: `
        Bonjour ${client.full_name},

        ${client.coach.full_name} vous invite à rejoindre votre espace client sur Coachency.

        Pour activer votre compte, cliquez sur le lien suivant :
        ${invitationUrl}

        Ce lien est valable pendant 7 jours.

        À bientôt !
        L'équipe Coachency
      `
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
