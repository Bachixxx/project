-- Improved RLS for client access to exercise_groups
-- This handles cases where exercise_groups might not have session_id set directly (e.g. templates used by reference)
-- OR where the primary session link check fails.

CREATE POLICY "Clients can view exercise groups via session exercises (Scheduled)"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM session_exercises se
        JOIN scheduled_sessions ss ON ss.session_id = se.session_id
        WHERE se.group_id = exercise_groups.id
        AND ss.client_id = auth.uid()
    )
);

CREATE POLICY "Clients can view exercise groups via session exercises (Appointments)"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM session_exercises se
        JOIN appointments a ON a.session_id = se.session_id
        WHERE se.group_id = exercise_groups.id
        AND a.client_id = auth.uid()
    )
);
