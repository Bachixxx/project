/*
  # Add Appointment ID to Workout Logs

  1. Issue
    - The `workout_logs` table was originally designed only for `scheduled_sessions`.
    - New "Appointments" system creates logs with `appointment_id`, but the column is missing in the database.
    - This causes workout data to be lost (save fails silently or logs are rejected).

  2. Changes
    - Add `appointment_id` column to `workout_logs`.
    - Add foreign key to `appointments`.
    - Add unique constraint for upsert functionality: `(appointment_id, exercise_id, set_number)`.

  3. Security
    - Clean schema update.
*/

DO $$ 
BEGIN 
  -- 1. Add column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'appointment_id') THEN
    ALTER TABLE public.workout_logs 
    ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
  END IF;

  -- 2. Add Unique Constraint for UPSERT operations (if not exists)
  -- naming convention: workout_logs_appointment_id_exercise_id_set_number_key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_logs_appointment_id_exercise_id_set_number_key'
  ) THEN
    ALTER TABLE public.workout_logs
    ADD CONSTRAINT workout_logs_appointment_id_exercise_id_set_number_key
    UNIQUE (appointment_id, exercise_id, set_number);
  END IF;

END $$;
