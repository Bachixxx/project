/*
  # Fix Infinite Recursion in RLS Policies
  
  This migration fixes infinite recursion between scheduled_sessions
  and session_registrations policies by using security definer functions
  instead of direct policy cross-references.
  
  The issue was:
  - scheduled_sessions policy checks session_registrations
  - session_registrations policy checks scheduled_sessions
  - This creates infinite recursion
  
  Solution: Use security definer functions that bypass RLS
*/

-- ============================================
-- Create Security Definer Functions
-- ============================================

-- Function to check if user is registered for a scheduled session
CREATE OR REPLACE FUNCTION public.user_registered_for_scheduled_session(scheduled_session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.session_registrations sr
    JOIN public.clients c ON c.id = sr.client_id
    WHERE sr.scheduled_session_id = $1
      AND c.auth_id = auth.uid()
  );
$$;

-- Function to check if scheduled session belongs to coach
CREATE OR REPLACE FUNCTION public.scheduled_session_belongs_to_coach(scheduled_session_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scheduled_sessions ss
    WHERE ss.id = $1
      AND ss.coach_id = auth.uid()
  );
$$;

-- ============================================
-- Fix Scheduled Sessions Policies
-- ============================================

DROP POLICY IF EXISTS "Clients can view their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Clients can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (public.user_registered_for_scheduled_session(id));

-- ============================================
-- Fix Session Registrations Policies
-- ============================================

DROP POLICY IF EXISTS "Coaches can view registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can view registrations for their sessions"
  ON public.session_registrations FOR SELECT
  TO authenticated
  USING (public.scheduled_session_belongs_to_coach(scheduled_session_id));

DROP POLICY IF EXISTS "Coaches can create registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can create registrations for their sessions"
  ON public.session_registrations FOR INSERT
  TO authenticated
  WITH CHECK (public.scheduled_session_belongs_to_coach(scheduled_session_id));

DROP POLICY IF EXISTS "Coaches can update registrations for their sessions" ON public.session_registrations;
CREATE POLICY "Coaches can update registrations for their sessions"
  ON public.session_registrations FOR UPDATE
  TO authenticated
  USING (public.scheduled_session_belongs_to_coach(scheduled_session_id))
  WITH CHECK (public.scheduled_session_belongs_to_coach(scheduled_session_id));