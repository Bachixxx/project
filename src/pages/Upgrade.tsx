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
  const { subscriptionInfo, refreshSubscriptionInfo, upgradeSubscription } = useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handleSuccessfulPayment();
    }
    fetchPlans();
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_test', true); // Assuming active plans are 'is_test' true based on previous code ? checking existing logic.
      // Or remove .eq('is_test', true) if we want production plans. Previous code used it.

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load subscription plans');
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

  const handleUpgrade = async (interval: 'month' | 'year') => {
    try {
      setError(null);
      setIsLoading(true);

      const selectedPlan = plans.find(p => p.interval === interval);
      // Fallback or alert if plan not found in DB
      if (!selectedPlan?.stripe_price_id) {
        // If we can't find it dynamically, maybe we should ask user for ID.
        // For now throw error.
        throw new Error(`Plan ${interval} not found in database.`);
      }

      await upgradeSubscription(selectedPlan.stripe_price_id);

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
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Passez à la version Pro pour débloquer toutes les fonctionnalités et développer votre activité de coaching
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingInterval === 'month'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingInterval === 'year'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Annuel
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                -17%
              </span>
            </button>
          </div>
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
          <div className="bg-white rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] relative overflow-hidden">

            {/* 14 Day Trial Badge */}
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-lg">
              14 JOURS GRATUITS
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                  <h3 className="text-gray-900 text-2xl font-bold mt-4">Pro {billingInterval === 'month' ? 'Mensuel' : 'Annuel'}</h3>
                  <p className="text-gray-600 mt-2">Accès complet à Coachency</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">
                    {billingInterval === 'month' ? '49.90' : '499'} <span className="text-lg">CHF</span>
                  </div>
                  <div className="text-gray-500">
                    /{billingInterval === 'month' ? 'mois' : 'an'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Features Hardcoded for now mostly, or from plan if available */}
                {[
                  "Nombre illimité de clients",
                  "Création de programmes avancée",
                  "Suivi des performances",
                  "Bibliothèque d'exercices complète",
                  "Support prioritaire"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(billingInterval)}
                disabled={isLoading}
                className={`w-full mt-8 py-4 rounded-xl text-center font-semibold ${isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25'
                  } text-white transition-colors block`}
              >
                {isLoading ? 'Chargement...' : 'Commencer l\'essai gratuit'}
              </button>

              <p className="mt-4 text-sm text-gray-500 text-center">
                14 jours offerts, puis {billingInterval === 'month' ? '49.90' : '499'} CHF/{billingInterval === 'month' ? 'mois' : 'an'}.<br />
                Annulable à tout moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage