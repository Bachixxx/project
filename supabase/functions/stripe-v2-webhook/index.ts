import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@^17.0.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_V2') || ''; // Distinct secret for V2 listener

// Stripe Client
let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
    if (!_stripe) {
        _stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });
    }
    return _stripe;
};

Deno.serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature');

    if (!signature || !webhookSecret) {
        return new Response('Webhook Error: Missing signature or secret', { status: 400 });
    }

    try {
        const stripe = getStripe();
        const body = await req.text();

        // 1. Parse Event
        // "Use the following docs to help you parse 'thin' events... You must use thin events for V2 accounts"
        // "const thinEvent = client.parseThinEvent(req.body, sig, webhookSecret);"

        let event;
        let isThinEvent = false;

        // Try parsing as Thin Event first (V2)
        if (body.includes('"type": "v2.')) { // Heuristic check or just try parse
            try {
                // @ts-ignore
                const thinEvent = stripe.parseThinEvent(body, signature, webhookSecret);

                // Fetch full event
                // "const event = await client.v2.core.events.retrieve(thinEvent.id);"
                // @ts-ignore
                event = await stripe.v2.core.events.retrieve(thinEvent.id);
                isThinEvent = true;
            } catch (err) {
                console.log('Not a valid thin event or parse error', err);
            }
        }

        // Fallback to standard V1 parsing helper if not thin (or if above failed but it was V1)
        if (!event) {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        }

        console.log(`Received event: ${event.type}`);

        // 2. Handle Events
        // "Setup webhooks for subscriptions and store the users subscriptions status in the database"

        switch (event.type) {
            case 'v2.account.requirements.updated':
            case 'v2.account.capability_status_updated':
                // "Configure your application to respond to update events by collecting any updated requirements."
                console.log(`V2 Account Update: ${event.type}`, event.data);
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
            case 'customer.updated':
                // Handle Subscription Changes
                const subscription = event.data.object;
                const customerId = subscription.customer; // or event.data.object.id depending on event

                console.log(`Subscription Update for ${customerId}: ${event.type}`);

                // TODO: Store the user's subscription status in the database.
                // We need to map Stripe Customer ID -> User ID.
                // await supabase.from('users').update({ ... }).eq('stripe_customer_id', customerId);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
