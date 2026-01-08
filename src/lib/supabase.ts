import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Gérer les erreurs de rafraîchissement de token de manière silencieuse
    onAuthStateChange: (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed, but this is handled by the auth contexts
        console.log('Token refresh failed - user will be redirected to login');
      }
    }
  }
})