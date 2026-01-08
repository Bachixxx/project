import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { token, clientId } = await req.json();

    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email, full_name, coach:coaches(full_name)')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    // Construire l'URL d'invitation
    const invitationUrl = `${new URL(req.url).origin}/client/register?token=${token}`;

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
          ...corsHeaders,
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
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});