/*
  # Add actual_duration to scheduled_sessions

  1. Changes
    - Add `actual_duration` column to `scheduled_sessions` table (integer, nullable)
      - Stores the actual duration of the workout in minutes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_sessions' AND column_name = 'actual_duration'
  ) THEN
    ALTER TABLE scheduled_sessions ADD COLUMN actual_duration integer;
  END IF;
END $$;
