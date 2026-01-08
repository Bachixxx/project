-- Update subscription plans with correct price ID
UPDATE subscription_plans
SET stripe_price_id = 'price_1NhwTiKjaGJ8zmprwIkIDXip'
WHERE interval = 'month';

-- Add constraint to ensure valid price IDs
ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS valid_stripe_price_id,
  ADD CONSTRAINT valid_stripe_price_id
    CHECK (stripe_price_id = 'price_1NhwTiKjaGJ8zmprwIkIDXip');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price_id 
  ON subscription_plans(stripe_price_id);