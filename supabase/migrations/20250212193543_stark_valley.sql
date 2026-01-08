-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

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

-- Re-enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access" ON public.coaches;
DROP POLICY IF EXISTS "Enable update access" ON public.coaches;
DROP POLICY IF EXISTS "Enable system-level insert" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can read own data" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can update own data" ON public.coaches;
DROP POLICY IF EXISTS "System can create coach profiles" ON public.coaches;

-- Create new policies with proper permissions
CREATE POLICY "coaches_select"
  ON public.coaches
  FOR SELECT
  USING (
    -- Allow authenticated users to read their own data
    (auth.uid() = id AND auth.role() = 'authenticated') OR
    -- Allow service role to read all data
    auth.role() = 'service_role'
  );

CREATE POLICY "coaches_insert"
  ON public.coaches
  FOR INSERT
  WITH CHECK (
    -- Allow service role to insert data (for trigger)
    auth.role() = 'service_role' OR
    -- Allow authenticated users to insert their own data
    (auth.uid() = id AND auth.role() = 'authenticated')
  );

CREATE POLICY "coaches_update"
  ON public.coaches
  FOR UPDATE
  USING (auth.uid() = id AND auth.role() = 'authenticated')
  WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON public.coaches TO service_role;
GRANT SELECT, UPDATE ON public.coaches TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;