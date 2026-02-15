-- Allow clients to view exercise groups for their scheduled sessions
CREATE POLICY "Clients can view exercise groups for scheduled sessions"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM scheduled_sessions
        WHERE scheduled_sessions.session_id = exercise_groups.session_id
        AND scheduled_sessions.client_id = auth.uid()
    )
);

-- Allow clients to view exercise groups for their appointments
CREATE POLICY "Clients can view exercise groups for appointments"
ON exercise_groups FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.session_id = exercise_groups.session_id
        AND appointments.client_id = auth.uid()
        -- AND appointments.status != 'cancelled' ? (optional, keep simple for now)
    )
);

-- Also allow viewing if the group is directly linked to an exercise the user can see?
-- (This handles the case where group might be a template but linked to session_exercises)
-- But checking session_exercises -> sessions -> scheduled_sessions is complex.
-- Let's stick to the session_id check first as it covers 99% of "Coach created a session" cases.
