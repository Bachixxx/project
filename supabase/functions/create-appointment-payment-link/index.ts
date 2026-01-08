import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@13.11.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY environment variable is not set');
}

let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
  }
  return _stripe;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripe = getStripe();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId } = await req.json();

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, coach:coaches(full_name, email)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Appointment error:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found: ' + (appointmentError?.message || 'Unknown error') }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    console.log('Creating product for appointment:', appointmentId);
    const product = await stripe.products.create({
      name: appointment.title,
      description: `Séance ${appointment.type === 'group' ? 'de groupe' : 'privée'} avec ${appointment.coach?.full_name || 'votre coach'}`,
      metadata: {
        appointmentId: appointmentId,
        coachId: appointment.coach_id,
      },
    });

    console.log('Creating price for product:', product.id);
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'chf',
      unit_amount: Math.round(appointment.price * 100),
    });

    console.log('Creating payment link for price:', price.id);
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentId,
        coachId: appointment.coach_id,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://app.coachency.com'}/client/appointments?payment=success`,
        },
      },
    });

    await supabase
      .from('appointments')
      .update({
        payment_link: paymentLink.url,
        payment_link_id: paymentLink.id
      })
      .eq('id', appointmentId);

    return new Response(
      JSON.stringify({
        url: paymentLink.url,
        id: paymentLink.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating payment link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
