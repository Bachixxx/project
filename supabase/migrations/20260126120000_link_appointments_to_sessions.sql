-- 1. Link Appointments to Sessions (The "Plan")
ALTER TABLE appointments 
ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- 2. Link Workout Logs to Appointments (The "Results")
ALTER TABLE workout_logs 
ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

-- 3. Update Unique Constraint on workout_logs
-- We need to drop the existing one and add a new one, or add a separate one.
-- Existing: UNIQUE (scheduled_session_id, exercise_id, set_number)
-- New (Option A): One big constraint (might be tricky if one is null)
-- New (Option B): Separate partial index/constraint

-- Let's check if we can add a constraint that ensures uniqueness for appointment logs
CREATE UNIQUE INDEX idx_workout_logs_appointment_unique 
ON workout_logs (appointment_id, exercise_id, set_number) 
WHERE appointment_id IS NOT NULL;

-- And ensure we have one for scheduled_session if not already (the existing one handles it but might fail if scheduled_session_id is null? Standard generic constraints allow nulls mostly, but let's see)
-- The existing constraint: `CONSTRAINT unique_session_exercise_set UNIQUE (scheduled_session_id, exercise_id, set_number)`
-- In Postgres, unique constraints ignore NULLs, so multiple rows with NULL scheduled_session_id are allowed.
-- So we can keep existing one. But if we insert a row with `appointment_id` and `scheduled_session_id = NULL`, the existing constraint won't block duplicates (because null != null).
-- So the new partial index above covers the appointment case. Perfect.

-- 4. Enable RLS for new column
-- policies likely rely on client_id which is already on workout_logs, so "insert own" should work fine.
-- But "Coaches can view" policy might need check.
-- Existing: `WHERE clients.coach_id = auth.uid()` -> This relies on client_id on workout_logs. Correct.
