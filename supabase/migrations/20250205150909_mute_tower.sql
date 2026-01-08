-- First remove any duplicate stripe_price_ids
UPDATE subscription_plans
SET stripe_price_id = NULL
WHERE stripe_price_id = 'price_1OvXXXKjaGJ8zmprXXXXXXXX';

-- Now update the plans with unique IDs
UPDATE subscription_plans
SET stripe_price_id = 'price_1OvXXXKjaGJ8zmprXXXXXXXX_monthly'
WHERE interval = 'month';

UPDATE subscription_plans
SET stripe_price_id = 'price_1OvXXXKjaGJ8zmprXXXXXXXX_yearly'
WHERE interval = 'year';

-- Add NOT NULL constraint to stripe_price_id
ALTER TABLE subscription_plans
  ALTER COLUMN stripe_price_id SET NOT NULL;

-- Add unique constraint to stripe_price_id
ALTER TABLE subscription_plans
  ADD CONSTRAINT subscription_plans_stripe_price_id_key UNIQUE (stripe_price_id);