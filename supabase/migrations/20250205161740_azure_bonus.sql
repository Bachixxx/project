-- Update subscription plans with the correct Stripe price IDs
UPDATE subscription_plans
SET 
  stripe_price_id = CASE
    WHEN interval = 'month' THEN 'price_1Qp9ZyKjaGJ8zmprMs2hVbte'
    WHEN interval = 'year' THEN 'price_1Qp9asKjaGJ8zmprq2QoGlim'
  END;

-- Add a check constraint to ensure only valid price IDs are used
ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS valid_stripe_price_ids,
  ADD CONSTRAINT valid_stripe_price_ids
    CHECK (stripe_price_id IN ('price_1Qp9ZyKjaGJ8zmprMs2hVbte', 'price_1Qp9asKjaGJ8zmprq2QoGlim'));

-- Clean up any old subscription records that might have invalid price IDs
DELETE FROM subscription_history 
WHERE payment_id NOT LIKE 'pi_%';  -- Remove records with invalid payment IDs

-- Add an index to improve lookup performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price_id 
  ON subscription_plans(stripe_price_id);