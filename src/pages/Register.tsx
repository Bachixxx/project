import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff';
import { eye } from 'react-icons-kit/feather/eye';
import { UserPlus, Check, Calendar, Users, DollarSign, Activity, Sparkles, Clock, ChevronLeft, Dumbbell } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid'>('free');
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
            specialization: formData.specialization || null
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

      // If paid plan selected, redirect to Stripe checkout
      if (selectedPlan === 'paid') {
        const plan = plans.find(p => p.interval === 'month');
        if (!plan) {
          throw new Error('Selected plan not found');
        }

        const data = await createSubscriptionSession(
          authData.user.id,
          plan.stripe_price_id,
          `${window.location.origin}/register?payment=success`,
          `${window.location.origin}/register`
        );

        if (!data.url) {
          throw new Error('No checkout URL received from payment provider');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        // Free plan - go directly to dashboard
        navigate('/dashboard');
      }
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
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Choisissez votre offre
            </h3>

            {/* Free Plan Card */}
            <div
              onClick={() => setSelectedPlan('free')}
              className={`relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-2xl border ${selectedPlan === 'free'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                }`}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedPlan === 'free' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Découverte</h3>
                    <p className="text-sm text-gray-400">Idéal pour débuter</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">0 CHF</div>
                  <div className="text-xs text-gray-500 font-medium">/MOIS</div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-12 rounded-l-full transition-all ${selectedPlan === 'free' ? 'bg-blue-500' : 'bg-transparent'}`} />
            </div>

            {/* Pro Plan Card */}
            <div
              onClick={() => setSelectedPlan('paid')}
              className={`relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-2xl border ${selectedPlan === 'paid'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 plan-card-hover'
                }`}
            >
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Populaire
              </div>

              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedPlan === 'paid' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Professionnel</h3>
                    <p className="text-sm text-gray-400">Pour les coachs ambitieux</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">49.90 CHF</div>
                  <div className="text-xs text-blue-400 font-medium">+ 14 JOURS OFFERTS</div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-12 rounded-l-full transition-all ${selectedPlan === 'paid' ? 'bg-blue-500' : 'bg-transparent'}`} />
            </div>

            {/* Features List displaying based on selection */}
            <div className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                Inclus dans l'offre {selectedPlan === 'free' ? 'Découverte' : 'Professionnelle'}
              </h4>
              <ul className="space-y-3">
                {selectedPlan === 'free' ? (
                  <>
                    <FeatureRow text="Jusqu'à 5 clients" />
                    <FeatureRow text="Jusqu'à 5 programmes" />
                    <FeatureRow text="Analyses avancées" />
                    <FeatureRow text="Multi-coachs" />
                    <FeatureRow text="Support standard" />
                  </>
                ) : (
                  <>
                    <FeatureRow text="Clients illimités" highlight />
                    <FeatureRow text="Programmes illimités" highlight />
                    <FeatureRow text="Paiements sans commission" highlight />
                    <FeatureRow text="Support prioritaire 24/7" highlight />
                    <FeatureRow text="14 jours d'essai gratuit" highlight />
                  </>
                )}
              </ul>
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
                          <span>{selectedPlan === 'paid' ? `Commencer l'essai gratuit` : 'Créer mon compte gratuit'}</span>
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