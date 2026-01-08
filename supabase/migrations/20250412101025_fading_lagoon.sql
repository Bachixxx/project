-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_coach_created ON public.coaches;
DROP FUNCTION IF EXISTS public.handle_new_coach();

-- Drop net schema and http_post function as they're no longer needed
DROP FUNCTION IF EXISTS net.http_post(text, jsonb, jsonb);
DROP SCHEMA IF EXISTS net CASCADE;

-- Ensure RLS policies are still in place
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.coaches;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'coaches' AND schemaname = 'public'
  );
END $$;

-- Create new policies with unique names
CREATE POLICY "coaches_read_20250412_v2"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_update_20250412_v2"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_insert_20250412_v2"
  ON public.coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches(id);