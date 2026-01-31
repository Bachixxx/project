/*
  # Allow coaches to insert workout logs for their clients
  
  This policy is necessary for "Free Session" and general coach-led live sessions
  where the coach is the one saving the data.
*/

-- Allow coaches to insert logs if the client belongs to them
DROP POLICY IF EXISTS "Coaches can insert workout logs for their clients" ON public.workout_logs;

CREATE POLICY "Coaches can insert workout logs for their clients"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = workout_logs.client_id
      AND clients.coach_id = auth.uid()
    )
  );
