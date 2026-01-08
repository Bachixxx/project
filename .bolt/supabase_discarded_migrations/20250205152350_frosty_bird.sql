-- Update subscription plans with correct Stripe price IDs
UPDATE subscription_plans
SET stripe_price_id = 'price_1OvXXXKjaGJ8zmprXXXXXXXX'
WHERE stripe_product_id = 'prod_RialhSXBiFHByN';

UPDATE subscription_plans
SET stripe_price_id = 'price_1OvXXXKjaGJ8zmprXXXXXXXX'
WHERE stripe_product_id = 'prod_RiamLbgrzgFknW';

-- Add constraint to ensure price IDs are unique
ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_stripe_price_id_key,
  ADD CONSTRAINT subscription_plans_stripe_price_id_key UNIQUE (stripe_price_id);