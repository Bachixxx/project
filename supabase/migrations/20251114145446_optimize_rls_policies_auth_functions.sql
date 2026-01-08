/*
  # Optimize RLS Policies - Auth Function Calls
  
  This migration optimizes RLS policies by wrapping auth function calls
  in SELECT statements to prevent re-evaluation for each row.
  
  This improves query performance at scale by initializing the auth
  context once per query instead of once per row.
  
  Changes apply to the most frequently accessed tables:
  - coaches
  - clients
  - exercises
  - programs
  - sessions
  - appointments
*/

-- ============================================
-- COACHES TABLE
-- ============================================

DROP POLICY IF EXISTS "coaches_read_20250412_v3" ON public.coaches;
CREATE POLICY "coaches_read_20250412_v3"
  ON public.coaches FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "coaches_insert_20250412_v3" ON public.coaches;
CREATE POLICY "coaches_insert_20250412_v3"
  ON public.coaches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "coaches_update_20250412_v3" ON public.coaches;
CREATE POLICY "coaches_update_20250412_v3"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- CLIENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can CRUD own clients" ON public.clients;
CREATE POLICY "Coaches can CRUD own clients"
  ON public.clients FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "allow_client_access" ON public.clients;
CREATE POLICY "allow_client_access"
  ON public.clients FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = auth_id);

DROP POLICY IF EXISTS "allow_coach_access" ON public.clients;
CREATE POLICY "allow_coach_access"
  ON public.clients FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

-- ============================================
-- EXERCISES TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can CRUD own exercises" ON public.exercises;
CREATE POLICY "Coaches can CRUD own exercises"
  ON public.exercises FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "allow_coach_exercises" ON public.exercises;
CREATE POLICY "allow_coach_exercises"
  ON public.exercises FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Clients can read exercises in their programs" ON public.exercises;
CREATE POLICY "Clients can read exercises in their programs"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_exercises pe
      JOIN public.client_programs cp ON cp.program_id = pe.program_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE pe.exercise_id = exercises.id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can read exercises in their scheduled sessions" ON public.exercises;
CREATE POLICY "Clients can read exercises in their scheduled sessions"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.session_registrations sr ON sr.scheduled_session_id IN (
        SELECT id FROM public.scheduled_sessions WHERE session_id = se.session_id
      )
      JOIN public.clients c ON c.id = sr.client_id
      WHERE se.exercise_id = exercises.id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- PROGRAMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can CRUD own programs" ON public.programs;
CREATE POLICY "Coaches can CRUD own programs"
  ON public.programs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "allow_coach_programs" ON public.programs;
CREATE POLICY "allow_coach_programs"
  ON public.programs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Clients can read assigned programs" ON public.programs;
CREATE POLICY "Clients can read assigned programs"
  ON public.programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.program_id = programs.id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow clients to view their assigned programs" ON public.programs;
CREATE POLICY "Allow clients to view their assigned programs"
  ON public.programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.program_id = programs.id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can view their own sessions" ON public.sessions;
CREATE POLICY "Coaches can view their own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can insert their own sessions" ON public.sessions;
CREATE POLICY "Coaches can insert their own sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can update their own sessions" ON public.sessions;
CREATE POLICY "Coaches can update their own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can delete their own sessions" ON public.sessions;
CREATE POLICY "Coaches can delete their own sessions"
  ON public.sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Clients can read sessions for assigned programs" ON public.sessions;
CREATE POLICY "Clients can read sessions for assigned programs"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_sessions ps
      JOIN public.client_programs cp ON cp.program_id = ps.program_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE ps.session_id = sessions.id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view sessions for their scheduled sessions" ON public.sessions;
CREATE POLICY "Clients can view sessions for their scheduled sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
      JOIN public.clients c ON c.id = sr.client_id
      WHERE ss.session_id = sessions.id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can CRUD own appointments" ON public.appointments;
CREATE POLICY "Coaches can CRUD own appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can manage own appointments" ON public.appointments;
CREATE POLICY "Coaches can manage own appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Clients can view their appointments" ON public.appointments;
CREATE POLICY "Clients can view their appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id
        AND c.auth_id = (select auth.uid())
    )
  );