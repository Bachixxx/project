-- First, remove any existing constraints
DO $$ 
BEGIN
  -- Drop constraints if they exist
  ALTER TABLE subscription_plans
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_price_id_key,
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_product_id_key,
    DROP CONSTRAINT IF EXISTS valid_stripe_price_id;
END $$;

-- Remove any subscription plan references from coaches
UPDATE coaches
SET subscription_plan_id = NULL
WHERE subscription_plan_id IS NOT NULL;

-- Delete existing plans
DELETE FROM subscription_plans;

-- Insert only the monthly plan
INSERT INTO subscription_plans (
  name,
  description,
  price,
  interval,
  features,
  stripe_price_id,
  stripe_product_id
) VALUES (
  'Pro Mensuel',
  'Outils et fonctionnalités professionnels de coaching',
  49.90,
  'month',
  ARRAY[
    'Clients illimités',
    'Bibliothèque d''exercices personnalisée',
    'Création de programmes',
    'Gestion du calendrier',
    'Traitement des paiements',
    'Suivi des progrès des clients'
  ],
  'price_1NhwTiKjaGJ8zmprI3sfWfNy',
  'prod_RialhSXBiFHByN'
);

-- Add constraints after data is inserted
ALTER TABLE subscription_plans
  ALTER COLUMN stripe_price_id SET NOT NULL,
  ALTER COLUMN stripe_product_id SET NOT NULL;

-- Add unique constraints with new names
ALTER TABLE subscription_plans
  ADD CONSTRAINT subscription_plans_price_id_unique UNIQUE (stripe_price_id),
  ADD CONSTRAINT subscription_plans_product_id_unique UNIQUE (stripe_product_id);

-- Verify the data
DO $$ 
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;
  
  IF plan_count != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 subscription plan, found %', plan_count;
  END IF;
  
  -- Verify monthly plan
  IF NOT EXISTS (
    SELECT 1 FROM subscription_plans 
    WHERE interval = 'month' 
    AND stripe_price_id = 'price_1NhwTiKjaGJ8zmprI3sfWfNy'
    AND stripe_product_id = 'prod_RialhSXBiFHByN'
  ) THEN
    RAISE EXCEPTION 'Monthly plan not found or has incorrect data';
  END IF;
END $$;