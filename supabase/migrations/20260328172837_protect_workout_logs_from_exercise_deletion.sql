-- Protect workout logs from exercise deletion.
-- Previously ON DELETE CASCADE: deleting an exercise deleted all client logs.
-- Now ON DELETE SET NULL + exercise_name denormalized for history preservation.

-- 1. Add exercise_name column for denormalization
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- 2. Backfill existing logs with exercise names
UPDATE workout_logs wl
SET exercise_name = e.name
FROM exercises e
WHERE wl.exercise_id = e.id AND wl.exercise_name IS NULL;

-- 3. Allow exercise_id to be NULL (for deleted exercises)
ALTER TABLE workout_logs ALTER COLUMN exercise_id DROP NOT NULL;

-- 4. Change FK from CASCADE to SET NULL
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_exercise_id_fkey;
ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_exercise_id_fkey
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;
