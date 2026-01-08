-- Fix relationship between sessions and session_exercises tables

-- Ensure foreign key constraint exists with correct name
DO $$ 
BEGIN
  -- First check if the constraint exists with a different name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'session_exercises'
    AND ccu.table_name = 'sessions'
    AND ccu.column_name = 'id'
  ) THEN
    -- If it exists with a different name, we'll drop it and recreate it
    EXECUTE (
      SELECT 'ALTER TABLE session_exercises DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'session_exercises'
      AND ccu.table_name = 'sessions'
      AND ccu.column_name = 'id'
      LIMIT 1
    );
  END IF;

  -- Now add the constraint with the correct name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'session_exercises_session_id_fkey' 
    AND table_name = 'session_exercises'
  ) THEN
    ALTER TABLE session_exercises 
    ADD CONSTRAINT session_exercises_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Recreate RLS policies to ensure proper access
DROP POLICY IF EXISTS "Coaches can manage their sessions" ON sessions;
CREATE POLICY "Coaches can manage their sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can manage their session exercises" ON session_exercises;
CREATE POLICY "Coaches can manage their session exercises"
  ON session_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_exercises.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id ON session_exercises(exercise_id);

-- Refresh the schema cache to ensure relationships are recognized
SELECT pg_notify('pgrst', 'reload schema');