import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of the context
interface AuthContextType {
  signUp: (data: any) => Promise<{ data: any; error: any }>;
  signIn: (data: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (password: string) => Promise<{ data: any; error: any }>;
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Récupérer la session initiale avec gestion d'erreur
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        // Gérer silencieusement les erreurs de token de rafraîchissement
        if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token')) {
          console.log('Session expired, user will need to re-authenticate');
          await supabase.auth.signOut();
        } else {
          console.error('Session error:', error);
        }
        setUser(null);
      } else {
        setUser(session?.user ?? null);

        // OneSignal Login for Coach
        if (session?.user) {
          // @ts-ignore
          if (window.OneSignalDeferred) {
            // @ts-ignore
            window.OneSignalDeferred.push(function (OneSignal) {
              OneSignal.login(session.user.id);
              OneSignal.User.addTag("role", "coach");
            });
          }
        }
      }
      setLoading(false);
    }).catch(async (error) => {
      console.log('Authentication session recovery failed, user will need to re-authenticate');
      // Clear any invalid tokens
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    });

    // Écouter les changements d'authentification avec gestion d'erreur
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setIsPasswordRecovery(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery mode detected');
        setIsPasswordRecovery(true);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, options = {} }: any) => {
    try {
      // Créer l'utilisateur dans Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // Vérifier si un profil coach existe déjà
      const { data: existingCoach, error: coachQueryError } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (coachQueryError) {
        console.error('Error checking for existing coach:', coachQueryError);
        throw new Error('Failed to check for existing coach profile');
      }

      if (!existingCoach) {
        // Créer le profil coach
        const { error: coachError } = await supabase
          .from('coaches')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: options.data?.full_name || email.split('@')[0],
            phone: options.data?.phone || null,
            specialization: options.data?.specialization || null,
            subscription_type: 'free',
            client_limit: 5
          } as any); // Type assertion for insert if needed

        if (coachError) {
          console.error('Error creating coach profile:', coachError);
          // En cas d'erreur lors de la création du profil, on déconnecte l'utilisateur
          await supabase.auth.signOut();
          throw new Error('Failed to create coach profile. Please try again.');
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (data: any) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
      return { data: authData, error: null };
    } catch (error) {
      console.error('SignIn error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // OneSignal Logout
      try {
        // @ts-ignore
        if (window.OneSignalDeferred) {
          // @ts-ignore
          window.OneSignalDeferred.push(function (OneSignal) {
            OneSignal.logout();
          });
        }
      } catch (osError) {
        console.error('OneSignal logout error:', osError);
      }

      if (error) throw error;

      // Explicitly clear state on success
      setUser(null);
    } catch (error: any) {
      // Ignore if session is already missing (user is effectively logged out)
      if (error?.message?.includes('Auth session missing') || error?.name === 'AuthSessionMissingError') {
        setUser(null);
        localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token'); // Force clear Supabase token
        return;
      }
      console.error('SignOut error:', error);
      // Force cleanup even on error
      setUser(null);
      localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    user,
    loading,
    isPasswordRecovery
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}