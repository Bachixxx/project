-- 1. Reset ALL plans to inactive (safety net)
UPDATE subscription_plans SET is_test = false;

-- 2. Activate ONLY the correct new plans
UPDATE subscription_plans
SET is_test = true
WHERE stripe_price_id IN (
  'price_1Sw4I3KjaGJ8zmprFtqt5fyh', -- Monthly 19.90
  'price_1Sw4IdKjaGJ8zmprhClmpIHp', -- Yearly 199.00
  'price_1Sw4JZKjaGJ8zmpr11p50J9p'  -- Lifetime
);

-- 3. Verify Product IDs (ensure they are correct for the active plans)
UPDATE subscription_plans
SET stripe_product_id = 'prod_RialhSXBiFHByN'
WHERE stripe_price_id IN (
  'price_1Sw4I3KjaGJ8zmprFtqt5fyh',
  'price_1Sw4IdKjaGJ8zmprhClmpIHp'
);

UPDATE subscription_plans
SET stripe_product_id = 'prod_RialhSXBiFHByN'
WHERE stripe_price_id = 'price_1Sw4JZKjaGJ8zmpr11p50J9p';
