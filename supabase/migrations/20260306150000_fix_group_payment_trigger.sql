-- Fix the auto-payment trigger for group/online appointments
-- The old trigger created payment records with payment_method='cash' for ALL appointments,
-- even group sessions (where client_id is null) and online payment appointments.
-- This caused the dashboard to show "Sur place / En attente" even after a Stripe payment.

-- 1. Update the trigger function to skip group sessions and online-payment appointments.
--    Only auto-create a payment record for private sessions with in-person payment methods.
CREATE OR REPLACE FUNCTION create_payment_for_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-create a payment record for private appointments
  -- Group appointments get their payment records created by the Stripe webhook
  IF NEW.type = 'private' AND (NEW.payment_method IS NULL OR NEW.payment_method != 'online') THEN
    INSERT INTO payments (
      appointment_id,
      client_id,
      coach_id,
      amount,
      status,
      payment_method
    ) VALUES (
      NEW.id,
      NEW.client_id,
      NEW.coach_id,
      COALESCE(NEW.price, 0),
      'pending',
      COALESCE(NEW.payment_method, 'cash')
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Delete any stale 'pending'/'cash' payment records for group appointments
--    that were incorrectly auto-created by the old trigger.
--    These are identifiable by: group type + payment_method = 'cash' + status = 'pending' + no client_id
DELETE FROM payments
WHERE appointment_id IN (
  SELECT id FROM appointments WHERE type = 'group'
)
AND status = 'pending'
AND (payment_method = 'cash' OR payment_method = 'transfer')
AND client_id IS NULL;
