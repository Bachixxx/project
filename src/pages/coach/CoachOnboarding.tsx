import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ChevronRight, ChevronLeft, Check, Sparkles, 
  Users, Activity, CreditCard, Settings, Camera 
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

  const Step1Discovery = () => (
    <div className="animate-fade-in text-center">
      <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Bienvenue sur Coachency</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Votre nouvel outil tout-en-un pour développer votre activité de coaching. 
        Voici ce que vous allez pouvoir faire :
      </p>

      <div className="grid gap-4 mb-8 text-left">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Gérez vos clients centralisée</h4>
            <p className="text-sm text-gray-500">Suivi des objectifs, notes privées et statistiques.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Programmes d'entraînement interactifs</h4>
            <p className="text-sm text-gray-500">Créez des séances de A à Z avec vidéos et chronos.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Encaissements automatisés</h4>
            <p className="text-sm text-gray-500">Vendez vos offres via lien de paiement et terminal physique.</p>
          </div>
        </div>
      </div>

      <button
        onClick={nextStep}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        Configurer mon compte <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

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
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  preferences.currency === 'CHF' 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="text-2xl font-bold">CHF</span>
                <span className="text-sm">Franc Suisse</span>
              </button>
              <button
                onClick={() => setPreferences(p => ({ ...p, currency: 'EUR' }))}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  preferences.currency === 'EUR' 
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
                className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  preferences.measurementSystem === 'metric' 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                Métrique (kg, cm)
              </button>
              <button
                onClick={() => setPreferences(p => ({ ...p, measurementSystem: 'imperial' }))}
                className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  preferences.measurementSystem === 'imperial' 
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
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentStep >= step ? 'bg-blue-500 scale-110' : 'bg-white/20'
                  }`} 
                />
                {step < 4 && (
                  <div 
                    className={`w-4 h-0.5 mx-1 transition-all duration-300 ${
                      currentStep > step ? 'bg-blue-500/50' : 'bg-white/10'
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
