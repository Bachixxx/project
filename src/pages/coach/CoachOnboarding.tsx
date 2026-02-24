import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ChevronRight, ChevronLeft, Check, Sparkles,
  Users, Activity, CreditCard, Settings, Camera,
  Dumbbell, MonitorPlay, CalendarDays, Smartphone, Laptop, LayoutDashboard
} from 'lucide-react';
import { t } from '../../i18n';

// Components
import Loading from '../../components/Loading';

export default function CoachOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for forms
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    specialization: ''
  });

  const [preferences, setPreferences] = useState({
    currency: 'CHF',
    measurementSystem: 'metric'
  });

  useEffect(() => {
    // Load initial data if needed
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        specialization: user.user_metadata?.specialization || ''
      });
    }
  }, [user]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      // 1. Update Profile Information
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          specialization: profileData.specialization,
          currency: preferences.currency,
          measurement_system: preferences.measurementSystem
        }
      });

      if (profileError) throw profileError;

      // 2. Mark onboarding as completed
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Ensure local state/context might have time to catch up if needed
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // --- Step Components ---

  const Step1Discovery = () => {
    const [slide, setSlide] = useState(1);

    const slides = [
      {
        id: 1,
        title: "Le cœur de votre activité",
        icon: <Users className="w-8 h-8 text-blue-400" />,
        bgColor: "bg-blue-500/20",
        features: [
          { icon: <Activity className="w-5 h-5 text-emerald-400" />, title: "Suivi Biométrique 360°", desc: "Poids, masse musculaire, hydratation et galerie photos avant/après." },
          { icon: <Dumbbell className="w-5 h-5 text-indigo-400" />, title: "Bibliothèque d'Entraînement", desc: "Créez vos exercices personnalisés, vos blocs d'intensité (AMRAP, Circuits) et vos programmes." },
          { icon: <Settings className="w-5 h-5 text-purple-400" />, title: "À votre Image", desc: "Application client personnalisée avec votre logo et un message de bienvenue unique." }
        ],
        mockupType: "smartphone"
      },
      {
        id: 2,
        title: "Sublimez vos séances privées",
        icon: <Dumbbell className="w-8 h-8 text-orange-400" />,
        bgColor: "bg-orange-500/20",
        features: [
          { icon: <MonitorPlay className="w-5 h-5 text-red-400" />, title: "Live Workout", desc: "Prenez le contrôle ! Lancez la séance en direct, gérez les chronos et ajustez les charges à la volée." },
          { icon: <CreditCard className="w-5 h-5 text-amber-400" />, title: "Terminal Tap-to-Pay", desc: "Encaissez vos clients immédiatement après la séance grâce au terminal intégré (Sans contact ou QR Code)." }
        ],
        mockupType: "smartphone"
      },
      {
        id: 3,
        title: "Simplifiez la gestion de vos groupes",
        icon: <Users className="w-8 h-8 text-emerald-400" />,
        bgColor: "bg-emerald-500/20",
        features: [
          { icon: <CalendarDays className="w-5 h-5 text-teal-400" />, title: "Réservation Autonome", desc: "Planifiez vos cours, fixez une limite de places et laissez les clients s'inscrire et payer via leur app." },
          { icon: <LayoutDashboard className="w-5 h-5 text-green-400" />, title: "Mode Multi-Coaching", desc: "Gardez un œil sur tout le monde. Affichez et gérez simultanément le programme de plusieurs clients en présentiel." }
        ],
        mockupType: "laptop"
      },
      {
        id: 4,
        title: "Le suivi 5 étoiles, même à distance",
        icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
        bgColor: "bg-cyan-500/20",
        features: [
          { icon: <CalendarDays className="w-5 h-5 text-blue-400" />, title: "Planning Interactif", desc: "Construisez l'agenda de vos clients d'un glissement de doigt (Drag & Drop) : Séances, repos, et prises de mesures." },
          { icon: <CreditCard className="w-5 h-5 text-emerald-400" />, title: "Abonnements & Revenus", desc: "Sécurisez votre chiffre d'affaires. Créez des abonnements récurrents et suivez vos paiements sur votre Dashboard." }
        ],
        mockupType: "laptop"
      }
    ];

    const currentSlideData = slides[slide - 1];

    return (
      <div className="animate-fade-in text-center flex flex-col h-full min-h-[600px]">
        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <div key={slide} className="animate-fade-in transition-all duration-300 ease-in-out">
          <div className={`w-16 h-16 ${currentSlideData.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-300`}>
            {currentSlideData.icon}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 min-h-[80px] md:min-h-[40px] flex items-center justify-center">
            {currentSlideData.title}
          </h2>

          {/* Mockup Placeholder */}
          <div className="w-full relative bg-slate-800/50 rounded-2xl border border-white/5 mb-8 overflow-hidden flex items-center justify-center min-h-[220px]">
            {currentSlideData.mockupType === 'smartphone' ? (
              <div className="flex flex-col items-center opacity-50">
                <Smartphone className="w-16 h-16 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-400">Mockup Smartphone à venir</span>
                <span className="text-xs text-gray-500">(Insérer capture d'écran ici)</span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-50">
                <Laptop className="w-16 h-16 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-400">Mockup Ordinateur à venir</span>
                <span className="text-xs text-gray-500">(Insérer capture d'écran ici)</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 mb-8 text-left">
            {currentSlideData.features.map((feature, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm md:text-base">{feature.title}</h4>
                  <p className="text-xs md:text-sm text-gray-400 mt-1 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-auto">
          {slide > 1 && (
            <button
              onClick={() => setSlide(s => s - 1)}
              className="px-4 py-4 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              if (slide < 4) {
                setSlide(s => s + 1);
              } else {
                nextStep(); // Move to Step 2 (Profile)
              }
            }}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {slide === 4 ? "Configurer mon profil" : "Suivant"} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const Step2Profile = () => (
    <div className="animate-fade-in text-left">
      <h2 className="text-2xl font-bold text-white mb-2">Votre Profil</h2>
      <p className="text-gray-400 mb-8">Vérifiez et complétez vos informations de base.</p>

      <div className="space-y-6">
        {/* Profile Picture Placeholder - Non functional for simplicity in wizard, can be added later */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <Camera className="w-8 h-8" />
          </div>
          <span className="text-xs text-gray-500 mt-2">Ajouter une photo (optionnel)</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Nom complet</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Spécialité</label>
          <input
            type="text"
            value={profileData.specialization}
            onChange={(e) => setProfileData(p => ({ ...p, specialization: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
            placeholder="Ex: Préparateur Physique, Nutritionniste..."
          />
        </div>
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={prevStep}
          className="px-6 py-4 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={nextStep}
          disabled={!profileData.fullName}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  const Step3Preferences = () => (
    <div className="animate-fade-in text-left">
      <h2 className="text-2xl font-bold text-white mb-2">Préférences</h2>
      <p className="text-gray-400 mb-8">Configurez les paramètres par défaut de votre espace.</p>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Devise principale</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPreferences(p => ({ ...p, currency: 'CHF' }))}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${preferences.currency === 'CHF'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
            >
              <span className="text-2xl font-bold">CHF</span>
              <span className="text-sm">Franc Suisse</span>
            </button>
            <button
              onClick={() => setPreferences(p => ({ ...p, currency: 'EUR' }))}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${preferences.currency === 'EUR'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
            >
              <span className="text-2xl font-bold">€</span>
              <span className="text-sm">Euro</span>
            </button>
          </div>
        </div>

        <div className="pt-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Système de mesure</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPreferences(p => ({ ...p, measurementSystem: 'metric' }))}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${preferences.measurementSystem === 'metric'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
            >
              Métrique (kg, cm)
            </button>
            <button
              onClick={() => setPreferences(p => ({ ...p, measurementSystem: 'imperial' }))}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${preferences.measurementSystem === 'imperial'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
            >
              Impérial (lbs, in)
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={prevStep}
          className="px-6 py-4 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={nextStep}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  const Step4Payments = () => {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Encaissez vos clients</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Pour pouvoir vendre des programmes ou utiliser le Terminal Tap-to-Pay, vous devez lier un compte bancaire sécurisé via Stripe.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-10 text-left">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Pourquoi Stripe Connect ?
          </h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Reversement automatique sur votre compte bancaire.</li>
            <li>• Facturation professionnelle automatique pour vos clients.</li>
            <li>• Conformité fiscale simplifiée.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              // Future Implementation: Trigger Stripe Connect Onboarding
              alert("La configuration Stripe se fera depuis l'onglet 'Paiements' de votre tableau de bord !");
              handleComplete();
            }}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Configurer Stripe maintenant
          </button>

          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-full py-4 bg-white/5 text-gray-400 hover:text-white rounded-xl font-medium transition-colors"
          >
            {saving ? 'Finalisation...' : 'Plus tard, accéder au Dashboard'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        {/* Progress Tracker */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentStep >= step ? 'bg-blue-500 scale-110' : 'bg-white/20'
                    }`}
                />
                {step < 4 && (
                  <div
                    className={`w-4 h-0.5 mx-1 transition-all duration-300 ${currentStep > step ? 'bg-blue-500/50' : 'bg-white/10'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-slate-900/40">
          {currentStep === 1 && <Step1Discovery />}
          {currentStep === 2 && <Step2Profile />}
          {currentStep === 3 && <Step3Preferences />}
          {currentStep === 4 && <Step4Payments />}
        </div>
      </div>
    </div>
  );
}
