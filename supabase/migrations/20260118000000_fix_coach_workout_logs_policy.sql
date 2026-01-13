/*
  # Allow Coaches to View Their Clients' Workout Logs
  
  This migration explicitly ensures coaches can view workout logs for clients assigned to them.
*/

-- Drop existing policy if it conflicts or is incorrect
DROP POLICY IF EXISTS "Coaches can view their clients workout logs" ON public.workout_logs;

-- Re-create the policy with clear logic
CREATE POLICY "Coaches can view their clients workout logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = workout_logs.client_id
        AND c.coach_id = (select auth.uid())
    )
  );
