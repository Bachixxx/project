/*
  # Fix Sessions Tables

  This migration ensures the sessions, session_exercises, and program_sessions tables exist
  and are properly configured with RLS policies.

  1. New Tables
    - `sessions` - stores workout sessions with coach association
    - `session_exercises` - junction table linking sessions to exercises with sets/reps
    - `program_sessions` - junction table linking programs to sessions

  2. Security
    - Enable RLS on all tables
    - Add policies for coach-specific data access

  3. Performance
    - Add necessary indexes for efficient queries
*/

-- Drop existing tables if they exist (to ensure clean state)
DROP TABLE IF EXISTS program_sessions CASCADE;
DROP TABLE IF EXISTS session_exercises CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  difficulty_level TEXT NOT NULL DEFAULT 'Débutant',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_sessions_coach FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- Create session_exercises junction table
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 12,
  rest_time INTEGER NOT NULL DEFAULT 60,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_session_exercises_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Create program_sessions junction table
CREATE TABLE program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  session_id UUID NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_program_sessions_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_program_sessions_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Coaches can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- Create RLS policies for session_exercises
CREATE POLICY "Coaches can manage session exercises for their sessions"
  ON session_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_exercises.session_id
      AND sessions.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_exercises.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

-- Create RLS policies for program_sessions
CREATE POLICY "Coaches can manage program sessions for their programs"
  ON program_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_sessions.program_id
      AND programs.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_sessions.program_id
      AND programs.coach_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_exercise_id ON session_exercises(exercise_id);
CREATE INDEX idx_session_exercises_order ON session_exercises(session_id, order_index);
CREATE INDEX idx_program_sessions_program_id ON program_sessions(program_id);
CREATE INDEX idx_program_sessions_session_id ON program_sessions(session_id);
CREATE INDEX idx_program_sessions_order ON program_sessions(program_id, order_index);

-- Grant necessary permissions
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON session_exercises TO authenticated;
GRANT ALL ON program_sessions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';