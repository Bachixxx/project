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
    const { error: sendError } = await supabase.functions.invoke('send-invitation', {
      body: { token, clientId },
      headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
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