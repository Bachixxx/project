-- Idempotency table for Stripe webhook events.
-- Prevents double-processing when Stripe retries a webhook delivery.
CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
