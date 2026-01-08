/*
  # Allow Clients to View Sessions and Exercises for Directly Assigned Scheduled Sessions
  
  The issue: Clients could see scheduled_sessions in the calendar but the session
  details showed as "Unknown Session" because the sessions table RLS policy
  didn't account for direct client_id assignments.
  
  Solution: Update security definer functions to check both:
  1. session_registrations (for group sessions)
  2. Direct client_id assignment (for personal sessions)
*/

-- ============================================
-- Update function to check direct assignments
-- ============================================

CREATE OR REPLACE FUNCTION public.user_can_access_session_via_scheduled(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    -- Check if registered via session_registrations
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  ) OR EXISTS (
    -- Check if directly assigned via client_id
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.clients c ON c.id = ss.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Update function for session exercises
CREATE OR REPLACE FUNCTION public.user_can_access_session_exercise_via_scheduled(session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    -- Check if registered via session_registrations
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  ) OR EXISTS (
    -- Check if directly assigned via client_id
    SELECT 1
    FROM public.scheduled_sessions ss
    JOIN public.clients c ON c.id = ss.client_id
    WHERE ss.session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Update function for exercises
CREATE OR REPLACE FUNCTION public.user_can_access_exercise_via_sessions(exercise_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    -- Check if registered via session_registrations
    SELECT 1
    FROM public.session_exercises se
    JOIN public.scheduled_sessions ss ON ss.session_id = se.session_id
    JOIN public.session_registrations sr ON sr.scheduled_session_id = ss.id
    JOIN public.clients c ON c.id = sr.client_id
    WHERE se.exercise_id = $1
      AND c.auth_id = auth.uid()
  ) OR EXISTS (
    -- Check if directly assigned via client_id
    SELECT 1
    FROM public.session_exercises se
    JOIN public.scheduled_sessions ss ON ss.session_id = se.session_id
    JOIN public.clients c ON c.id = ss.client_id
    WHERE se.exercise_id = $1
      AND c.auth_id = auth.uid()
  );
$$;