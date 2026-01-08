-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Create simplified function for coach creation without external dependencies
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
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't prevent user creation
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

-- Drop ALL existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop all policies on coaches table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.coaches;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'coaches' AND schemaname = 'public'
  );
END $$;

-- Create new policies with unique names
CREATE POLICY "coaches_read_20250412"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_update_20250412"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_insert_20250412"
  ON public.coaches
  FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coaches_id ON public.coaches(id);