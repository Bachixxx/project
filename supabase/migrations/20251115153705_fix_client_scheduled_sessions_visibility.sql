/*
  # Fix Client Scheduled Sessions Visibility
  
  The issue: Clients couldn't see scheduled sessions created by their coach
  because the RLS policy only checked session_registrations table.
  
  The scheduled_sessions table has a client_id column for personal sessions
  that are directly assigned to a client (not requiring registration).
  
  Solution: Update the policy to allow clients to view sessions where they
  are either:
  1. Directly assigned (client_id matches their client record)
  2. Registered via session_registrations table
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Clients can view their scheduled sessions" ON public.scheduled_sessions;

-- Create new policy that checks both direct assignment AND registration
CREATE POLICY "Clients can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    -- Direct assignment: client_id matches
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = scheduled_sessions.client_id
        AND c.auth_id = (select auth.uid())
    )
    OR
    -- Registered via session_registrations
    public.user_registered_for_scheduled_session(id)
  );