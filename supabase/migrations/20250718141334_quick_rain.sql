/*
  # Add RLS policies for clients to access program sessions and sessions

  1. New Policies
    - Clients can read program_sessions for their assigned programs
    - Clients can read sessions that are part of their assigned programs
    - Clients can read session_exercises for sessions in their programs

  2. Security
    - All policies ensure clients can only access data related to their assigned programs
*/

-- Allow clients to read program_sessions for their assigned programs
CREATE POLICY "Clients can read program sessions for assigned programs"
  ON program_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_programs cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.program_id = program_sessions.program_id
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to read sessions that are part of their assigned programs
CREATE POLICY "Clients can read sessions for assigned programs"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_sessions ps
      JOIN client_programs cp ON cp.program_id = ps.program_id
      JOIN clients c ON c.id = cp.client_id
      WHERE ps.session_id = sessions.id
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to read session_exercises for sessions in their programs
CREATE POLICY "Clients can read session exercises for assigned programs"
  ON session_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN program_sessions ps ON ps.session_id = s.id
      JOIN client_programs cp ON cp.program_id = ps.program_id
      JOIN clients c ON c.id = cp.client_id
      WHERE s.id = session_exercises.session_id
      AND c.auth_id = auth.uid()
    )
  );