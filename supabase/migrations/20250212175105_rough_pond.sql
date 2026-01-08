-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can read own data" ON coaches;
DROP POLICY IF EXISTS "Enable insert for registration" ON coaches;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON coaches;
DROP POLICY IF EXISTS "Enable update for own profile" ON coaches;

-- Create new policies that properly handle registration and data access
CREATE POLICY "Enable insert for authentication"
  ON coaches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable read access for own data"
  ON coaches FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable update for own data"
  ON coaches FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;