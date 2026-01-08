-- Supprimer toutes les politiques et triggers existants
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();
DROP FUNCTION IF EXISTS public.handle_new_user_registration();

-- Désactiver temporairement RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$ 
BEGIN
  -- Supprimer toutes les politiques sur la table coaches
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.coaches;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'coaches' AND schemaname = 'public'
  );
END $$;

-- Créer une table temporaire pour stocker les données d'inscription
CREATE TABLE IF NOT EXISTS public.registration_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fonction simplifiée pour créer un coach
CREATE OR REPLACE FUNCTION public.create_coach(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.coaches (
    id,
    email,
    full_name,
    phone,
    specialization,
    subscription_type,
    client_limit
  ) VALUES (
    p_user_id,
    p_email,
    COALESCE(p_full_name, split_part(p_email, '@', 1)),
    p_phone,
    p_specialization,
    'free',
    5
  );
END;
$$;

-- Activer RLS avec une politique simple
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON public.coaches
  USING (true)
  WITH CHECK (true);

-- Donner les permissions nécessaires
GRANT ALL ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;