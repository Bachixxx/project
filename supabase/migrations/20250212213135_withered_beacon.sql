-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Create function in auth schema
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
    client_limit
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'specialization',
    'free',
    5
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
DROP POLICY IF EXISTS "allow_read_own_data" ON public.coaches;
DROP POLICY IF EXISTS "allow_update_own_data" ON public.coaches;
DROP POLICY IF EXISTS "allow_system_insert" ON public.coaches;

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
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;