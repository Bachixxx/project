/*
  # Fix client appointments visibility

  1. Security Updates
    - Add RLS policy for clients to view their own appointments
    - Ensure clients can see appointments where they are assigned as client_id
    - Update existing policies to include client access

  2. Changes
    - Add "Clients can view their appointments" policy to appointments table
    - This allows clients to see appointments where client_id matches their client record
*/

-- Add RLS policy for clients to view their own appointments
CREATE POLICY "Clients can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = appointments.client_id 
      AND clients.auth_id = auth.uid()
    )
  );

-- Also ensure clients can view appointment details they need
CREATE POLICY "Clients can view appointment payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN clients c ON c.id = a.client_id
      WHERE a.id = payments.appointment_id
      AND c.auth_id = auth.uid()
    )
  );