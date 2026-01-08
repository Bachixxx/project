/*
  # Allow clients to view exercises in their scheduled sessions

  1. Changes
    - Add policy to allow clients to read exercises that are in sessions scheduled for them
    - This ensures clients can see exercise details when starting a training session

  2. Security
    - Maintains RLS protection
    - Clients can only view exercises for sessions scheduled for them
*/

-- Add policy for clients to view exercises in their scheduled sessions
CREATE POLICY "Clients can read exercises in their scheduled sessions"
  ON exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM session_exercises se
      JOIN scheduled_sessions ss ON ss.session_id = se.session_id
      JOIN clients c ON c.id = ss.client_id
      WHERE se.exercise_id = exercises.id
      AND c.auth_id = auth.uid()
    )
  );
