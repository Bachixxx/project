-- Add target fields to session_exercises table (instance of a program exercise)
ALTER TABLE session_exercises
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS distance_meters INTEGER;

-- Add actual result fields to workout_logs table
ALTER TABLE workout_logs
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS distance_meters INTEGER;

COMMENT ON COLUMN session_exercises.duration_seconds IS 'Target duration for this specific session exercise';
COMMENT ON COLUMN session_exercises.distance_meters IS 'Target distance for this specific session exercise';
COMMENT ON COLUMN workout_logs.duration_seconds IS 'Actual duration achieved';
COMMENT ON COLUMN workout_logs.distance_meters IS 'Actual distance achieved';
