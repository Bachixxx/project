-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_full_name TEXT;
BEGIN
  -- Get the full name from metadata or use email as fallback
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- Check if coach already exists
  SELECT COUNT(*) INTO v_count
  FROM public.coaches
  WHERE id = NEW.id;

  IF v_count = 0 THEN
    -- Insert new coach with default values
    INSERT INTO public.coaches (
      id,
      full_name,
      email,
      subscription_type,
      client_limit,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      'free',
      5,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't prevent user creation
  RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER INSERT with proper timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Ensure RLS is enabled but allow system-level inserts
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Update policies to ensure proper access
DROP POLICY IF EXISTS "Enable read access" ON public.coaches;
DROP POLICY IF EXISTS "Enable update access" ON public.coaches;
DROP POLICY IF EXISTS "Enable insert access" ON public.coaches;

-- Create policies with proper permissions
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