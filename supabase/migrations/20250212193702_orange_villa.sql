-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "coaches_select" ON public.coaches;
DROP POLICY IF EXISTS "coaches_insert" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update" ON public.coaches;

-- Create simplified function for coach creation
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new coach with minimal required data
  INSERT INTO public.coaches (
    id,
    full_name,
    email,
    subscription_type,
    client_limit
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'free',
    5
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating coach: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Re-enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Create minimal policies
CREATE POLICY "coaches_select_policy"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "coaches_update_policy"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Grant minimal permissions
GRANT SELECT, UPDATE ON public.coaches TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;