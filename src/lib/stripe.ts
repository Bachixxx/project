import { loadStripe } from '@stripe/stripe-js/pure';
import { supabase } from './supabase';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error('Missing Stripe public key');
}

let stripePromise: Promise<any> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return await stripePromise;
};

export async function createSubscriptionSession(
  coachId: string, 
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    console.log('Creating subscription session with:', {
      coachId,
      priceId,
      successUrl,
      cancelUrl
    });

    const { data, error } = await supabase.functions.invoke(
      'create-subscription-session',
      {
        body: {
          coachId: coachId,
          priceId: priceId,
          successUrl: successUrl,
          cancelUrl: cancelUrl
        }
      }
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log("DATA",data)

    if (!data?.url) {
      throw new Error('No checkout URL received from server');
    }

    return data;
  } catch (error) {
    console.error('Error creating subscription session:', error);
    throw error;
  }
}

export async function createCheckoutSession(programId: string, clientId: string) {
  try {
    console.log('Fetching program details for:', programId);
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('coach_id')
      .eq('id', programId)
      .single();

    if (programError) {
      console.error('Program fetch error:', programError);
      throw new Error(`Impossible de récupérer les détails du programme: ${programError.message}`);
    }

    if (!program?.coach_id) {
      throw new Error('ID du coach introuvable pour ce programme');
    }

    console.log('Invoking create-checkout-session function...');
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        programId,
        clientId,
        coachId: program.coach_id,
        successUrl: `${window.location.origin}/client/workouts?payment=success`,
        cancelUrl: `${window.location.origin}/marketplace?payment=cancelled`
      }
    });

    console.log('Function response:', { data, error });
    console.log('Data keys:', Object.keys(data || {}));
    console.log('Data.url:', data?.url);
    console.log('Data.id:', data?.id);

    if (error) {
      console.error('Function invocation error:', error);
      const errorMsg = error.message || 'Unknown error';

      if (errorMsg.includes('Stripe is not configured') || errorMsg.includes('STRIPE_SECRET_KEY')) {
        throw new Error('Le système de paiement n\'est pas encore configuré. Veuillez contacter l\'administrateur pour activer les paiements Stripe.');
      }

      throw new Error(`Erreur lors de la création de la session: ${errorMsg}`);
    }

    if (!data?.url) {
      console.error('No checkout URL in response:', data);
      console.error('Full data object:', JSON.stringify(data));
      throw new Error('Aucune URL de paiement retournée par le serveur');
    }

    console.log('Redirecting to Stripe checkout:', data.url);
    console.log('URL type:', typeof data.url);
    console.log('URL length:', data.url?.length);

    // Try to open in new window first, fallback to redirect
    const newWindow = window.open(data.url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup blocked or failed, try direct redirect
      console.log('Popup blocked, trying direct redirect...');
      window.location.href = data.url;
    } else {
      console.log('Opened Stripe checkout in new window');
    }
  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
}

export async function createPortalSession(clientId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { clientId }
    });

    if (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }

    if (!data?.url) {
      throw new Error('No portal URL returned from server');
    }

    window.location.href = data.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export async function createAppointmentPaymentLink(appointmentId: string) {
  try {
    console.log('Creating payment link for appointment:', appointmentId);

    const { data, error } = await supabase.functions.invoke('create-appointment-payment-link', {
      body: { appointmentId }
    });

    console.log('Response data:', data);
    console.log('Response error:', error);

    if (error) {
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw new Error(data?.error || error.message || 'Failed to create payment link');
    }

    if (!data?.url) {
      throw new Error('No payment URL returned from server');
    }

    return data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}