/*
  # Allow clients to view session exercises for their scheduled sessions

  1. Changes
    - Add policy to allow clients to read session_exercises for sessions scheduled for them
    - This ensures clients can see exercise details when viewing their appointments

  2. Security
    - Maintains RLS protection
    - Clients can only view exercises for sessions scheduled for them
*/

-- Add policy for clients to view session exercises for their scheduled sessions
CREATE POLICY "Clients can view exercises for their scheduled sessions"
  ON session_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM scheduled_sessions ss
      JOIN clients c ON c.id = ss.client_id
      WHERE ss.session_id = session_exercises.session_id
      AND c.auth_id = auth.uid()
    )
  );
