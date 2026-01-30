-- Add coach_id to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id);

-- Backfill coach_id for existing payments based on appointments
UPDATE payments p
SET coach_id = a.coach_id
FROM appointments a
WHERE p.appointment_id = a.id
AND p.coach_id IS NULL;

-- If there are payments linked only to clients (not appointments), backfill from clients
UPDATE payments p
SET coach_id = c.coach_id
FROM clients c
WHERE p.client_id = c.id
AND p.coach_id IS NULL;

-- Update RLS Policy to allow access based on coach_id directly
DROP POLICY IF EXISTS "Coaches can manage payments for their appointments" ON payments;

CREATE POLICY "Coaches can manage their own payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
      AND a.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
      AND a.coach_id = auth.uid()
    )
  );
