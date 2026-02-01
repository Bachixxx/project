-- Drop the existing check constraint on interval
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_interval_check;

-- Add the new check constraint including 'lifetime'
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_interval_check 
  CHECK (interval IN ('month', 'year', 'lifetime'));

-- Update existing monthly plan (19 CHF)
UPDATE subscription_plans
SET 
  price = 19.00,
  stripe_price_id = 'price_1Sw4I3KjaGJ8zmprFtqt5fyh'
WHERE interval = 'month';

-- Update existing yearly plan (199 CHF)
UPDATE subscription_plans
SET 
  price = 199.00,
  stripe_price_id = 'price_1Sw4IdKjaGJ8zmprhClmpIHp'
WHERE interval = 'year';

-- Insert Lifetime plan (1200 CHF)
INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id, stripe_product_id)
VALUES (
  'Pro Lifetime',
  'Accès à vie à toutes les fonctionnalités Pro',
  1200.00,
  'lifetime',
  ARRAY[
    'Clients illimités',
    'Bibliothèque d''exercices personnalisée',
    'Création de programmes',
    'Gestion du calendrier',
    'Traitement des paiements',
    'Suivi des progrès des clients',
    'Accès à vie',
    'Paiement unique'
  ],
  'price_1Sw4JZKjaGJ8zmpr11p50J9p',
  'prod_RialhSXBiFHByN'
)
ON CONFLICT (stripe_price_id) DO UPDATE
SET
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  name = EXCLUDED.name,
  features = EXCLUDED.features;
