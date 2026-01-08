/*
  # Add visibility field to programs

  1. Changes
    - Add `is_public` boolean column to `programs` table with default value `false`
    - Programs are private by default and must be explicitly marked as public
  
  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE programs ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;