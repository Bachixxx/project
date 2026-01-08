/*
  # Add payment method to appointments

  1. Changes
    - Add `payment_method` column to `appointments` table
      - Values: 'online' (paid when booking) or 'in_person' (paid at session)
      - Default: 'in_person'
    - Add `payment_status` column to track payment completion
      - Values: 'pending', 'completed', 'refunded'
      - Default: 'pending'

  2. Purpose
    - Allows coaches to specify how they want to be paid for each appointment
    - Tracks whether payment has been completed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN payment_method text DEFAULT 'in_person' NOT NULL,
    ADD CONSTRAINT appointments_payment_method_check 
      CHECK (payment_method IN ('online', 'in_person'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN payment_status text DEFAULT 'pending' NOT NULL,
    ADD CONSTRAINT appointments_payment_status_check 
      CHECK (payment_status IN ('pending', 'completed', 'refunded'));
  END IF;
END $$;