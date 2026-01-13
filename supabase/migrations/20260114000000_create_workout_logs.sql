/*
  # Create Workout Logs Table for Performance Tracking

  1. New Tables
    - `workout_logs`
      - Stores the actual performance data for each set executed by a client
      - Links to client, scheduled_session, and exercise
      - Tracks weight, reps, and completion time
  
  2. Security
    - Enable RLS
    - Clients can insert/update their own logs
    - Coaches can view logs for their clients
*/

CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_session_id UUID REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate logs for the same set in the same session to allow upserts
  CONSTRAINT unique_session_exercise_set UNIQUE (scheduled_session_id, exercise_id, set_number)
);

-- Enable Row Level Security
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- Clients can view their own logs
CREATE POLICY "Clients can view their own workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

-- Clients can insert/update their own logs
CREATE POLICY "Clients can insert their own workout logs"
  ON workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own workout logs"
  ON workout_logs FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

-- Coaches can view logs of their clients
CREATE POLICY "Coaches can view their clients workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = workout_logs.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_client_exercise ON workout_logs(client_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON workout_logs(completed_at DESC);
