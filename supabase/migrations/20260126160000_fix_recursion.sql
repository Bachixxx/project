/*
  # Fix Infinite Recursion in RLS Policies

  1. Issue
    - There is a circular dependency between `appointments` and `appointment_registrations` policies.
    - `appointments` policy checks `appointment_registrations`.
    - `appointment_registrations` policy checks `appointments`.
    - This causes infinite recursion when querying either table.

  2. Solution
    - Create a `SECURITY DEFINER` function `check_client_registration` that checks registration status bypassing RLS.
    - Update the `appointments` policy to use this function instead of direct table query.

  3. Security
    - The function safely checks if the currently authenticated user is registered for a specific appointment.
*/

-- 1. Create the Security Definer function to break the loop
CREATE OR REPLACE FUNCTION check_client_registration(lookup_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS on the tables queried inside
SET search_path = public -- Best practice for security definers
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.appointment_registrations ar
    JOIN public.clients c ON c.id = ar.client_id
    WHERE ar.appointment_id = lookup_appointment_id
    AND c.auth_id = auth.uid()
  );
END;
$$;

-- 2. Update the problematic policy on APPOINTMENTS
DROP POLICY IF EXISTS "Clients can view appointments they are registered for" ON public.appointments;

CREATE POLICY "Clients can view appointments they are registered for"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    -- Use the function instead of direct subquery to avoid triggering RLS on appointment_registrations
    check_client_registration(id)
  );

-- 3. Ensure 'public' visibility is also safe (it was fine, but just to be sure)
-- (No change needed for 'group'/'group_public' policies as they check 'sessions' table which doesn't loop back to appointments usually)
