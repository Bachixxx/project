/*
  # Add RLS policy for clients to access their programs

  1. Security
    - Add policy for clients to read their own client_programs
    - Add policy for clients to read programs they're assigned to
    - Add policy for clients to read program exercises for their programs
*/

-- Allow clients to read their own client_programs
CREATE POLICY "Clients can read their own programs"
  ON client_programs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_programs.client_id 
      AND clients.auth_id = auth.uid()
    )
  );

-- Allow clients to read programs they're assigned to
CREATE POLICY "Clients can read assigned programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_programs cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.program_id = programs.id
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to read program exercises for their assigned programs
CREATE POLICY "Clients can read program exercises for assigned programs"
  ON program_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_programs cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.program_id = program_exercises.program_id
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to read exercises that are part of their assigned programs
CREATE POLICY "Clients can read exercises in their programs"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_exercises pe
      JOIN client_programs cp ON cp.program_id = pe.program_id
      JOIN clients c ON c.id = cp.client_id
      WHERE pe.exercise_id = exercises.id
      AND c.auth_id = auth.uid()
    )
  );