-- First, remove any existing constraints and data
DO $$ 
BEGIN
  -- Drop constraints if they exist
  ALTER TABLE subscription_plans
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_price_id_key,
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_product_id_key,
    DROP CONSTRAINT IF EXISTS valid_stripe_price_id,
    DROP CONSTRAINT IF EXISTS subscription_plans_price_id_unique,
    DROP CONSTRAINT IF EXISTS subscription_plans_product_id_unique,
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_price_unique,
    DROP CONSTRAINT IF EXISTS subscription_plans_stripe_product_unique;

  -- Remove any subscription plan references from coaches
  UPDATE coaches
  SET subscription_plan_id = NULL
  WHERE subscription_plan_id IS NOT NULL;

  -- Delete existing plans
  DELETE FROM subscription_plans;
END $$;

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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON subscription_plans(interval);

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- Add stripe_customer_id to coaches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE coaches ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Add subscription_type to coaches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
    AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE coaches ADD COLUMN subscription_type TEXT DEFAULT 'free';
  END IF;
END $$;

-- Add client_limit to coaches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
    AND column_name = 'client_limit'
  ) THEN
    ALTER TABLE coaches ADD COLUMN client_limit INTEGER DEFAULT 5;
  END IF;
END $$;

-- Add subscription_end_date to coaches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
    AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE coaches ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add stripe_subscription_id to coaches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE coaches ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Add subscription type check constraint
ALTER TABLE coaches
  DROP CONSTRAINT IF EXISTS subscription_type_check,
  ADD CONSTRAINT subscription_type_check 
    CHECK (subscription_type IN ('free', 'paid'));