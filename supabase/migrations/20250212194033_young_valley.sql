-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Temporarily disable RLS
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Create simplified function for coach creation
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple insert with minimal data
  INSERT INTO public.coaches (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
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

-- Drop all existing policies
DROP POLICY IF EXISTS "coaches_select_policy" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update_policy" ON public.coaches;

-- Create single simple policy for all operations
CREATE POLICY "allow_all_operations" ON public.coaches
  USING (true)
  WITH CHECK (true);

-- Grant all permissions to authenticated users
GRANT ALL ON public.coaches TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;