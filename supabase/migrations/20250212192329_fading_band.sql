-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Create improved function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_specialization TEXT;
BEGIN
  -- Extract metadata with proper null handling
  v_full_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_specialization := NULLIF(NEW.raw_user_meta_data->>'specialization', '');

  -- Log the received data
  RAISE NOTICE 'Creating coach for user %, metadata: %', NEW.id, NEW.raw_user_meta_data;

  -- Insert new coach with data from auth.users metadata
  INSERT INTO public.coaches (
    id,
    full_name,
    email,
    phone,
    specialization,
    subscription_type,
    client_limit,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(v_full_name, split_part(NEW.email, '@', 1)),
    NEW.email,
    v_phone,
    v_specialization,
    'free',
    5,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Coach created successfully for user %', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log detailed error information
  RAISE WARNING 'Error in handle_new_user_registration for user %: %, SQLSTATE: %',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Ensure RLS is enabled
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Update policies with clearer names and proper permissions
DROP POLICY IF EXISTS "Enable read access" ON public.coaches;
DROP POLICY IF EXISTS "Enable update access" ON public.coaches;
DROP POLICY IF EXISTS "Enable system-level insert" ON public.coaches;

-- Create new policies
CREATE POLICY "Coaches can read own data"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Coaches can update own data"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "System can create coach profiles"
  ON public.coaches FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, postgres, anon, service_role;
GRANT ALL ON public.coaches TO authenticated, postgres, anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, postgres, anon, service_role;