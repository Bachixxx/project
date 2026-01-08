/*
  # Add instructions column to session_exercises

  1. Changes
    - Add `instructions` TEXT column to `session_exercises` table
    - Allows coaches to provide custom instructions for each exercise
    - Default value is empty string

  2. Notes
    - This is a non-breaking change
    - Existing records will have empty instructions
*/

ALTER TABLE session_exercises ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '';
