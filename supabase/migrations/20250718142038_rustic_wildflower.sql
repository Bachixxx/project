/*
  # Fix RLS policies for client workout functionality

  1. Programs Table
    - Add policy for clients to view their assigned programs
  2. Workout Sessions Table  
    - Add policies for clients to create and manage their workout sessions
  3. Security
    - Ensure clients can only access their own data
    - Allow proper CRUD operations for workout functionality
*/

-- Allow clients to view programs assigned to them
CREATE POLICY "Allow clients to view their assigned programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM client_programs cp 
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.program_id = programs.id 
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to create workout sessions for their programs
CREATE POLICY "Allow clients to create their workout sessions"
  ON workout_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM client_programs cp 
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id 
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to read their own workout sessions
CREATE POLICY "Allow clients to read their workout sessions"
  ON workout_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM client_programs cp 
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id 
      AND c.auth_id = auth.uid()
    )
  );

-- Allow clients to update their own workout sessions
CREATE POLICY "Allow clients to update their workout sessions"
  ON workout_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM client_programs cp 
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id 
      AND c.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM client_programs cp 
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id 
      AND c.auth_id = auth.uid()
    )
  );