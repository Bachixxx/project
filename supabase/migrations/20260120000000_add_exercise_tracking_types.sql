-- Add tracking_type to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'reps_weight' CHECK (tracking_type IN ('reps_weight', 'duration', 'distance'));

-- Add target fields to program_exercises table to support different goals
ALTER TABLE program_exercises
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS distance_meters INTEGER;

-- Comment on columns for clarity
COMMENT ON COLUMN exercises.tracking_type IS 'Determines what metrics to track: reps_weight (Sets/Reps/Weight), duration (Time), or distance (Distance/Time)';
COMMENT ON COLUMN program_exercises.duration_seconds IS 'Target duration in seconds for duration-based exercises';
COMMENT ON COLUMN program_exercises.distance_meters IS 'Target distance in meters for distance-based exercises';
