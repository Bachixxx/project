import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Calendar, ChevronLeft, AlertCircle, Sparkles, Star, Zap, Shield } from 'lucide-react';
import { t } from '../i18n';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Constants for Stripe Price IDs
const PRICE_IDS = {
  month: 'price_1Sw4I3KjaGJ8zmprFtqt5fyh',
  year: 'price_1Sw4IdKjaGJ8zmprhClmpIHp',
  lifetime: 'price_1Sw4JZKjaGJ8zmpr11p50J9p'
};

function UpgradePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscriptionInfo, upgradeSubscription } = useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year' | 'lifetime'>('month');

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handleSuccessfulPayment();
    }
  }, [searchParams]);

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

  const handleUpgrade = async (interval: 'month' | 'year' | 'lifetime') => {
    try {
      setError(null);
      setIsLoading(true);

      const priceId = PRICE_IDS[interval];

      if (!priceId) {
        throw new Error(`Price ID not found for ${interval}`);
      }

      await upgradeSubscription(priceId, interval === 'lifetime' ? 'payment' : 'subscription');

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
      <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />

        <div className="glass-card max-w-md w-full p-8 text-center relative z-10 border-primary-500/30">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Félicitations !
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            Votre abonnement Pro a été activé. Vous avez maintenant accès à toutes les fonctionnalités premium.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all transform hover:scale-[1.02]"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-2 group-hover:bg-white/10 transition-colors border border-white/5">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Retour au tableau de bord
        </Link>

        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold mb-4">
            UPGRADE YOUR GAME
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Passez au niveau supérieur
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Débloquez toutes les fonctionnalités Pro et offrez à vos clients l'expérience de coaching ultime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex p-1 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${billingInterval === 'month'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingInterval === 'year'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Annuel
              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                -17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-8 animate-slide-in">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>{error}</div>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          <div className="glass-card relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border-primary-500/30 shadow-2xl shadow-primary-500/10 group">

            {/* Glowing header effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500"></div>

            {/* 14 Day Trial Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-bl from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                14 JOURS OFFERTS
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-primary-400 fill-primary-400" />
                  </div>
                  <h3 className="text-white text-2xl font-bold">Pro {billingInterval === 'month' ? 'Mensuel' : 'Annuel'}</h3>
                  <p className="text-gray-400 mt-1">L'expérience complète sans limite.</p>
                </div>
                <div className="text-right mt-2">
                  <div className="text-4xl font-bold text-white tracking-tight">
                    {billingInterval === 'month' ? '19.00' : billingInterval === 'year' ? '199' : '1200'} <span className="text-lg text-gray-500 font-normal">CHF</span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {billingInterval === 'lifetime' ? 'Paiement unique' : `/${billingInterval === 'month' ? 'mois' : 'an'}`}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  { text: "Clients illimités", icon: UsersIcon },
                  { text: "Création de programmes avancée", icon: Zap },
                  { text: "Suivi des performances & Stats", icon: ActivityIcon },
                  { text: "Application Client dédiée", icon: SmartphoneIcon },
                  { text: "Bibliothèque d'exercices complète", icon: DumbbellIcon },
                  { text: "Support prioritaire 24/7", icon: Shield }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center mr-4 text-primary-400">
                      {feature.icon ? <feature.icon className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </div>
                    <span className="text-gray-200 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(billingInterval)}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl text-center font-bold text-lg shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${isLoading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white shadow-primary-500/25'
                  }`}
              >
                {isLoading ? (
                  'Chargement...'
                ) : (
                  <>
                    Commencer l'essai gratuit
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-400">
                  {billingInterval === 'lifetime' ? 'Accès à vie, paiement unique.' : `14 jours offerts, puis ${billingInterval === 'month' ? '19.00' : '199'} CHF/${billingInterval === 'month' ? 'mois' : 'an'}.`}
                </p>
                <p className="text-xs text-gray-500">
                  Sans engagement. Annulable à tout moment en un clic.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Paiement sécurisé via Stripe • Satisfait ou remboursé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Icon Wrappers for cleaner code above if not imported
const UsersIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const ActivityIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const DumbbellIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg>;
const SmartphoneIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>;

export default UpgradePage;