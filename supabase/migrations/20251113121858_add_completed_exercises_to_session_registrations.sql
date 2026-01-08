/*
  # Add completed_exercises column to session_registrations

  1. Changes
    - Add `completed_exercises` JSONB column to `session_registrations` table
    - Add `notes` TEXT column to `session_registrations` table
    - Set default values for new columns

  2. Purpose
    - Track exercise completion data for each session registration
    - Store workout notes for each session
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_registrations' AND column_name = 'completed_exercises'
  ) THEN
    ALTER TABLE session_registrations ADD COLUMN completed_exercises JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_registrations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE session_registrations ADD COLUMN notes TEXT DEFAULT '';
  END IF;
END $$;