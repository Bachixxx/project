-- Fix Broken RLS Policies for exercise_groups 
-- The previous policies compared scheduled_sessions.client_id directly to auth.uid(), which fails 
-- because client_id refers to clients.id (a distinct UUID), while auth.uid() refers to clients.auth_id.

DROP POLICY IF EXISTS "Clients can view exercise groups for appointments" ON public.exercise_groups;
DROP POLICY IF EXISTS "Clients can view exercise groups for scheduled sessions" ON public.exercise_groups;
DROP POLICY IF EXISTS "Clients can view their accessible exercise groups" ON public.exercise_groups;

-- Use the existing helper functions that correctly join the clients table.
CREATE POLICY "Clients can view exercise groups for assigned programs"
  ON public.exercise_groups
  FOR SELECT
  TO authenticated
  USING (
    public.user_can_access_session_exercise_via_programs(session_id)
  );

CREATE POLICY "Clients can view exercise groups for scheduled sessions"
  ON public.exercise_groups
  FOR SELECT
  TO authenticated
  USING (
    public.user_can_access_session_exercise_via_scheduled(session_id)
  );

CREATE POLICY "Clients can view exercise groups for appointments"
  ON public.exercise_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessions s
      JOIN public.appointments a ON a.session_id = s.id
      JOIN public.appointment_registrations ar ON ar.appointment_id = a.id
      JOIN public.clients c ON c.id = ar.client_id
      WHERE s.id = exercise_groups.session_id
        AND c.auth_id = auth.uid()
    )
  );
