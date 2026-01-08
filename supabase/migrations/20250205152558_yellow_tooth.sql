/*
  # Update Stripe Price IDs

  1. Changes
    - Update monthly plan with correct price ID: price_1Qp9ZyKjaGJ8zmprMs2hVbte
    - Update yearly plan with correct price ID: price_1Qp9asKjaGJ8zmprq2QoGlim
*/

-- Update subscription plans with correct Stripe price IDs
UPDATE subscription_plans
SET stripe_price_id = 'price_1Qp9ZyKjaGJ8zmprMs2hVbte'
WHERE interval = 'month';

UPDATE subscription_plans
SET stripe_price_id = 'price_1Qp9asKjaGJ8zmprq2QoGlim'
WHERE interval = 'year';