-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Create improved function to handle coach registration
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Log the function call
  RAISE NOTICE 'handle_new_user_registration called for user_id: %', NEW.id;
  
  -- Check if coach already exists
  SELECT COUNT(*) INTO v_count
  FROM public.coaches
  WHERE id = NEW.id;
  
  IF v_count = 0 THEN
    -- Insert new coach
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
    
    RAISE NOTICE 'New coach created with id: %', NEW.id;
  ELSE
    RAISE NOTICE 'Coach already exists with id: %', NEW.id;
  END IF;
  
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
DROP POLICY IF EXISTS "Enable read access" ON public.coaches;
DROP POLICY IF EXISTS "Enable update access" ON public.coaches;
DROP POLICY IF EXISTS "Enable insert access" ON public.coaches;

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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;