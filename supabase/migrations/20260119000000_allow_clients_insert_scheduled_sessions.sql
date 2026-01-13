/*
  # Allow Clients to Insert Scheduled Sessions
  
  This migration adds a policy to allow clients to create their own scheduled sessions.
  This is required for the "Unified Execution Engine" where clients can start a session
  from a program on-the-fly (creating a session for "now").
*/

CREATE POLICY "Clients can schedule their own sessions"
  ON public.scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Direct assignment: client_id matches the authenticated user's client profile
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = scheduled_sessions.client_id
        AND c.auth_id = (select auth.uid())
    )
  );
