-- Créer une nouvelle table simplifiée pour les coachs
CREATE TABLE IF NOT EXISTS public.coach_ok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.coach_ok ENABLE ROW LEVEL SECURITY;

-- Créer une politique simple pour permettre toutes les opérations
CREATE POLICY "allow_all" ON public.coach_ok
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Créer une fonction pour insérer un nouveau coach
CREATE OR REPLACE FUNCTION public.create_coach_ok(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  INSERT INTO public.coach_ok (
    auth_id,
    email,
    full_name,
    phone,
    specialization
  ) VALUES (
    p_auth_id,
    p_email,
    p_full_name,
    p_phone,
    p_specialization
  )
  RETURNING id INTO v_coach_id;
  
  RETURN v_coach_id;
END;
$$;

-- Donner les permissions nécessaires
GRANT ALL ON public.coach_ok TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;