import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionSession } from '../lib/stripe';
import { useAdapty } from './useAdapty';

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
  const { user } = useAuth();
  const { hasPremium } = useAdapty();

  const { data: subscriptionInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id, hasPremium()],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      if (!user?.id) return null;

      // Get coach subscription info
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (coachError) throw coachError;

      if (!coachData) return null;

      // Check native premium status
      const isNativePremium = hasPremium();
      const isPaid = coachData.subscription_type === 'paid' || isNativePremium;

      // Get current client count
      const { count: currentClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id);

      return {
        type: isPaid ? 'paid' : 'free',
        clientLimit: isPaid ? 999999 : coachData.client_limit, // Unlimited if paid
        currentClients: currentClients || 0,
        canAddClient: isPaid || (currentClients || 0) < coachData.client_limit,
        subscriptionEnd: coachData.subscription_end_date,
        hasBranding: coachData.has_branding || false,
        brandingSubscriptionId: coachData.branding_subscription_id,
        hasTerminal: coachData.has_terminal || false,
        terminalSubscriptionId: coachData.terminal_subscription_id,
      };
    },
    enabled: !!user,
  });

  const subscribeToBranding = async () => {
    try {
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
      throw error;
    }
  }

  const subscribeToTerminal = async () => {
    try {
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
      throw error;
    }
  }

  const upgradeSubscription = async (priceId?: string, mode: 'subscription' | 'payment' = 'subscription') => {
    try {
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
      throw error; // Let the component handle the error display
    }
  };

  return {
    subscriptionInfo: subscriptionInfo || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    upgradeSubscription,
    subscribeToBranding,
    subscribeToTerminal,
    refreshSubscriptionInfo: refetch,
  };
}
