/*
  # Add Stripe product and price IDs to subscription plans

  1. Changes
    - Add Stripe product ID column
    - Update existing plans with Stripe IDs
    - Add check constraint for subscription types

  2. Security
    - Maintain existing RLS policies
*/

-- Add Stripe product ID column if it doesn't exist
ALTER TABLE subscription_plans 
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Update subscription plans with Stripe IDs
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_RialhSXBiFHByN',
  stripe_price_id = 'price_monthly'
WHERE interval = 'month';

UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_RiamLbgrzgFknW',
  stripe_price_id = 'price_yearly'
WHERE interval = 'year';

-- Add check constraint for subscription types
ALTER TABLE coaches
  DROP CONSTRAINT IF EXISTS subscription_type_check,
  ADD CONSTRAINT subscription_type_check 
    CHECK (subscription_type IN ('free', 'paid'));