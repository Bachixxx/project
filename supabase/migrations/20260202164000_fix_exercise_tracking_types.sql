-- Fix tracking types for common exercises that are incorrectly set to 'reps_weight'

-- 1. Fix 'Course à pied' and similar running exercises -> distance
UPDATE public.exercises
SET tracking_type = 'distance'
WHERE (name ILIKE '%course%' OR name ILIKE '%run%' OR name ILIKE '%jogging%')
  AND tracking_type = 'reps_weight';

-- 2. Fix 'Corde à sauter' and jump rope -> duration
-- (Can be debatable but usually duration is better than reps unless counting jumps)
UPDATE public.exercises
SET tracking_type = 'duration'
WHERE (name ILIKE '%corde à sauter%' OR name ILIKE '%jump rope%')
  AND tracking_type = 'reps_weight';

-- 3. Fix 'Planche' variations -> duration
UPDATE public.exercises
SET tracking_type = 'duration'
WHERE (name ILIKE '%planche%' OR name ILIKE '%plank%')
  AND tracking_type = 'reps_weight';

-- 4. Fix 'Vélo' / 'Bike' -> distance (or duration, but distance is common default for cardio machines)
UPDATE public.exercises
SET tracking_type = 'distance'
WHERE (name ILIKE '%vélo%' OR name ILIKE '%bike%' OR name ILIKE '%cycling%')
  AND tracking_type = 'reps_weight';

-- 5. Fix 'Rameur' / 'Rower' -> distance
UPDATE public.exercises
SET tracking_type = 'distance'
WHERE (name ILIKE '%rameur%' OR name ILIKE '%rower%')
  AND tracking_type = 'reps_weight';

-- 6. Verify and ensure defaults for cardio category if not matched above
-- Optional: Force all 'Cardio' category to 'duration' if still 'reps_weight'? 
-- Better not do blanket update to avoid overwriting intentionally set reps based cardio (like burpees which can be reps)
