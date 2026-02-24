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
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

    const slides = [
      {
        id: 1,
        title: "Le cœur de votre activité",
        icon: <Users className="w-8 h-8 text-blue-400" />,
        bgColor: "bg-blue-500/20",
        features: [
          { id: 1, icon: <Activity className="w-5 h-5 text-emerald-400" />, title: "Suivi Biométrique 360°", desc: "Poids, masse musculaire, hydratation et galerie photos avant/après." },
          { id: 2, icon: <Dumbbell className="w-5 h-5 text-indigo-400" />, title: "Bibliothèque d'Entraînement", desc: "Créez vos exercices personnalisés, vos blocs d'intensité (AMRAP, Circuits) et vos programmes." },
          { id: 3, icon: <Settings className="w-5 h-5 text-purple-400" />, title: "À votre Image", desc: "Application client personnalisée avec votre logo et un message de bienvenue unique." }
        ],
        mockups: {
          default: { type: 'mixed', label: 'Vue Globale' },
          1: { type: 'smartphone', label: 'Vue Biométrie Client' },
          2: { type: 'laptop', label: 'Créateur de Programme' },
          3: { type: 'smartphone', label: 'App Client Personnalisée' }
        }
      },
      {
        id: 2,
        title: "Sublimez vos séances privées",
        icon: <Dumbbell className="w-8 h-8 text-orange-400" />,
        bgColor: "bg-orange-500/20",
        features: [
          { id: 4, icon: <MonitorPlay className="w-5 h-5 text-red-400" />, title: "Live Workout", desc: "Prenez le contrôle ! Lancez la séance en direct, gérez les chronos et ajustez les charges à la volée." },
          { id: 5, icon: <CreditCard className="w-5 h-5 text-amber-400" />, title: "Terminal Tap-to-Pay", desc: "Encaissez vos clients immédiatement après la séance grâce au terminal intégré (Sans contact ou QR Code)." }
        ],
        mockups: {
          default: { type: 'smartphone', label: 'Outils Présentiel' },
          4: { type: 'smartphone', label: 'Flow Mode (Séance en direct)' },
          5: { type: 'smartphone', label: 'Terminal Tap-to-Pay' }
        }
      },
      {
        id: 3,
        title: "Simplifiez la gestion de vos groupes",
        icon: <Users className="w-8 h-8 text-emerald-400" />,
        bgColor: "bg-emerald-500/20",
        features: [
          { id: 6, icon: <CalendarDays className="w-5 h-5 text-teal-400" />, title: "Réservation Autonome", desc: "Planifiez vos cours, fixez une limite de places et laissez les clients s'inscrire et payer via leur app." },
          { id: 7, icon: <LayoutDashboard className="w-5 h-5 text-green-400" />, title: "Mode Multi-Coaching", desc: "Gardez un œil sur tout le monde. Affichez et gérez simultanément le programme de plusieurs clients en présentiel." }
        ],
        mockups: {
          default: { type: 'laptop', label: 'Outils de Groupe' },
          6: { type: 'smartphone', label: 'Réservation Client' },
          7: { type: 'laptop', label: 'Dashboard Multi-Coaching' }
        }
      },
      {
        id: 4,
        title: "Le suivi 5 étoiles, même à distance",
        icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
        bgColor: "bg-cyan-500/20",
        features: [
          { id: 8, icon: <CalendarDays className="w-5 h-5 text-blue-400" />, title: "Planning Interactif", desc: "Construisez l'agenda de vos clients d'un glissement de doigt (Drag & Drop) : Séances, repos, et prises de mesures." },
          { id: 9, icon: <CreditCard className="w-5 h-5 text-emerald-400" />, title: "Abonnements & Revenus", desc: "Sécurisez votre chiffre d'affaires. Créez des abonnements récurrents et suivez vos paiements sur votre Dashboard." }
        ],
        mockups: {
          default: { type: 'laptop', label: 'Outils Distanciel' },
          8: { type: 'laptop', label: 'Planning Client Interactif' },
          9: { type: 'laptop', label: 'Tableau de bord Revenus' }
        }
      }
    ];

    const currentSlideData = slides[slide - 1];

    // Determine which mockup to show
    const getActiveMockup = () => {
      let mockup: { type: string, label: string } | undefined;

      if (hoveredFeature !== null && currentSlideData.mockups[hoveredFeature as keyof typeof currentSlideData.mockups]) {
        mockup = currentSlideData.mockups[hoveredFeature as keyof typeof currentSlideData.mockups] as unknown as { type: string, label: string };
      } else {
        mockup = currentSlideData.mockups.default as unknown as { type: string, label: string };
      }

      return mockup || { type: 'smartphone', label: 'Aperçu' };
    };

    const activeMockup = getActiveMockup();

    return (
      <div className="animate-fade-in flex flex-col lg:flex-row h-full min-h-[600px] gap-8 xl:gap-16 items-center">

        {/* Left Side: Content */}
        <div className="flex-1 flex flex-col w-full h-full max-w-xl mx-auto lg:mx-0">
          {/* Carousel indicators */}
          <div className="flex justify-start gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`} />
            ))}
          </div>

          <div key={slide} className="animate-fade-in transition-all duration-300 ease-in-out flex-1 flex flex-col">
            <div className={`w-14 h-14 ${currentSlideData.bgColor} rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300`}>
              {currentSlideData.icon}
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8">
              {currentSlideData.title}
            </h2>

            <div className="grid gap-4 mb-8">
              {currentSlideData.features.map((feature) => (
                <div
                  key={feature.id}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`border p-5 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-default ${hoveredFeature === feature.id
                    ? 'bg-white/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02] -translate-y-1 z-10'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${hoveredFeature === feature.id ? 'bg-blue-500/20' : 'bg-black/20'
                    }`}>
                    {React.cloneElement(feature.icon as React.ReactElement, {
                      className: `w-6 h-6 transition-colors ${hoveredFeature === feature.id ? 'text-blue-400' : (feature.icon as React.ReactElement).props.className}`
                    })}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">{feature.title}</h4>
                    <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-auto pt-6">
            {slide > 1 && (
              <button
                onClick={() => setSlide(s => s - 1)}
                className="px-6 py-4 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center"
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
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] shadow-lg"
            >
              {slide === 4 ? "Configurer mon profil" : "Suivant"} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Visuals/Mockups (Hidden on small screens) */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative w-full h-[600px]">
          {/* Background glow that follows the active mockup */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[100px] opacity-40 transition-colors duration-700 pointer-events-none ${activeMockup.type === 'smartphone' ? 'bg-blue-500/40' :
            activeMockup.type === 'laptop' ? 'bg-cyan-500/40' : 'bg-indigo-500/40'
            }`} />

          <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
            {/* Dynamic Mockup Container */}
            <div
              key={`${slide}-${hoveredFeature || 'default'}`}
              className="animate-fade-in-up w-full h-full bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden group"
            >
              {/* This grid overlay subtlely mimics a screen reflection/texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none" />

              {activeMockup.type === 'smartphone' && (
                <div className="relative">
                  <div className="w-[280px] h-[580px] bg-slate-900 border-[8px] border-slate-700 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden relative">
                    {/* Dynamic content placeholder for smartphone */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                      <Smartphone className="w-16 h-16 text-blue-400/50 mb-4 animate-pulse" />
                      <h3 className="text-white font-bold text-xl mb-2">{activeMockup.label}</h3>
                      <p className="text-gray-500 text-sm">Image à intégrer</p>
                    </div>
                  </div>
                </div>
              )}

              {activeMockup.type === 'laptop' && (
                <div className="relative w-full">
                  <div className="w-full aspect-video bg-slate-900 border-[8px] border-slate-700 rounded-t-2xl shadow-2xl flex items-center justify-center overflow-hidden relative">
                    {/* Dynamic content placeholder for laptop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                      <Laptop className="w-20 h-20 text-cyan-400/50 mb-4 animate-pulse" />
                      <h3 className="text-white font-bold text-2xl mb-2">{activeMockup.label}</h3>
                      <p className="text-gray-500 text-sm">Image à intégrer</p>
                    </div>
                  </div>
                  <div className="w-[110%] -ml-[5%] h-5 bg-slate-600 rounded-b-xl shadow-xl relative flex justify-center">
                    <div className="w-20 h-2 bg-slate-500 rounded-b-lg absolute top-0" />
                  </div>
                </div>
              )}

              {activeMockup.type === 'mixed' && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-10 left-0 w-[90%] aspect-video bg-slate-900 border-[6px] border-slate-700 rounded-md shadow-2xl flex items-center justify-center z-10 opacity-90 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex flex-col items-center text-center">
                      <Laptop className="w-12 h-12 text-indigo-400/50 mb-2" />
                      <span className="text-white font-bold text-lg">Macbook</span>
                    </div>
                  </div>
                  <div className="absolute bottom-10 right-0 w-[160px] h-[340px] bg-slate-900 border-[6px] border-slate-700 rounded-[2rem] shadow-2xl flex items-center justify-center z-20 opacity-95 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <div className="flex flex-col items-center text-center">
                      <Smartphone className="w-10 h-10 text-emerald-400/50 mb-2" />
                      <span className="text-white font-bold text-sm">iPhone</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      <div className={`w-full relative z-10 transition-all duration-500 ease-in-out ${currentStep === 1 ? 'max-w-6xl' : 'max-w-xl'}`}>
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
