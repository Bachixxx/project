-- Add multi-metric tracking columns to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS track_reps boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS track_weight boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS track_duration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS track_distance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS track_calories boolean DEFAULT false;

-- Add calories column to workout_logs
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS calories integer DEFAULT 0;

-- Migrate existing tracking_type data to new booleans
-- 1. reps_weight -> track_reps + track_weight
UPDATE public.exercises 
SET track_reps = true, track_weight = true 
WHERE tracking_type = 'reps_weight';

-- 2. distance -> track_distance (and usually duration is implicit in running, but strictly following old type first)
UPDATE public.exercises 
SET track_distance = true 
WHERE tracking_type = 'distance';

-- 3. duration -> track_duration
UPDATE public.exercises 
SET track_duration = true 
WHERE tracking_type = 'duration';

-- 4. Default fallback for NULL or unexpected types: assume reps_weight (standard gym)
UPDATE public.exercises 
SET track_reps = true, track_weight = true 
WHERE track_reps = false 
  AND track_weight = false 
  AND track_distance = false 
  AND track_duration = false 
  AND track_calories = false;

-- Optional: Drop the old column later, or keep for backward compatibility for a bit.
-- ALTER TABLE public.exercises DROP COLUMN tracking_type;
