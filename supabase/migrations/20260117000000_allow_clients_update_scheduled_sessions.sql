/*
  # Allow Clients to Update Scheduled Sessions
  
  This migration adds a policy to allow clients to update their own scheduled sessions.
  Specifically, they need to be able to mark sessions as 'completed' and add notes.
*/

CREATE POLICY "Clients can update their own scheduled sessions"
  ON public.scheduled_sessions FOR UPDATE
  TO authenticated
  USING (
    -- Direct assignment: client_id matches
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = scheduled_sessions.client_id
        AND c.auth_id = (select auth.uid())
    )
  )
  WITH CHECK (
    -- Can only check the same condition (ownership)
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = scheduled_sessions.client_id
        AND c.auth_id = (select auth.uid())
    )
  );
