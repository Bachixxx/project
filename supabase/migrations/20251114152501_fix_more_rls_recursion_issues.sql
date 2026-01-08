/*
  # Fix Additional RLS Recursion Issues
  
  This migration fixes potential recursion in exercises and related tables
  by creating security definer functions that bypass RLS checks.
*/

-- ============================================
-- Create Additional Security Definer Functions
-- ============================================

-- Function to check if user has access to exercise via programs
CREATE OR REPLACE FUNCTION public.user_can_access_exercise_via_programs(exercise_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.program_exercises pe
    JOIN public.client_programs cp ON cp.program_id = pe.program_id
    JOIN public.clients c ON c.id = cp.client_id
    WHERE pe.exercise_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if user has access to exercise via scheduled sessions
CREATE OR REPLACE FUNCTION public.user_can_access_exercise_via_sessions(exercise_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.session_exercises se
    JOIN public.scheduled_sessions ss ON ss.session_id = se.session_id
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE se.exercise_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if user can access session exercises via programs
CREATE OR REPLACE FUNCTION public.user_can_access_session_exercise_via_programs(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.program_sessions ps
    JOIN public.client_programs cp ON cp.program_id = ps.program_id
    JOIN public.clients c ON c.id = cp.client_id
    WHERE ps.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if user can access session exercises via scheduled sessions
CREATE OR REPLACE FUNCTION public.user_can_access_session_exercise_via_scheduled(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if user can access session via programs
CREATE OR REPLACE FUNCTION public.user_can_access_session_via_programs(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.program_sessions ps
    JOIN public.client_programs cp ON cp.program_id = ps.program_id
    JOIN public.clients c ON c.id = cp.client_id
    WHERE ps.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if user can access session via scheduled sessions
CREATE OR REPLACE FUNCTION public.user_can_access_session_via_scheduled(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- ============================================
-- Fix Exercises Policies
-- ============================================

DROP POLICY IF EXISTS "Clients can read exercises in their programs" ON public.exercises;
CREATE POLICY "Clients can read exercises in their programs"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (public.user_can_access_exercise_via_programs(id));

DROP POLICY IF EXISTS "Clients can read exercises in their scheduled sessions" ON public.exercises;
CREATE POLICY "Clients can read exercises in their scheduled sessions"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (public.user_can_access_exercise_via_sessions(id));

-- ============================================
-- Fix Session Exercises Policies
-- ============================================

DROP POLICY IF EXISTS "Clients can read session exercises for assigned programs" ON public.session_exercises;
CREATE POLICY "Clients can read session exercises for assigned programs"
  ON public.session_exercises FOR SELECT
  TO authenticated
  USING (public.user_can_access_session_exercise_via_programs(session_id));

DROP POLICY IF EXISTS "Clients can view exercises for their scheduled sessions" ON public.session_exercises;
CREATE POLICY "Clients can view exercises for their scheduled sessions"
  ON public.session_exercises FOR SELECT
  TO authenticated
  USING (public.user_can_access_session_exercise_via_scheduled(session_id));

-- ============================================
-- Fix Sessions Policies
-- ============================================

DROP POLICY IF EXISTS "Clients can read sessions for assigned programs" ON public.sessions;
CREATE POLICY "Clients can read sessions for assigned programs"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (public.user_can_access_session_via_programs(id));

DROP POLICY IF EXISTS "Clients can view sessions for their scheduled sessions" ON public.sessions;
CREATE POLICY "Clients can view sessions for their scheduled sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (public.user_can_access_session_via_scheduled(id));