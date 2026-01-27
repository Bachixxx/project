-- Add unique constraint to appointment_registrations to allow UPSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointment_registrations_appointment_id_client_id_key'
  ) THEN
    ALTER TABLE appointment_registrations 
    ADD CONSTRAINT appointment_registrations_appointment_id_client_id_key 
    UNIQUE (appointment_id, client_id);
  END IF;
END $$;

-- Add unique constraint to payments to allow UPSERT (one payment per appointment per client)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_appointment_id_client_id_key'
  ) THEN
    ALTER TABLE payments 
    ADD CONSTRAINT payments_appointment_id_client_id_key 
    UNIQUE (appointment_id, client_id);
  END IF;
END $$;

-- Verify payment_method check constraint again (ensure 'online' is allowed)
DO $$
BEGIN
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
  
  ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'transfer', 'online', 'stripe'));
END $$;
