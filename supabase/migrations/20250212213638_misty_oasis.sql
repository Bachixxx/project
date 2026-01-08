-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Create simplified function for coach registration
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the function execution
  RAISE NOTICE 'Creating coach profile for user %', NEW.id;
  
  -- Insert new coach with minimal required data
  INSERT INTO public.coaches (
    id,
    email,
    full_name,
    subscription_type,
    client_limit
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free',
    5
  );
  
  RAISE NOTICE 'Coach profile created successfully';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create coach profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user_registration();

-- Configure RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_own" ON public.coaches;
DROP POLICY IF EXISTS "allow_update_own" ON public.coaches;
DROP POLICY IF EXISTS "allow_insert" ON public.coaches;
DROP POLICY IF EXISTS "coaches_read" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update" ON public.coaches;
DROP POLICY IF EXISTS "coaches_insert" ON public.coaches;

-- Create minimal policies
CREATE POLICY "enable_read_for_users"
  ON public.coaches FOR SELECT
  USING (true);

CREATE POLICY "enable_update_for_users"
  ON public.coaches FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "enable_insert_for_service_role"
  ON public.coaches FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;