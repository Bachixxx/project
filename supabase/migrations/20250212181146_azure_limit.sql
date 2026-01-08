-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS to ensure clean state
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Create improved function to handle coach registration
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new coach with default values
  INSERT INTO public.coaches (
    id,
    full_name,
    email,
    subscription_type,
    client_limit
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'free',
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs with elevated privileges
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Re-enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read own data" ON public.coaches;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.coaches;
DROP POLICY IF EXISTS "Allow system to insert data" ON public.coaches;

-- Create simplified policies
CREATE POLICY "Enable read access"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable update access"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable insert access"
  ON public.coaches FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());