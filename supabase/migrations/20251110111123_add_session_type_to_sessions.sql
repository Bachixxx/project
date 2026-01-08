/*
  # Add session_type column to sessions table

  1. Changes
    - Add `session_type` column to `sessions` table
    - Possible values: 'private', 'group_private', 'group_public'
    - Default value is 'private' for backward compatibility
    - Add check constraint to ensure valid values

  2. Notes
    - 'private': Session visible only to the coach
    - 'group_private': Session visible to coach and assigned clients
    - 'group_public': Session visible to all clients of the coach
    - Existing sessions will be set to 'private'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'private';
    
    ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check 
      CHECK (session_type IN ('private', 'group_private', 'group_public'));
  END IF;
END $$;