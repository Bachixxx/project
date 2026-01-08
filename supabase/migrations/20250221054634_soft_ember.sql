-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can manage their clients" ON clients;
DROP POLICY IF EXISTS "Clients can read own data" ON clients;
DROP POLICY IF EXISTS "Allow public email check" ON clients;

-- Create new policies with proper permissions
CREATE POLICY "coaches_manage_clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    -- Coaches can see and manage their own clients
    coach_id = auth.uid()
  )
  WITH CHECK (
    -- Coaches can only insert/update clients assigned to them
    coach_id = auth.uid()
  );

CREATE POLICY "clients_read_own"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    -- Clients can only see their own data
    auth_id = auth.uid()
  );

-- Grant necessary permissions
GRANT ALL ON clients TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON clients(auth_id);