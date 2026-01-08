/*
  # Add Payment Link Fields to Appointments

  1. Changes
    - Add `payment_link` column to store Stripe payment link URL
    - Add `payment_link_id` column to store Stripe payment link ID
    
  2. Purpose
    - Enable coaches to generate payment links for online payment appointments
    - Store payment link information for tracking and display
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'payment_link'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'payment_link_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_link_id text;
  END IF;
END $$;
