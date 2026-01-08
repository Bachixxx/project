/*
  # Create session_registrations table

  1. New Tables
    - `session_registrations`
      - `id` (uuid, primary key)
      - `scheduled_session_id` (uuid, references scheduled_sessions)
      - `client_id` (uuid, references clients)
      - `coach_id` (uuid, references coaches) - The coach who owns the session
      - `registration_date` (timestamptz) - When the client registered
      - `status` (text) - Status: 'registered', 'cancelled', 'attended', 'no_show'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `session_registrations` table
    - Clients can register for and view their registrations
    - Coaches can view registrations for their sessions
    - Unique constraint: one client can only register once per session

  3. Notes
    - This table links clients to group sessions (scheduled_sessions with group_public type)
    - Allows multiple clients to sign up for the same group session
*/

CREATE TABLE IF NOT EXISTS session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id uuid REFERENCES scheduled_sessions(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT session_registrations_status_check CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
  CONSTRAINT unique_registration UNIQUE (scheduled_session_id, client_id)
);

ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their registrations"
  ON session_registrations FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id)
  );

CREATE POLICY "Clients can register for sessions"
  ON session_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id)
  );

CREATE POLICY "Clients can cancel their registrations"
  ON session_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id))
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Clients can delete their registrations"
  ON session_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Coaches can view registrations for their sessions"
  ON session_registrations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = coach_id
  );

CREATE POLICY "Coaches can update registrations for their sessions"
  ON session_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_session_registrations_scheduled_session ON session_registrations(scheduled_session_id);
CREATE INDEX IF NOT EXISTS idx_session_registrations_client ON session_registrations(client_id);
CREATE INDEX IF NOT EXISTS idx_session_registrations_coach ON session_registrations(coach_id);