-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can read own data" ON coaches;
DROP POLICY IF EXISTS "Enable insert for registration" ON coaches;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON coaches;
DROP POLICY IF EXISTS "Enable update for own profile" ON coaches;
DROP POLICY IF EXISTS "Enable insert for authentication" ON coaches;
DROP POLICY IF EXISTS "Enable read access for own data" ON coaches;
DROP POLICY IF EXISTS "Enable update for own data" ON coaches;

-- Temporarily disable RLS to ensure clean state
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "Allow insert during signup"
  ON coaches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read own data"
  ON coaches FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own data"
  ON coaches FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(id);