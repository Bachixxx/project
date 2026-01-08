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
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating coach: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user_registration();

-- Ensure RLS is enabled
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "allow_read_own"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "allow_update_own"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "allow_insert"
  ON public.coaches FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;