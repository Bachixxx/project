import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationsContext';

// Define the shape of the context
interface ClientAuthContextType {
  signIn: (data: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  client: any | null;
  loading: boolean;
  refreshClient: () => Promise<void>;
  isPasswordRecovery: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const { login, logout: logoutOneSignal, addTag } = useNotifications();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        // Gérer silencieusement les erreurs de token de rafraîchissement
        if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token')) {
          console.log('Client session expired, user will need to re-authenticate');
          await supabase.auth.signOut();
        } else {
          console.error('Client session error:', error);
        }
        setClient(null);
        setLoading(false);
      } else if (session?.user) {
        fetchClientData(session.user);
      } else {
        setClient(null);
        setLoading(false);
      }
    }).catch(async (error) => {
      console.log('Client authentication session recovery failed, user will need to re-authenticate');
      // Clear any invalid tokens
      await supabase.auth.signOut();
      setClient(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Client token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('Client signed out');
        setIsPasswordRecovery(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('Client password recovery mode detected');
        setIsPasswordRecovery(true);
      }

      if (session?.user) {
        fetchClientData(session.user);
      } else {
        setClient(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchClientData = async (user) => {
    try {
      console.log("Fetching client data for user:", user.id);

      // First try to fetch client data using auth_id
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_id', user.id)
        .limit(1);

      const clientData = clients?.[0];

      if (error) {
        console.error("Error fetching client by auth_id:", error);
        throw error;
      }

      if (clientData) {
        console.log("Client data found:", clientData);
        setClient(clientData);

        // OneSignal Login for Client via Context (Handles Web & Native)
        login(user.id);
        addTag("role", "client");
        // Add coach_id tag if available to group clients by coach
        if (clientData.coach_id) {
          addTag("coach_id", clientData.coach_id);
        }
      } else {
        console.log("No client found with auth_id:", user.id);

        // Try to fetch by email as fallback
        const { data: emailClients, error: emailError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .limit(1);

        const emailClientData = emailClients?.[0];

        if (emailError) {
          console.error("Error fetching client by email:", emailError);
          throw emailError;
        }

        if (emailClientData) {
          console.log("Client found by email, updating auth_id:", emailClientData);

          // Update the client with the auth_id
          const { error: updateError } = await supabase
            .from('clients')
            .update({ auth_id: user.id })
            .eq('id', emailClientData.id);

          if (updateError) {
            console.error("Error updating client auth_id:", updateError);
            throw updateError;
          }

          // Set client with updated auth_id
          setClient({ ...emailClientData, auth_id: user.id });
        } else {
          console.log("No client found with email:", user.email);
          setClient(null);
        }
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      console.log("Client attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Client sign in error:", error);
        throw error;
      }

      // Verify the user is a client and not a coach
      if (data.user) {
        // Check if user is a coach
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (coachData) {
          // User is a coach, not a client
          await supabase.auth.signOut();
          return {
            data: null,
            error: new Error('Ce compte est un compte coach. Veuillez utiliser l\'espace coach.')
          };
        }

        console.log("Client signed in successfully, fetching client data");
        await fetchClientData(data.user);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      // OneSignal Logout
      logoutOneSignal();

      setClient(null);
      localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token');
    } catch (error: any) {
      // Ignore if session is already missing
      if (error?.message?.includes('Auth session missing') || error?.name === 'AuthSessionMissingError') {
        setClient(null);
        localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token');
        return;
      }
      console.error('Error signing out:', error);
      setClient(null);
      localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token');
    }
  };

  // Fix the refreshClient function to use the new name
  const value = {
    signIn,
    signOut,
    client,
    loading,
    refreshClient: async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        await fetchClientData(data.user);
      }
    },
    isPasswordRecovery
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}