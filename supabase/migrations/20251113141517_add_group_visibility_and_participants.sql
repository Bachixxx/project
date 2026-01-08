/*
  # Add group visibility and participants table

  1. Changes to appointments table
    - Add `group_visibility` column
      - Values: 'public' (anyone can join up to max_participants) or 'private' (only invited clients)
      - Default: 'public'
  
  2. New Tables
    - `appointment_participants` - Junction table for private group sessions
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, references appointments)
      - `client_id` (uuid, references clients)
      - `status` (text) - Status: 'invited', 'confirmed', 'declined'
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on `appointment_participants` table
    - Coaches can manage participants for their appointments
    - Clients can view their own participations
*/

-- Add group_visibility to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'group_visibility'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN group_visibility text DEFAULT 'public',
    ADD CONSTRAINT appointments_group_visibility_check 
      CHECK (group_visibility IN ('public', 'private'));
  END IF;
END $$;

-- Create appointment_participants table
CREATE TABLE IF NOT EXISTS appointment_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'invited' NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT appointment_participants_status_check CHECK (status IN ('invited', 'confirmed', 'declined')),
  CONSTRAINT appointment_participants_unique UNIQUE (appointment_id, client_id)
);

ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view participants for their appointments"
  ON appointment_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can add participants to their appointments"
  ON appointment_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update participants for their appointments"
  ON appointment_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete participants from their appointments"
  ON appointment_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.coach_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their own participations"
  ON appointment_participants FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT auth_id FROM clients WHERE id = client_id)
  );

CREATE INDEX IF NOT EXISTS idx_appointment_participants_appointment ON appointment_participants(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_participants_client ON appointment_participants(client_id);