import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStripe } from '../lib/stripe';

export interface SubscriptionInfo {
  type: 'free' | 'paid';
  clientLimit: number;
  currentClients: number;
  canAddClient: boolean;
  subscriptionEnd?: string;
}

export function useSubscription() {
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
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
        .single();

      if (coachError) throw coachError;

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
      });
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async () => {
    try {
      // Get subscription plan details
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

      // Create Stripe checkout session
      if (!user?.id || !plan?.stripe_price_id) {
        throw new Error('Missing required data for subscription');
      }

      const data = await createSubscriptionSession(
        user.id,
        plan.stripe_price_id,
        `${window.location.origin}/upgrade?payment=success`,
        `${window.location.origin}/upgrade`
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
    upgradeSubscription,
    refreshSubscriptionInfo: fetchSubscriptionInfo,
  };
}
