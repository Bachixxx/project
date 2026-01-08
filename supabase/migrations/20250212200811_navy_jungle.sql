-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();
DROP FUNCTION IF EXISTS public.handle_new_user_registration();

-- Create function in auth schema with proper permissions
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new coach with data from auth.users
  INSERT INTO public.coaches (
    id,
    email,
    full_name,
    phone,
    specialization,
    subscription_type,
    client_limit,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'specialization',
    'free',
    5,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger in auth schema
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user_registration();

-- Configure RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "coaches_select" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update" ON public.coaches;
DROP POLICY IF EXISTS "coaches_insert" ON public.coaches;
DROP POLICY IF EXISTS "allow_all_operations" ON public.coaches;

-- Create specific policies
CREATE POLICY "coaches_select_own"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "coaches_update_own"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.coaches TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;