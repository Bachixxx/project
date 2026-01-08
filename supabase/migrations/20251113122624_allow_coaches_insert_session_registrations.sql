/*
  # Allow coaches to create session registrations

  1. Changes
    - Add INSERT policy for coaches to create session registrations for their clients
    
  2. Security
    - Coaches can only create registrations for their own clients
    - Validates that the coach_id matches the authenticated user
*/

DROP POLICY IF EXISTS "Coaches can create registrations for their sessions" ON session_registrations;

CREATE POLICY "Coaches can create registrations for their sessions"
  ON session_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);