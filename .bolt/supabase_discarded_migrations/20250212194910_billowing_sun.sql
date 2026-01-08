-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "allow_all_operations" ON public.coaches;
DROP POLICY IF EXISTS "coaches_all_operations" ON public.coaches;

-- Create simplified function for coach creation
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple insert with minimal data
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'specialization',
    'free',
    5
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error creating coach: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Re-enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Create single simple policy for all operations
DROP POLICY IF EXISTS "allow_all_operations" ON public.coaches;
CREATE POLICY "allow_all_operations" ON public.coaches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant all permissions
GRANT ALL ON public.coaches TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;