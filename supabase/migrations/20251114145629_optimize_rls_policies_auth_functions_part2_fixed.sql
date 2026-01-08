/*
  # Optimize RLS Policies - Auth Functions Part 2 (Fixed)
  
  Continues optimization of RLS policies for remaining tables:
  - client_programs
  - program_exercises
  - program_sessions
  - session_exercises
  - exercise_groups
  - scheduled_sessions
  - session_registrations
  - subscription_history
  - workout_sessions
  - payments
  - appointment_registrations
  - appointment_participants
*/

-- ============================================
-- CLIENT_PROGRAMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Clients can read their own programs" ON public.client_programs;
CREATE POLICY "Clients can read their own programs"
  ON public.client_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_programs.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can CRUD own client programs" ON public.client_programs;
CREATE POLICY "Coaches can CRUD own client programs"
  ON public.client_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_programs.client_id
        AND c.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "allow_coach_client_programs" ON public.client_programs;
CREATE POLICY "allow_coach_client_programs"
  ON public.client_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_programs.client_id
        AND c.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- PROGRAM_EXERCISES TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can CRUD own program exercises" ON public.program_exercises;
CREATE POLICY "Coaches can CRUD own program exercises"
  ON public.program_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_exercises.program_id
        AND p.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "allow_coach_program_exercises" ON public.program_exercises;
CREATE POLICY "allow_coach_program_exercises"
  ON public.program_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_exercises.program_id
        AND p.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can read program exercises for assigned programs" ON public.program_exercises;
CREATE POLICY "Clients can read program exercises for assigned programs"
  ON public.program_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.program_id = program_exercises.program_id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- PROGRAM_SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage program sessions for their programs" ON public.program_sessions;
CREATE POLICY "Coaches can manage program sessions for their programs"
  ON public.program_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_sessions.program_id
        AND p.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can read program sessions for assigned programs" ON public.program_sessions;
CREATE POLICY "Clients can read program sessions for assigned programs"
  ON public.program_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.program_id = program_sessions.program_id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- SESSION_EXERCISES TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage session exercises for their sessions" ON public.session_exercises;
CREATE POLICY "Coaches can manage session exercises for their sessions"
  ON public.session_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_exercises.session_id
        AND s.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can read session exercises for assigned programs" ON public.session_exercises;
CREATE POLICY "Clients can read session exercises for assigned programs"
  ON public.session_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_sessions ps
      JOIN public.client_programs cp ON cp.program_id = ps.program_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE ps.session_id = session_exercises.session_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view exercises for their scheduled sessions" ON public.session_exercises;
CREATE POLICY "Clients can view exercises for their scheduled sessions"
  ON public.session_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
      JOIN public.clients c ON c.id = sr.client_id
      WHERE ss.session_id = session_exercises.session_id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- EXERCISE_GROUPS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can view exercise groups for their sessions" ON public.exercise_groups;
CREATE POLICY "Coaches can view exercise groups for their sessions"
  ON public.exercise_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = exercise_groups.session_id
        AND s.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can insert exercise groups for their sessions" ON public.exercise_groups;
CREATE POLICY "Coaches can insert exercise groups for their sessions"
  ON public.exercise_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = exercise_groups.session_id
        AND s.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can update exercise groups for their sessions" ON public.exercise_groups;
CREATE POLICY "Coaches can update exercise groups for their sessions"
  ON public.exercise_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = exercise_groups.session_id
        AND s.coach_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = exercise_groups.session_id
        AND s.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can delete exercise groups for their sessions" ON public.exercise_groups;
CREATE POLICY "Coaches can delete exercise groups for their sessions"
  ON public.exercise_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = exercise_groups.session_id
        AND s.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- SCHEDULED_SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can view their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Coaches can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can create scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Coaches can create scheduled sessions"
  ON public.scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can update their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Coaches can update their scheduled sessions"
  ON public.scheduled_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can delete their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Coaches can delete their scheduled sessions"
  ON public.scheduled_sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Clients can view their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Clients can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_registrations sr
      JOIN public.clients c ON c.id = sr.client_id
      WHERE sr.scheduled_session_id = scheduled_sessions.id
        AND c.auth_id = (select auth.uid())
    )
  );

