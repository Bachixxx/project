-- Migration to enhance exercise_groups for reusable blocks

-- 1. Add new columns for Block features
ALTER TABLE exercise_groups 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'regular' CHECK (type IN ('regular', 'circuit', 'amrap', 'interval')),
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- 2. Make session_id nullable to allow for template blocks (which don't belong to a specific session instance yet)
ALTER TABLE exercise_groups ALTER COLUMN session_id DROP NOT NULL;

-- 3. Add index for finding templates
CREATE INDEX IF NOT EXISTS idx_exercise_groups_templates ON exercise_groups(coach_id, is_template);

-- 4. Update RLS policies to allow coaches to manage their templates
-- Ensure RLS is enabled (should be already, but safety first)
ALTER TABLE exercise_groups ENABLE ROW LEVEL SECURITY;

-- Policy for selecting: Own groups (session or template)
DROP POLICY IF EXISTS "Coaches can view own groups" ON exercise_groups;
CREATE POLICY "Coaches can view own groups" ON exercise_groups
    FOR SELECT
    USING (
        (auth.uid() = coach_id) OR 
        (session_id IN (SELECT id FROM sessions WHERE coach_id = auth.uid()))
    );

-- Policy for inserting: Must be own coach_id or linked to own session
DROP POLICY IF EXISTS "Coaches can insert own groups" ON exercise_groups;
CREATE POLICY "Coaches can insert own groups" ON exercise_groups
    FOR INSERT
    WITH CHECK (
        (auth.uid() = coach_id) OR 
        (session_id IN (SELECT id FROM sessions WHERE coach_id = auth.uid()))
    );

-- Policy for updating: Own groups
DROP POLICY IF EXISTS "Coaches can update own groups" ON exercise_groups;
CREATE POLICY "Coaches can update own groups" ON exercise_groups
    FOR UPDATE
    USING (
        (auth.uid() = coach_id) OR 
        (session_id IN (SELECT id FROM sessions WHERE coach_id = auth.uid()))
    );

-- Policy for deleting: Own groups
DROP POLICY IF EXISTS "Coaches can delete own groups" ON exercise_groups;
CREATE POLICY "Coaches can delete own groups" ON exercise_groups
    FOR DELETE
    USING (
        (auth.uid() = coach_id) OR 
        (session_id IN (SELECT id FROM sessions WHERE coach_id = auth.uid()))
    );
