import { supabase } from './supabase';

export async function createClientInvitation(clientId: string) {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (!client?.email) {
      throw new Error('Client email not found');
    }

    // Créer l'invitation
    const { data: token, error: inviteError } = await supabase
      .rpc('create_client_invitation', {
        p_client_id: clientId,
        p_email: client.email
      });

    if (inviteError) throw inviteError;

    // Envoyer l'email via l'Edge Function
    // No explicit Authorization header: supabase.functions.invoke() automatically
    // sends the current session token, which is required by send-invitation.
    const { error: sendError } = await supabase.functions.invoke('send-invitation', {
      body: { token, clientId },
    });

    if (sendError) throw sendError;

    return token;
  } catch (error) {
    console.error('Error creating client invitation:', error);
    throw error;
  }
}

export async function validateClientInvitation(token: string) {
  try {
    const { data, error } = await supabase
      .rpc('validate_client_invitation', {
        p_token: token
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error validating client invitation:', error);
    throw error;
  }
}

export async function acceptClientInvitation(token: string, authId: string) {
  try {
    const { data, error } = await supabase
      .rpc('accept_client_invitation', {
        p_token: token,
        p_auth_id: authId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error accepting client invitation:', error);
    throw error;
  }
}

export async function sendClientInvitation(
  clientEmail: string,
  clientName: string,
  coachCode: string,
  coachName: string
) {
  const inviteUrl = `${window.location.origin}/client/register?code=${coachCode}&email=${encodeURIComponent(clientEmail)}`;

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: clientEmail,
      template_name: 'client.invite',
      data: {
        coach_name: coachName,
        client_name: clientName,
        invite_url: inviteUrl
      }
    }
  });

  if (error) throw error;
}