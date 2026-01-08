-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Create improved function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'specialization',
    'free',
    5,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't prevent user creation
  RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
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

-- Update policies
DROP POLICY IF EXISTS "Enable read access" ON public.coaches;
DROP POLICY IF EXISTS "Enable update access" ON public.coaches;
DROP POLICY IF EXISTS "Enable system-level insert" ON public.coaches;

-- Create new policies
CREATE POLICY "Enable read access"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable update access"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable system-level insert"
  ON public.coaches FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, postgres, anon, service_role;
GRANT ALL ON public.coaches TO authenticated, postgres, anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, postgres, anon, service_role;