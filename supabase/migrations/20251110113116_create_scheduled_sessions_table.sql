/*
  # Create scheduled_sessions table

  1. New Tables
    - `scheduled_sessions`
      - `id` (uuid, primary key)
      - `coach_id` (uuid, references coaches)
      - `client_id` (uuid, references clients)
      - `session_id` (uuid, references sessions)
      - `scheduled_date` (timestamptz) - The date and time when the session is scheduled
      - `status` (text) - Status: 'scheduled', 'completed', 'cancelled', 'no_show'
      - `notes` (text) - Optional notes from coach
      - `completed_at` (timestamptz) - When the session was marked as completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scheduled_sessions` table
    - Coaches can view/manage sessions for their clients
    - Clients can view their own scheduled sessions
*/

CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  scheduled_date timestamptz NOT NULL,
  status text DEFAULT 'scheduled' NOT NULL,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT scheduled_sessions_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);

ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their scheduled sessions"
  ON scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = coach_id
  );

CREATE POLICY "Coaches can create scheduled sessions"
  ON scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = coach_id
  );

CREATE POLICY "Coaches can update their scheduled sessions"
  ON scheduled_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their scheduled sessions"
  ON scheduled_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their scheduled sessions"
  ON scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id)
  );

CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_coach ON scheduled_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_client ON scheduled_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON scheduled_sessions(scheduled_date);