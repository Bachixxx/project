import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Calendar, ChevronLeft, AlertCircle } from 'lucide-react';
import { t } from '../i18n';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  stripe_price_id: string;
}

function UpgradePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscriptionInfo, refreshSubscriptionInfo } = useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handleSuccessfulPayment();
    }
    fetchPlan();
  }, [searchParams]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('interval', 'month')
        .eq('is_test', true)
        .single();

      if (error) throw error;
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
      setError('Failed to load subscription plan');
    }
  };

  const handleSuccessfulPayment = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Update coach subscription
      const { error: updateError } = await supabase.functions.invoke('update-coach-subscription', {
        body: { coachId: user?.id }
      });

      if (updateError) {
        throw new Error('Failed to update subscription');
      }

      // Refresh subscription info
      await refreshSubscriptionInfo();

    } catch (error) {
      console.error('Error updating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
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
      window.open(data.url, '_self');
    } catch (error) {
      console.error('Error creating subscription session:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while setting up your subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message if redirected from successful payment
  if (searchParams.get('payment') === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Félicitations !
          </h1>
          <p className="text-gray-600 mb-6">
            Votre abonnement Pro a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités premium.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-white/80 hover:text-white mb-8"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour au tableau de bord
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">{t('auth.choosePlan')}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Passez à la version Pro pour débloquer toutes les fonctionnalités et développer votre activité de coaching
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl transition-all transform hover:scale-105">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                  <h3 className="text-gray-900 text-2xl font-bold mt-4">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price} <span className="text-lg">CHF</span>
                  </div>
                  <div className="text-gray-500">
                    /{t('auth.perMonth')}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className={`w-full mt-8 py-4 rounded-xl text-center font-semibold ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25'
                } text-white transition-colors block`}
              >
                {isLoading ? 'Chargement...' : `Passer à ${plan.name}`}
              </button>

              <p className="mt-4 text-sm text-gray-500 text-center">
                Deviens le Coach de demain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage