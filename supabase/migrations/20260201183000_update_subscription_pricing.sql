-- Drop the existing check constraint on interval
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_interval_check;

-- Add the new check constraint including 'lifetime'
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_interval_check 
  CHECK (interval IN ('month', 'year', 'lifetime'));


-- 1. MONTHLY PLAN (19.90 CHF)
INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id, stripe_product_id, is_test)
VALUES 
(
  'Professionnel (Mensuel)',
  'Tout ce qu''il faut pour scaler.',
  19.90,
  'month',
  ARRAY[
    'Clients illimités',
    'Programmes illimités',
    'Bibliothèque d''exercices illimitée',
    'Paiements sans commission',
    'Support prioritaire 24/7'
  ],
  'price_1Sw4I3KjaGJ8zmprFtqt5fyh',
  'prod_RialhSXBiFHByN',
  true
)
ON CONFLICT (stripe_price_id) DO UPDATE
SET 
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  stripe_product_id = EXCLUDED.stripe_product_id,
  is_test = true;

-- Archive old monthly plans (instead of deleting them which causes FK errors)
UPDATE subscription_plans 
SET is_test = false 
WHERE interval = 'month' AND stripe_price_id != 'price_1Sw4I3KjaGJ8zmprFtqt5fyh';


-- 2. YEARLY PLAN (199.00 CHF)
INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id, stripe_product_id, is_test)
VALUES 
(
  'Professionnel (Annuel)',
  'Tout ce qu''il faut pour scaler.',
  199.00,
  'year',
  ARRAY[
    'Clients illimités',
    'Programmes illimités',
    'Bibliothèque d''exercices illimitée',
    'Paiements sans commission',
    'Support prioritaire 24/7',
    '14 jours d''essai gratuit'
  ],
  'price_1Sw4IdKjaGJ8zmprhClmpIHp',
  'prod_RialhSXBiFHByN',
  true
)
ON CONFLICT (stripe_price_id) DO UPDATE
SET 
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  stripe_product_id = EXCLUDED.stripe_product_id,
  is_test = true;

-- Archive old yearly plans
UPDATE subscription_plans 
SET is_test = false 
WHERE interval = 'year' AND stripe_price_id != 'price_1Sw4IdKjaGJ8zmprhClmpIHp';


-- 3. LIFETIME PLAN (1200.00 CHF)
INSERT INTO subscription_plans (name, description, price, interval, features, stripe_price_id, stripe_product_id, is_test)
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
  'prod_RialhSXBiFHByN',
  true
)
ON CONFLICT (stripe_price_id) DO UPDATE
SET
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  name = EXCLUDED.name,
  features = EXCLUDED.features;
