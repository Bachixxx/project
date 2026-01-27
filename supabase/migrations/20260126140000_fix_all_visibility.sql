/*
  # Fix Visibility for Scheduled Sessions and Sessions

  1. Issue
    - The previous fix only addressed the `appointments` table.
    - However, group classes often use `scheduled_sessions` and `sessions` tables.
    - These tables also need RLS policies to allow clients to see "public" group sessions.

  2. Changes
    - Add/Update policy on `sessions` to allow viewing if `session_type` is 'group_public'.
    - Add/Update policy on `scheduled_sessions` to allow viewing if the linked session is 'group_public'.
    - Ensure registered sessions are visible.

  3. Security
    - Only exposes public sessions or sessions the user is registered for.
*/

-- 1. Policies for SESSIONS table
DROP POLICY IF EXISTS "Clients can view public sessions" ON public.sessions;

CREATE POLICY "Clients can view public sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    session_type = 'group_public' 
    OR 
    -- Keep existing logic for assigned/registered if needed, or rely on separate policies
    true -- simplifying: usually sessions definitions are safe to read if you are authenticated, 
         -- but strictly we can limit to public.
         -- Let's stick to public + registered context.
  );

-- Actually, a safer "Public" policy:
DROP POLICY IF EXISTS "Clients can view public sessions" ON public.sessions;
CREATE POLICY "Clients can view public sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (session_type = 'group_public');


-- 2. Policies for SCHEDULED_SESSIONS table
DROP POLICY IF EXISTS "Clients can view public scheduled sessions" ON public.scheduled_sessions;

CREATE POLICY "Clients can view public scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = scheduled_sessions.session_id
      AND s.session_type = 'group_public'
    )
  );

-- Ensure "Registered" visibility is robust for scheduled_sessions
-- (This might already exist, but reinforcing it doesn't hurt)
DROP POLICY IF EXISTS "Clients can view scheduled sessions they are registered for" ON public.scheduled_sessions;

CREATE POLICY "Clients can view scheduled sessions they are registered for"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_registrations sr
      WHERE sr.scheduled_session_id = scheduled_sessions.id
      AND sr.client_id IN (
        SELECT id FROM public.clients WHERE auth_id = auth.uid()
      )
    )
  );
