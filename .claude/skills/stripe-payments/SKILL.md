# Stripe Payments — Coachency

## Edge Functions & Sequence

**Coach onboarding (Stripe Connect):**
`create-connect-account` → Creates Express account, stores `stripe_account_id` on `coaches`, returns onboarding URL.

**Web checkout (program or appointment):**
`create-checkout-session` → Creates/reuses Stripe customer (stored in `clients.stripe_customer_id`), creates checkout session routed to coach's `stripe_account_id`. 10% application fee.

**Native payment (appointment):**
`create-native-payment-sheet` → Returns `{ paymentIntent, ephemeralKey, customer, publishableKey }` to Stripe React Native SDK. 10% application fee. Currency: CHF.

**Terminal (in-person):**
`create-terminal-payment` → Creates PaymentIntent with `card_present`, `capture_method: automatic`. 1% application fee. Requires `stripe_account_id` on coach.

**Shareable link:**
`create-appointment-payment-link` → Creates Stripe Product + Price + PaymentLink, stores `payment_link` on `appointments`. No application fee.

**Webhook handler (`webhook/index.ts`):**
Handles four event types:
- `checkout.session.completed` — activates subscription, writes `subscription_history`, handles program/appointment payments
- `checkout.session.async_payment_succeeded` — same as above for async methods
- `payment_intent.succeeded` — terminal payments, creates `payments` record with guest info
- `customer.subscription.deleted` — resets `subscription_type` on `coaches`

Distinguishes three subscription add-ons via metadata: main (`stripe_subscription_id`), branding (`branding_subscription_id`), terminal (`terminal_subscription_id`).

**`update-coach-subscription`** — no Stripe calls, DB-only: sets `subscription_type='paid'`, `client_limit=null`, used for test plans.

## Key Constants
- Currency always CHF
- Application fee: 10% programs/appointments, 1% terminal
- Stripe customer created lazily → stored in `clients.stripe_customer_id`
- `coachId` must be in Stripe metadata for webhook to route correctly
