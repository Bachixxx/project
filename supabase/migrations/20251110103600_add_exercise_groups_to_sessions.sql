/*
  # Add Exercise Groups to Sessions

  1. Changes
    - Add `exercise_group` table to group exercises together
    - Add `group_id` and `group_repetitions` to `session_exercises`
    - Allows coaches to create groups of exercises that repeat multiple times
    
  2. New Tables
    - `exercise_groups`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `name` (text) - Group name like "Circuit A" or "Superset 1"
      - `repetitions` (integer) - How many times to repeat this group
      - `order_index` (integer) - Order within the session
      - `created_at` (timestamptz)
  
  3. Modified Tables
    - `session_exercises`
      - Add `group_id` (uuid, nullable, foreign key to exercise_groups)
      - When group_id is NULL, exercise is standalone
      - When group_id is set, exercise is part of a group
  
  4. Security
    - Enable RLS on exercise_groups
    - Coaches can only manage groups for their own sessions
*/

-- Create exercise_groups table
CREATE TABLE IF NOT EXISTS exercise_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Group',
  repetitions INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_exercise_groups_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Add group_id to session_exercises
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_exercises' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE session_exercises ADD COLUMN group_id UUID;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_session_exercises_group'
  ) THEN
    ALTER TABLE session_exercises 
    ADD CONSTRAINT fk_session_exercises_group 
    FOREIGN KEY (group_id) REFERENCES exercise_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE exercise_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_groups
CREATE POLICY "Coaches can view exercise groups for their sessions"
  ON exercise_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = exercise_groups.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert exercise groups for their sessions"
  ON exercise_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = exercise_groups.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update exercise groups for their sessions"
  ON exercise_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = exercise_groups.session_id
      AND sessions.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = exercise_groups.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete exercise groups for their sessions"
  ON exercise_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = exercise_groups.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_groups_session_id ON exercise_groups(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_groups_order ON exercise_groups(session_id, order_index);
CREATE INDEX IF NOT EXISTS idx_session_exercises_group_id ON session_exercises(group_id);