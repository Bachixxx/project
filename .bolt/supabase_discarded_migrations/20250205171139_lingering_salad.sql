-- First, remove any foreign key constraints that reference programs
ALTER TABLE program_exercises
  DROP CONSTRAINT IF EXISTS program_exercises_program_id_fkey;

ALTER TABLE client_programs
  DROP CONSTRAINT IF EXISTS client_programs_program_id_fkey;

-- Drop program-related tables
DROP TABLE IF EXISTS program_exercises;
DROP TABLE IF EXISTS client_programs;
DROP TABLE IF EXISTS programs;

-- Update appointments table to ensure it has all needed fields
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Create index for payment status
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status
  ON appointments(payment_status);

-- Update RLS policies for appointments
DROP POLICY IF EXISTS "Coaches can manage own appointments" ON appointments;

CREATE POLICY "Coaches can manage own appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());