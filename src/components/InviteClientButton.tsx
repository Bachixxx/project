import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InviteClientButtonProps {
  clientId: string;
  onInviteSent?: () => void;
}

export function InviteClientButton({ clientId, onInviteSent }: InviteClientButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setLoading(true);
      
      // Appeler la fonction RPC pour autoriser l'inscription
      const { data, error } = await supabase.rpc('allow_client_registration', { 
          p_client_id: clientId
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      // Notifier le composant parent
      onInviteSent?.();

      // Afficher un message de succès
      alert('Le client peut maintenant créer son compte pendant 10 minutes'); 
    } catch (error) {
      console.error('Error allowing registration:', error);
      alert('Erreur lors de l\'activation de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleInvite}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <Send className="mr-2 h-4 w-4" />
      {loading ? 'Activation...' : 'Autoriser inscription'}
    </button>
  );
}