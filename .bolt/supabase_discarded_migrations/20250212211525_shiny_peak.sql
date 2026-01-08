-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Create simplified function for coach creation
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE LOG 'Creating coach for user: %, email: %, metadata: %', 
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data;

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

  RAISE LOG 'Coach created successfully';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating coach: %', SQLERRM;
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
DROP POLICY IF EXISTS "coaches_select_own" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update_own" ON public.coaches;

-- Create simplified policies
CREATE POLICY "allow_insert" ON public.coaches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_select" ON public.coaches
  FOR SELECT USING (true);

CREATE POLICY "allow_update" ON public.coaches
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON public.coaches TO authenticated, anon, service_role;