/*
  # Fix Sessions and Session Exercises Tables

  1. Changes
    - Create sessions table if it doesn't exist
    - Create session_exercises table if it doesn't exist
    - Create program_sessions table if it doesn't exist
    - Add proper foreign key relationships
    - Add RLS policies

  2. Security
    - Enable RLS on all tables
    - Add policies for coach-specific data access
*/

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  difficulty_level TEXT NOT NULL DEFAULT 'Débutant',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create session_exercises junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 12,
  rest_time INTEGER NOT NULL DEFAULT 60,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create program_sessions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coaches can manage their sessions" ON sessions;
DROP POLICY IF EXISTS "Coaches can manage their session exercises" ON session_exercises;
DROP POLICY IF EXISTS "Coaches can manage their program sessions" ON program_sessions;

-- Create RLS policies
CREATE POLICY "Coaches can manage their sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

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

CREATE POLICY "Coaches can manage their program sessions"
  ON program_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_sessions.program_id
      AND programs.coach_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_program_id ON program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_session_id ON program_sessions(session_id);

-- Grant necessary permissions
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON session_exercises TO authenticated;
GRANT ALL ON program_sessions TO authenticated;