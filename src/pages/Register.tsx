import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff';
import { eye } from 'react-icons-kit/feather/eye';
import { Check, Activity, Sparkles, ChevronLeft, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { createSubscriptionSession } from '../lib/stripe';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  stripe_price_id: string;
}

const specializationOptions = [
  'Coach sportif personnel (musculation, remise en forme)',
  'Coach en perte de poids',
  'Coach en nutrition / diététique',
  'Coach en préparation physique (athlètes, compétitions)',
  'Coach de crossfit',
  'Coach de course à pied / marathon / trail',
  'Coach de triathlon',
  'Coach de cyclisme',
  'Coach de natation',
  'Coach yoga (Hatha, Vinyasa, Yin…)',
  'Coach pilates',
  'Coach de stretching / mobilité',
  'Coach de sport santé / post-rééducation',
  'Coach de boxe / arts martiaux',
  'Coach de danse (zumba, hip-hop, salsa…)',
  'Coach en activité physique adaptée (APA)'
];

function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialization: '',
  });
  const [type, setType] = useState('password');
  const [icon, setIcon] = useState(eyeOff);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year'); // Default to annual as requested implied "Best"
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const navigate = useNavigate();
  const { signUp, user } = useAuth(); // Removed unused signUp function

  useEffect(() => {
    fetchPlans();

    // Check for successful payment
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handleSuccessfulPayment();
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_test', true);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load subscription plans');
    }
  };

  const handlePasswordToggle = () => {
    if (type === 'password') {
      setIcon(eye);
      setType('text');
    } else {
      setIcon(eyeOff);
      setType('password');
    }
  };

  const handleSuccessfulPayment = async () => {
    try {
      setError('');
      setLoading(true);

      // Update coach subscription
      const { error: updateError } = await supabase.functions.invoke('update-coach-subscription', {
        body: { coachId: user?.id }
      });

      if (updateError) {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.fullName) {
        setError('Please fill in all required fields');
        return;
      }

      // Sign up user
      const { data: authData, error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
            specialization: formData.specialization || null,
            role: 'coach'
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('An error occurred during account creation');
        return;
      }

      // Proceed to Stripe checkout (Paid Only)
      const plan = plans.find(p => p.interval === billingInterval);
      if (!plan) {
        throw new Error('Selected plan not found');
      }

      const data = await createSubscriptionSession(
        authData.user.id,
        plan.stripe_price_id,
        `${window.location.origin}/register?payment=success`,
        `${window.location.origin}/register`,
        undefined,
        'subscription'
      );

      if (!data.url) {
        throw new Error('No checkout URL received from payment provider');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (searchParams.get('payment') === 'success') {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8 text-center animate-fade-in border border-green-500/30 bg-green-500/5">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Félicitations !
          </h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Votre abonnement Pro a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités premium.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
          >
            Accéder à mon tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/"
            className="group flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Retour à l'accueil</span>
          </Link>

          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Dumbbell className="w-5 h-5" />
            </div>
            Coachency
          </Link>
        </div>

        <div className="text-center mb-16 animate-slide-in">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Créez votre compte <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Coach</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

          {/* Left Column: Plan Selection */}
          <div className="space-y-6 animate-slide-in delay-100">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Choisissez votre offre
              </div>

              {/* Billing Toggle (Mini) */}
              <div className="inline-flex p-1 bg-white/5 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${billingInterval === 'month'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${billingInterval === 'year'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Annuel
                </button>
              </div>
            </h3>

            {/* Pro Plan Card (Single Option) */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-blue-500/50 flex flex-col shadow-2xl shadow-blue-500/10 transform transition-all">

              {/* Glowing border effect */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Populaire
              </div>

              <div className="mb-6 mt-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-400">Professionnel</h3>
                    <p className="text-sm text-gray-400">Tout ce qu'il faut pour scaler.</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-4xl font-bold text-white">
                    {billingInterval === 'month' ? '19.90' : '199'}
                  </span>
                  <span className="text-xl font-bold text-white">CHF</span>
                  <span className="text-gray-400">/{billingInterval === 'month' ? 'mois' : 'an'}</span>
                </div>

                {billingInterval === 'year' && (
                  <div className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-full mb-2">
                    -17% + 14 JOURS OFFERTS
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-4">
                <FeatureRow text="Clients illimités" highlight />
                <FeatureRow text="Programmes illimités" highlight />
                <FeatureRow text="Bibliothèque d'exercices illimitée" />
                <FeatureRow text="Paiements sans commission" highlight />
                <FeatureRow text="Support prioritaire 24/7" />
                <FeatureRow text="14 jours d'essai gratuit" highlight />
              </div>
            </div>

          </div>

          {/* Right Column: Registration Form */}
          <div className="animate-slide-in delay-200">
            <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Vos informations</h2>
                  <p className="text-gray-400 text-sm">Remplissez ce formulaire pour créer votre compte.</p>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 flex items-start gap-3">
                    <Activity className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                        {t('auth.fullName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="+41 79 123 45 67"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      {t('auth.email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={type}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={handlePasswordToggle}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        <Icon icon={icon} size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      {t('auth.specialization')}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.specialization}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-gray-400">Sélectionnez votre spécialisation</option>
                        {specializationOptions.map((option, index) => (
                          <option key={index} value={option} className="bg-slate-900 text-white">
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <ChevronLeft className="w-5 h-5 -rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <span>Commencer l'essai gratuit</span>
                          <ChevronLeft className="w-5 h-5 rotate-180" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-6">
                    En créant un compte, vous acceptez nos <a href="#" className="text-blue-400 hover:underline">Conditions d'utilisation</a>.
                  </p>
                </form>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Connexion Coach
              </Link>
            </div>
            <div className="mt-2 text-center text-sm text-gray-500">
              Client ?{' '}
              <Link to="/client/check-email" className="font-medium text-gray-400 hover:text-white transition-colors">
                Accès Espace Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ text, highlight = false }: { text: string, highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className={`text-sm ${highlight ? 'text-white font-medium' : 'text-gray-400'}`}>{text}</span>
    </li>
  );
}

export default Register;