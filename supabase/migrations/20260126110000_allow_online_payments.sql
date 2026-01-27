-- Add 'stripe' and 'online' to valid payment methods
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'transfer', 'online', 'stripe'));

-- Optional: Create a trigger to auto-create payment records for group sessions if needed
-- But we will handle this in the webhook for now.
