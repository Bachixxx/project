/*
  # Fix Visibility for 'group' type Sessions

  1. Issue
    - The previous fix assumed the session type was strictly 'group_public'.
    - It is likely the sessions are just 'group'.
    - We need to allow clients to see 'group' sessions as well if they are scheduled.

  2. Changes
    - Update policy on `sessions` to allow 'group' OR 'group_public'.
    - Update policy on `scheduled_sessions` to match.
*/

-- 1. Policies for SESSIONS table
DROP POLICY IF EXISTS "Clients can view public sessions" ON public.sessions;

CREATE POLICY "Clients can view public sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (session_type IN ('group', 'group_public'));


-- 2. Policies for SCHEDULED_SESSIONS table
DROP POLICY IF EXISTS "Clients can view public scheduled sessions" ON public.scheduled_sessions;

CREATE POLICY "Clients can view public scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = scheduled_sessions.session_id
      AND s.session_type IN ('group', 'group_public')
    )
  );
