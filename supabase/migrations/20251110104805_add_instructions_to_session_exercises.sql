/*
  # Add instructions column to session_exercises

  1. Changes
    - Add `instructions` TEXT column to `session_exercises` table if it doesn't exist
    - Allows coaches to provide custom instructions for each exercise in a session
    - Default value is empty string for backward compatibility

  2. Notes
    - This is a non-breaking change
    - Existing records will have empty instructions
    - Uses DO block to check if column exists before adding
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_exercises' AND column_name = 'instructions'
  ) THEN
    ALTER TABLE session_exercises ADD COLUMN instructions TEXT DEFAULT '';
  END IF;
END $$;