-- ============================================
-- SESSION_REGISTRATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Clients can view their registrations" ON public.session_registrations;
CREATE POLICY "Clients can view their registrations"
  ON public.session_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = session_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can register for sessions" ON public.session_registrations;
CREATE POLICY "Clients can register for sessions"
  ON public.session_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = session_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can cancel their registrations" ON public.session_registrations;
CREATE POLICY "Clients can cancel their registrations"
  ON public.session_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = session_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = session_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can delete their registrations" ON public.session_registrations;
CREATE POLICY "Clients can delete their registrations"
  ON public.session_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = session_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can view registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can view registrations for their sessions"
  ON public.session_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      WHERE ss.id = session_registrations.scheduled_session_id
        AND ss.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can create registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can create registrations for their sessions"
  ON public.session_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      WHERE ss.id = session_registrations.scheduled_session_id
        AND ss.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can update registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can update registrations for their sessions"
  ON public.session_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      WHERE ss.id = session_registrations.scheduled_session_id
        AND ss.coach_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scheduled_sessions ss
      WHERE ss.id = session_registrations.scheduled_session_id
        AND ss.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- SUBSCRIPTION_HISTORY TABLE
-- ============================================

DROP POLICY IF EXISTS "Coaches can view their own subscription history" ON public.subscription_history;
CREATE POLICY "Coaches can view their own subscription history"
  ON public.subscription_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = coach_id);

-- ============================================
-- WORKOUT_SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Allow clients to read their workout sessions" ON public.workout_sessions;
CREATE POLICY "Allow clients to read their workout sessions"
  ON public.workout_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow clients to create their workout sessions" ON public.workout_sessions;
CREATE POLICY "Allow clients to create their workout sessions"
  ON public.workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow clients to update their workout sessions" ON public.workout_sessions;
CREATE POLICY "Allow clients to update their workout sessions"
  ON public.workout_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
        AND c.auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage workout sessions for their clients" ON public.workout_sessions;
CREATE POLICY "Coaches can manage workout sessions for their clients"
  ON public.workout_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_programs cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
        AND c.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Clients can view appointment payments" ON public.payments;
CREATE POLICY "Clients can view appointment payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.clients c ON c.id = a.client_id
      WHERE a.id = payments.appointment_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage payments for their appointments" ON public.payments;
CREATE POLICY "Coaches can manage payments for their appointments"
  ON public.payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = payments.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- APPOINTMENT_REGISTRATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Clients can view their own registrations" ON public.appointment_registrations;
CREATE POLICY "Clients can view their own registrations"
  ON public.appointment_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointment_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can register for public appointments" ON public.appointment_registrations;
CREATE POLICY "Clients can register for public appointments"
  ON public.appointment_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointment_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can cancel their own registrations" ON public.appointment_registrations;
CREATE POLICY "Clients can cancel their own registrations"
  ON public.appointment_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointment_registrations.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can view registrations for their appointments" ON public.appointment_registrations;
CREATE POLICY "Coaches can view registrations for their appointments"
  ON public.appointment_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_registrations.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );

-- ============================================
-- APPOINTMENT_PARTICIPANTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Clients can view their own participations" ON public.appointment_participants;
CREATE POLICY "Clients can view their own participations"
  ON public.appointment_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointment_participants.client_id
        AND c.auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can view participants for their appointments" ON public.appointment_participants;
CREATE POLICY "Coaches can view participants for their appointments"
  ON public.appointment_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_participants.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can add participants to their appointments" ON public.appointment_participants;
CREATE POLICY "Coaches can add participants to their appointments"
  ON public.appointment_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_participants.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can update participants for their appointments" ON public.appointment_participants;
CREATE POLICY "Coaches can update participants for their appointments"
  ON public.appointment_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_participants.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_participants.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can delete participants from their appointments" ON public.appointment_participants;
CREATE POLICY "Coaches can delete participants from their appointments"
  ON public.appointment_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_participants.appointment_id
        AND a.coach_id = (select auth.uid())
    )
  );