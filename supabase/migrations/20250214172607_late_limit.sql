-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_coach;

-- Create function to handle coach creation
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
SET search_path = public
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

-- Ensure RLS is enabled
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "coaches_read" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update" ON public.coaches;
DROP POLICY IF EXISTS "coaches_insert" ON public.coaches;

-- Create new policies
CREATE POLICY "coaches_read"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_update"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_insert"
  ON public.coaches FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_coach TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;