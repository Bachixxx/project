import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionSession } from '../lib/stripe';

export interface SubscriptionInfo {
  type: 'free' | 'paid';
  clientLimit: number;
  currentClients: number;
  canAddClient: boolean;
  subscriptionEnd?: string;
  hasBranding: boolean;
  brandingSubscriptionId?: string;
  hasTerminal: boolean;
  terminalSubscriptionId?: string;
}

export function useSubscription() {
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    try {
      // Get coach subscription info
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (coachError) throw coachError;

      if (!coachData) {
        setLoading(false);
        return;
      }

      // Get current client count
      const { count: currentClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id);

      setSubscriptionInfo({
        type: coachData.subscription_type,
        clientLimit: coachData.client_limit,
        currentClients: currentClients || 0,
        canAddClient:
          coachData.subscription_type === 'paid' ||
          (currentClients || 0) < coachData.client_limit,
        subscriptionEnd: coachData.subscription_end_date,
        hasBranding: coachData.has_branding || false,
        brandingSubscriptionId: coachData.branding_subscription_id,
        hasTerminal: coachData.has_terminal || false,
        terminalSubscriptionId: coachData.terminal_subscription_id,
      });
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBranding = async () => {
    try {
      setError(null);

      // Branding Price ID provided by user
      const brandingPriceId = 'price_1SubaaKjaGJ8zmprmJAOHsmh';

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const data = await createSubscriptionSession(
        user.id,
        brandingPriceId,
        `${window.location.origin}/branding?payment=success`,
        `${window.location.origin}/branding`,
        { type: 'branding_addon' } // Metadata to distinguish from main sub
      );

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.open(data.url, '_self');
    }
    catch (error) {
      console.error('Error creating branding subscription session:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      throw error;
    }
  }

  const subscribeToTerminal = async () => {
    try {
      setError(null);

      // Terminal Price ID - Updated from user input
      const terminalPriceId = 'price_1Sv0Y1KjaGJ8zmprX8HCe6QR';

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const data = await createSubscriptionSession(
        user.id,
        terminalPriceId,
        `${window.location.origin}/terminal?payment=success`,
        `${window.location.origin}/terminal`,
        { type: 'terminal_addon' }
      );

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.open(data.url, '_self');
    }
    catch (error) {
      console.error('Error creating terminal subscription session:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      throw error;
    }
  }

  const upgradeSubscription = async (priceId?: string, mode: 'subscription' | 'payment' = 'subscription') => {
    try {
      setError(null);

      let finalPriceId = priceId;

      // If no price ID provided, fallback to default monthly plan
      if (!finalPriceId) {
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('interval', 'month')
          .eq('is_test', true)
          .single();

        if (planError) {
          console.error('Error fetching plan:', planError);
          throw new Error('Plan not found');
        }
        finalPriceId = plan?.stripe_price_id;
      }

      // Create Stripe checkout session
      if (!user?.id || !finalPriceId) {
        throw new Error('Missing required data for subscription');
      }

      const data = await createSubscriptionSession(
        user.id,
        finalPriceId,
        `${window.location.origin}/upgrade?payment=success`,
        `${window.location.origin}/upgrade`,
        undefined,
        mode
      );

      if (!data.url) {
        throw new Error('No checkout URL received from payment provider');
      }

      // Redirect to Stripe Checkout
      window.open(data.url, '_self')
    }
    catch (error) {
      console.error('Error creating subscription session:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while setting up your subscription');
    }
  };

  return {
    subscriptionInfo,
    loading,
    error,
    upgradeSubscription,
    subscribeToBranding,
    subscribeToTerminal,
    refreshSubscriptionInfo: fetchSubscriptionInfo,
  };
}
