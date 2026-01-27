/*
  # Fix Appointment Visibility for Registered Clients

  1. Changes
    - Add policy to allow clients to view appointments they are registered for
    - This fixes the issue where group sessions (which don't have a specific client_id on the appointment)
      were not visible to registered participants.

  2. Security
    - Clients can only view appointments where they have a valid registration
*/

-- Add policy for registered appointments visibility
DROP POLICY IF EXISTS "Clients can view appointments they are registered for" ON public.appointments;

CREATE POLICY "Clients can view appointments they are registered for"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_registrations ar
      WHERE ar.appointment_id = appointments.id
      AND ar.client_id IN (
        SELECT id FROM public.clients WHERE auth_id = auth.uid()
      )
    )
  );

-- Also ensure public group sessions are visible even if not registered (for booking)
DROP POLICY IF EXISTS "Clients can view public group appointments" ON public.appointments;

CREATE POLICY "Clients can view public group appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    type = 'group' 
    AND group_visibility = 'public'
  );
