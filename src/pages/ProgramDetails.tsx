import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Clock, Activity, Target, Check, Users, Dumbbell, Star, Calendar, ShieldCheck, PlayCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { createCheckoutSession } from '../lib/stripe';
import { Loader2 } from 'lucide-react';

interface Program {
    id: string;
    name: string;
    description: string;
    duration_weeks: number;
    difficulty_level: string;
    price: number;
    coach: {
        id: string;
        full_name: string;
        specialization: string;
        profile_image_url?: string;
    };
    program_exercises: Array<{
        exercise: {
            category: string;
        };
    }>;
}

const difficultyLevels = {
    beginner: { label: 'Débutant', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    intermediate: { label: 'Intermédiaire', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    advanced: { label: 'Avancé', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

function ProgramDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { client } = useClientAuth();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProgramDetails();
        }
    }, [id]);

    const fetchProgramDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('programs')
                .select(`
          id,
          name,
          description,
          duration_weeks,
          difficulty_level,
          price,
          coach:coaches (
            id,
            full_name,
            specialization,
            profile_image_url
          ),
          program_exercises (
            exercise:exercises (
              category
            )
          )
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setProgram(data);
        } catch (error) {
            console.error('Error fetching program:', error);
            navigate('/marketplace');
        } finally {
            setLoading(false);
        }
    };

    const handleStartProgram = async () => {
        if (!program) return;

        if (!client) {
            navigate('/client/register', {
                state: {
                    returnTo: `/marketplace/program/${program.id}`
                }
            });
            return;
        }

        if (program.price && program.price > 0) {
            try {
                setProcessingPayment(true);
                await createCheckoutSession(program.id, client.id);
            } catch (error: any) {
                console.error('Error processing payment:', error);
                alert(`Erreur: ${error.message}`);
                setProcessingPayment(false);
            }
        } else {
            try {
                const { data: existingProgram } = await supabase
                    .from('client_programs')
                    .select('id')
                    .eq('client_id', client.id)
                    .eq('program_id', program.id)
                    .maybeSingle();

                if (existingProgram) {
                    navigate('/client/workouts');
                    return;
                }

                const { error } = await supabase
                    .from('client_programs')
                    .insert({
                        client_id: client.id,
                        program_id: program.id,
                        start_date: new Date().toISOString(),
                        status: 'active'
                    });

                if (error) throw error;

                navigate('/client/workouts');
            } catch (error) {
                console.error('Error adding program:', error);
                alert('Erreur lors de l\'ajout du programme.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!program) return null;

    const difficulty = difficultyLevels[program.difficulty_level as keyof typeof difficultyLevels] || difficultyLevels.beginner;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">

            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[128px]" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link
                        to="/marketplace"
                        className="flex items-center text-gray-400 hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors border border-white/5">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Retour au catalogue</span>
                    </Link>

                    <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
                        Coachency Marketplace
                    </div>
                </div>
            </nav>

            <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12 animate-fade-in">

                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${difficulty.bg} ${difficulty.color} ${difficulty.border} uppercase tracking-wider`}>
                                    {difficulty.label}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {program.duration_weeks} Semaines
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                                {program.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {program.coach.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Créé par</p>
                                        <p className="font-semibold text-white">{program.coach.full_name}</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div>
                                    <p className="text-blue-400 text-sm font-semibold">{program.coach.specialization}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="glass-card p-8 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                À propos du programme
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {program.description}
                            </p>
                        </div>

                        {/* What to expect Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="glass-card p-6 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">Objectifs ciblés</h4>
                                <p className="text-gray-400 text-sm">Conçu pour maximiser vos résultats, que ce soit pour la prise de masse, la perte de poids ou la performance.</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">Plan structuré</h4>
                                <p className="text-gray-400 text-sm">Un calendrier précis sur {program.duration_weeks} semaines avec une progression intelligente pour éviter la stagnation.</p>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Aperçu du contenu</h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((week) => (
                                    <div key={week} className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                                <PlayCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Semaine {week}</p>
                                                <p className="text-gray-500 text-sm">Focus : {week === 1 ? 'Fondations' : week === 2 ? 'Intensification' : 'Volume'}</p>
                                            </div>
                                        </div>
                                        <Lock className="w-4 h-4 text-gray-600" />
                                    </div>
                                ))}
                                <div className="text-center pt-2">
                                    <p className="text-sm text-gray-500 italic">+ {program.duration_weeks - 3} autres semaines de contenu</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar / CTA */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">

                            {/* Price Card */}
                            <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden animate-slide-in delay-100 bg-[#1e293b]/80 backdrop-blur-xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

                                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Prix total</p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-5xl font-bold text-white">{program.price > 0 ? program.price : 'Gratuit'}</span>
                                    {program.price > 0 && <span className="text-xl font-bold text-gray-400">CHF</span>}
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span>Accès immédiat au programme</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span>Suivi complet des progrès</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span>Support via l'application</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartProgram}
                                    disabled={processingPayment}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 group mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingPayment ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Commencer maintenant</span>
                                            <ChevronLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Paiement sécurisé via Stripe</span>
                                </div>
                            </div>

                            {/* Coach Mini Card */}
                            <div className="glass-card p-6 rounded-2xl border border-white/10">
                                <h4 className="text-white font-bold mb-4">Votre Coach</h4>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                                        {program.coach.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{program.coach.full_name}</p>
                                        <p className="text-blue-400 text-xs">{program.coach.specialization}</p>
                                    </div>
                                </div>
                                <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-colors border border-white/5">
                                    Voir le profil complet
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ProgramDetails;
