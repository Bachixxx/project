-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Drop ALL existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.coaches;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'coaches' AND schemaname = 'public'
  );
END $$;

-- Create new policies with proper permissions
CREATE POLICY "coaches_read_20250412_v3"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_update_20250412_v3"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_insert_20250412_v3"
  ON public.coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches(id);