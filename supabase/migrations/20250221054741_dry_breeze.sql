-- Drop existing policies
DROP POLICY IF EXISTS "coaches_manage_clients" ON clients;
DROP POLICY IF EXISTS "clients_read_own" ON clients;

-- Create simplified policy for coaches
CREATE POLICY "allow_coach_access"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    -- Allow access if the user is the coach
    coach_id = auth.uid()
  );

-- Create policy for clients
CREATE POLICY "allow_client_access"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access if the user is the client
    auth_id = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON clients TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON clients(auth_id);