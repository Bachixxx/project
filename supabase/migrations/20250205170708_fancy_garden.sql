-- First, remove the constraint that's causing issues
ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS valid_stripe_price_ids;

-- Remove any subscription plan references from coaches
DO $$ 
BEGIN
  UPDATE coaches
  SET subscription_plan_id = NULL
  WHERE subscription_plan_id IS NOT NULL;
END $$;

-- Now we can safely manage the subscription plans
DO $$ 
BEGIN
  -- Delete existing plans
  DELETE FROM subscription_plans;

  -- Insert the monthly plan
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

  -- Insert the yearly plan
  INSERT INTO subscription_plans (
    name,
    description,
    price,
    interval,
    features,
    stripe_price_id,
    stripe_product_id
  ) VALUES (
    'Pro Annuel',
    'Outils et fonctionnalités professionnels de coaching avec réduction annuelle',
    499.00,
    'year',
    ARRAY[
      'Clients illimités',
      'Bibliothèque d''exercices personnalisée',
      'Création de programmes',
      'Gestion du calendrier',
      'Traitement des paiements',
      'Suivi des progrès des clients',
      '2 mois gratuits'
    ],
    'price_1NhwTiKjaGJ8zmprwIkIDXip',
    'prod_RiamLbgrzgFknW'
  );
END $$;

-- Add new constraint after data is inserted
ALTER TABLE subscription_plans
  ADD CONSTRAINT valid_stripe_price_ids
  CHECK (stripe_price_id IN (
    'price_1NhwTiKjaGJ8zmprI3sfWfNy',
    'price_1NhwTiKjaGJ8zmprwIkIDXip'
  ));

-- Verify the data
DO $$ 
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;
  
  IF plan_count != 2 THEN
    RAISE EXCEPTION 'Expected exactly 2 subscription plans, found %', plan_count;
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
  
  -- Verify yearly plan
  IF NOT EXISTS (
    SELECT 1 FROM subscription_plans 
    WHERE interval = 'year' 
    AND stripe_price_id = 'price_1NhwTiKjaGJ8zmprwIkIDXip'
    AND stripe_product_id = 'prod_RiamLbgrzgFknW'
  ) THEN
    RAISE EXCEPTION 'Yearly plan not found or has incorrect data';
  END IF;
END $$;