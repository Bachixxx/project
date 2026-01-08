/*
  # Fix Coaches RLS Policies
  
  1. Changes
    - Drop existing RLS policies for coaches table
    - Create new policies that allow:
      - Anyone to insert their own data during registration
      - Authenticated users to read their own data
      - Authenticated users to update their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can read own data" ON coaches;

-- Create new policies
CREATE POLICY "Enable insert for registration"
  ON coaches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON coaches FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
  ON coaches FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);