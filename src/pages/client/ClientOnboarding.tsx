import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Removed useAuth since we use useClientAuth
import { useClientAuth } from '../../contexts/ClientAuthContext'; // Updated import
import { supabase } from '../../lib/supabase';
import { ChevronRight, Check, Activity, Target, FileText, User, ChevronLeft } from 'lucide-react';

export default function ClientOnboarding() {
    const { client, refreshClient } = useClientAuth(); // Using client from context
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        gender: '',
        date_of_birth: '',
        height: '',
        weight: '',
        fitness_goals: [] as string[],
        activity_level: '',
        medical_conditions: [] as string[],
        parq_q1: false,
        parq_q2: false,
        parq_q3: false,
        confirmed_legal: false
    });

    const totalSteps = 5;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        window.scrollTo(0, 0);
        setStep(prev => Math.min(prev + 1, totalSteps));
    };

    const handleBack = () => {
        window.scrollTo(0, 0);
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Update client profile using the client ID from context or auth
            if (!client?.id) throw new Error("Client ID not found");

            const { error } = await supabase
                .from('clients')
                .update({
                    gender: formData.gender,
                    date_of_birth: formData.date_of_birth,
                    height: parseFloat(formData.height),
                    weight: parseFloat(formData.weight),
                    fitness_goals: formData.fitness_goals,
                    medical_conditions: formData.medical_conditions,
                    onboarding_completed: true,
                    // You might want to save activity_level and parq answers if you have columns for them
                    // otherwise check schema
                })
                .eq('id', client.id);

            if (error) throw error;

            await refreshClient();
            navigate('/client/dashboard');
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (field: 'fitness_goals' | 'medical_conditions', value: string) => {
        setFormData(prev => {
            const current = prev[field];
            const exists = current.includes(value);
            return {
                ...prev,
                [field]: exists
                    ? current.filter(item => item !== value)
                    : [...current, value]
            };
        });
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center py-10 px-4">
            {/* Progress Bar */}
            <div className="w-full max-w-2xl mb-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Étape {step} sur {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="w-full max-w-2xl bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 animate-fade-in shadow-xl">

                {/* Step 1: Welcome & Profile */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Bienvenue, {client?.full_name?.split(' ')[0]} !</h1>
                            <p className="text-gray-400 mt-2">Commençons par apprendre à vous connaître.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Date de naissance</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Homme', 'Femme', 'Autre'].map(g => {
                                        const value = g === 'Homme' ? 'male' : g === 'Femme' ? 'female' : 'other';
                                        return (
                                            <button
                                                key={g}
                                                onClick={() => updateFormData('gender', value)}
                                                className={`p-3 rounded-xl border transition-all ${formData.gender === value
                                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={!formData.date_of_birth || !formData.gender}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Body Metrics */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Vos mensurations</h2>
                            <p className="text-gray-400 mt-2">Ces données nous aident à personnaliser votre programme.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Taille (cm)</label>
                                <input
                                    type="number"
                                    placeholder="ex: 175"
                                    value={formData.height}
                                    onChange={(e) => updateFormData('height', e.target.value)}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Poids (kg)</label>
                                <input
                                    type="number"
                                    placeholder="ex: 70"
                                    value={formData.weight}
                                    onChange={(e) => updateFormData('weight', e.target.value)}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-between">
                            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">Retour</button>
                            <button
                                onClick={handleNext}
                                disabled={!formData.height || !formData.weight}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                Suivant <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Goals */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Vos Objectifs</h2>
                            <p className="text-gray-400 mt-2">Qu'est-ce qui vous motive ?</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                'Perte de poids', 'Prise de masse', 'Endurance',
                                'Flexibilité', 'Santé générale', 'Compétition'
                            ].map(goal => (
                                <div
                                    key={goal}
                                    onClick={() => toggleSelection('fitness_goals', goal)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.fitness_goals.includes(goal)
                                        ? 'bg-purple-600/20 border-purple-500 text-white'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                                        }`}
                                >
                                    <span className="font-medium">{goal}</span>
                                    {formData.fitness_goals.includes(goal) && <Check className="w-5 h-5 text-purple-400" />}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Niveau d'activité actuel</label>
                            <select
                                value={formData.activity_level}
                                onChange={(e) => updateFormData('activity_level', e.target.value)}
                                className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500"
                            >
                                <option value="" className="bg-[#1e293b]">Sélectionnez...</option>
                                <option value="sedentary" className="bg-[#1e293b]">Sédentaire (Peu ou pas d'exercice)</option>
                                <option value="light" className="bg-[#1e293b]">Léger (Exercice 1-3 jours/semaine)</option>
                                <option value="moderate" className="bg-[#1e293b]">Modéré (Exercice 3-5 jours/semaine)</option>
                                <option value="active" className="bg-[#1e293b]">Actif (Exercice 6-7 jours/semaine)</option>
                                <option value="very_active" className="bg-[#1e293b]">Très actif (Exercice physique intense)</option>
                            </select>
                        </div>

                        <div className="pt-6 flex justify-between">
                            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">Retour</button>
                            <button
                                onClick={handleNext}
                                disabled={formData.fitness_goals.length === 0 || !formData.activity_level}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                Suivant <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Health & Legal */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Santé & Juridique</h2>
                            <p className="text-gray-400 mt-2">Dernière étape avant de commencer.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300">Conditions médicales (si applicable)</label>
                            <div className="flex flex-wrap gap-2">
                                {['Asthme', 'Diabète', 'Hypertension', 'Blessure articulaire', 'Problème cardiaque', 'Aucune'].map(cond => (
                                    <button
                                        key={cond}
                                        onClick={() => toggleSelection('medical_conditions', cond)}
                                        className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.medical_conditions.includes(cond)
                                            ? 'bg-red-600/20 border-red-500 text-red-300'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                                            }`}
                                    >
                                        {cond}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 space-y-3 mt-6">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="confirm_legal"
                                    checked={formData.confirmed_legal}
                                    onChange={(e) => updateFormData('confirmed_legal', e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="confirm_legal" className="text-sm text-gray-300">
                                    Je certifie que les informations fournies sont exactes et j'accepte les <a href="#" className="text-blue-400 hover:underline">Conditions Générales d'Utilisation</a> et la <a href="#" className="text-blue-400 hover:underline">Politique de Confidentialité</a>. Je comprends que l'exercice physique comporte des risques.
                                </label>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-between">
                            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">Retour</button>
                            <button
                                onClick={handleNext}
                                disabled={!formData.confirmed_legal}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                Suivant <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Completion & Welcome */}
                {step === 5 && (
                    <div className="space-y-8 animate-fade-in py-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                                Bienvenue sur Coachency ! 🚀
                            </h1>
                            <p className="text-gray-300 text-lg">
                                Félicitations, votre profil est configuré ! Voici comment votre nouvel espace va vous aider à atteindre vos objectifs :
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Activity className="w-6 h-6" /> {/* Placeholder for Calendar if not imported */}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Agenda Dynamique</h3>
                                    <p className="text-sm text-gray-400">Visualisez vos prochaines séances et rendez-vous d'un coup d'œil.</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Vos Programmes</h3>
                                    <p className="text-sm text-gray-400">Accédez à vos entraînements personnalisés et suivez vos performances.</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Suivi de Progression</h3>
                                    <p className="text-sm text-gray-400">Gardez un œil sur votre évolution grâce à des graphiques clairs.</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Lien Direct</h3>
                                    <p className="text-sm text-gray-400">Restez connecté avec votre coach pour ajuster votre parcours.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full btn-primary py-4 text-lg shadow-lg shadow-blue-500/25 mt-8 hover:scale-[1.02] transition-transform"
                        >
                            {loading ? 'Finalisation...' : 'Commencer mon entraînement'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
