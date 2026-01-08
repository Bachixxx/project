/*
  # Fix client visibility of scheduled sessions

  1. Changes
    - Drop the existing client view policy that uses a subquery
    - Create a new, simpler policy that directly checks the client's auth_id
    - This ensures clients can see their scheduled sessions reliably

  2. Security
    - Maintains RLS protection
    - Clients can only view sessions where they are the assigned client
    - Uses a more direct and reliable policy condition
*/

-- Drop the existing client view policy
DROP POLICY IF EXISTS "Clients can view their scheduled sessions" ON scheduled_sessions;

-- Create a simpler, more direct policy for clients
CREATE POLICY "Clients can view their scheduled sessions"
  ON scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );
