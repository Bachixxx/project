-- Fix infinite recursion in exercise_groups RLS
-- The previous policy caused a loop because exercise_groups checked session_exercises,
-- which might check exercise_groups (indirectly or directly).
-- We need to break the chain.

-- Drop the recursive policies
DROP POLICY IF EXISTS "Clients can view exercise groups via session exercises (Scheduled)" ON exercise_groups;
DROP POLICY IF EXISTS "Clients can view exercise groups via session exercises (Appointments)" ON exercise_groups;

-- Use a more direct approach that doesn't rely on querying session_exercises with RLS active
-- We can use a SECURITY DEFINER function to check access, or simpler: 
-- just check the session_id on exercise_groups directly against scheduled_sessions/appointments.
-- BUT, as noted, some groups might be templates (session_id is NULL) linked via session_exercises.

-- Strategy A: Direct link check (if session_id is present on group)
CREATE POLICY "Clients can view exercise groups directly linked to session"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    session_id IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM scheduled_sessions
            WHERE scheduled_sessions.session_id = exercise_groups.session_id
            AND scheduled_sessions.client_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.session_id = exercise_groups.session_id
            AND appointments.client_id = auth.uid()
        )
    )
);

-- Strategy B: For templates (session_id IS NULL), we check if they are used in a session valid for the client.
-- To avoid recursion, we query session_exercises but we must ensure session_exercises policy doesn't check exercise_groups.
-- The policy on session_exercises (from 20251111152556) checks scheduled_sessions/appointments via session_id.
-- It DOES NOT check exercise_groups.
-- So why the recursion? 
-- Maybe the JOIN on session_exercises in my previous policy triggered something?
-- "SELECT 1 FROM session_exercises se WHERE se.group_id = exercise_groups.id ..."
-- Creating an index or FK check might trigger it?
-- Or maybe there IS another policy I missed.

-- Alternative Safe Approach:
-- Create a secure lookup function that bypasses RLS to check if a group is accessible.
CREATE OR REPLACE FUNCTION check_client_group_access(group_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        LEFT JOIN scheduled_sessions ss ON ss.session_id = s.id
        LEFT JOIN appointments a ON a.session_id = s.id
        WHERE se.group_id = group_uuid
        AND (ss.client_id = auth.uid() OR a.client_id = auth.uid())
    );
END;
$$;

CREATE POLICY "Clients can view their accessible exercise groups"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    (session_id IS NULL AND check_client_group_access(id)) OR
    (session_id IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM scheduled_sessions
            WHERE scheduled_sessions.session_id = exercise_groups.session_id
            AND scheduled_sessions.client_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.session_id = exercise_groups.session_id
            AND appointments.client_id = auth.uid()
        )
    ))
);
