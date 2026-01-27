/*
  # Allow Clients to View Session Content for Appointments

  1. Issue
    - Clients can now see the appointment in the calendar.
    - But when they click "Start", they get "Session content not found".
    - This is because the `sessions` and `session_exercises` tables lack RLS policies to allow access via `appointments`.
    - Existing policies only cover `programs` and `scheduled_sessions`.

  2. Changes
    - Add policy to `sessions`: Allow read if user is registered for an appointment linked to this session.
    - Add policy to `session_exercises`: Same logic.

  3. Security
    - Robust logic ensuring only the registered client (or coach) can access the content.
    - Uses standard RLS patterns.
*/

-- 1. Unblock SESSIONS table for appointment holders
DROP POLICY IF EXISTS "Clients can view sessions for their appointments" ON public.sessions;

CREATE POLICY "Clients can view sessions for their appointments"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.appointment_registrations ar ON ar.appointment_id = a.id
      JOIN public.clients c ON c.id = ar.client_id
      WHERE a.session_id = sessions.id
      AND c.auth_id = auth.uid()
    )
  );

-- 2. Unblock SESSION_EXERCISES table for appointment holders
DROP POLICY IF EXISTS "Clients can view exercises for their appointments" ON public.session_exercises;

CREATE POLICY "Clients can view exercises for their appointments"
  ON public.session_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.appointments a ON a.session_id = s.id
      JOIN public.appointment_registrations ar ON ar.appointment_id = a.id
      JOIN public.clients c ON c.id = ar.client_id
      WHERE s.id = session_exercises.session_id
      AND c.auth_id = auth.uid()
    )
  );
