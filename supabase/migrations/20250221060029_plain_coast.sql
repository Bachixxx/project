-- Drop existing policies
DROP POLICY IF EXISTS "allow_coach_access" ON clients;
DROP POLICY IF EXISTS "allow_client_access" ON clients;
DROP POLICY IF EXISTS "coaches_manage_clients" ON clients;
DROP POLICY IF EXISTS "clients_read_own" ON clients;

-- Clients table policies
CREATE POLICY "allow_coach_access"
  ON clients
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "allow_client_access"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Exercises table policies
DROP POLICY IF EXISTS "Coaches can manage own exercises" ON exercises;
CREATE POLICY "allow_coach_exercises"
  ON exercises
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

-- Programs table policies
DROP POLICY IF EXISTS "Coaches can manage own programs" ON programs;
CREATE POLICY "allow_coach_programs"
  ON programs
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

-- Program exercises table policies
DROP POLICY IF EXISTS "Coaches can manage own program exercises" ON program_exercises;
CREATE POLICY "allow_coach_program_exercises"
  ON program_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_exercises.program_id
      AND programs.coach_id = auth.uid()
    )
  );

-- Client programs table policies
DROP POLICY IF EXISTS "Coaches can manage client program assignments" ON client_programs;
CREATE POLICY "allow_coach_client_programs"
  ON client_programs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_programs.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Ensure RLS is enabled for all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON clients TO authenticated;
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON programs TO authenticated;
GRANT ALL ON program_exercises TO authenticated;
GRANT ALL ON client_programs TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON clients(auth_id);
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON exercises(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON programs(coach_id);