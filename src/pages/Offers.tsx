import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check, X, CreditCard, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CoachPlan {
    id: string;
    name: string;
    amount: number;
    interval: 'month' | 'year';
    formatted_amount?: string;
    active: boolean;
}

function OffersPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<CoachPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        interval: 'month' as 'month' | 'year'
    });

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('coach_plans')
                .select('*')
                .eq('coach_id', user?.id)
                .eq('active', true) // Only show active plans
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const { data, error } = await supabase.functions.invoke('manage-plan', {
                body: {
                    action: 'create',
                    coachId: user?.id,
                    name: formData.name,
                    amount: parseFloat(formData.amount),
                    interval: formData.interval
                }
            });

            if (error) throw error;

            setIsModalOpen(false);
            setFormData({ name: '', amount: '', interval: 'month' });
            fetchPlans(); // Refresh list
        } catch (err: any) {
            console.error('Error creating plan:', err);
            setError(err.message || 'Une erreur est survenue lors de la création de l\'offre.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ? Elle ne sera plus disponible pour les nouveaux clients.')) return;

        try {
            const { error } = await supabase.functions.invoke('manage-plan', {
                body: {
                    action: 'delete',
                    planId: planId
                }
            });

            if (error) throw error;
            fetchPlans();
        } catch (err) {
            console.error('Error deleting plan:', err);
            alert('Impossible de supprimer l\'offre.');
        }
    };

    return (
        <div className="p-6 max-w-[2000px] mx-auto animate-fade-in min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-1 mb-2 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Retour
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Mes Offres</h1>
                    <p className="text-gray-400">Créez et gérez vos abonnements pour le Terminal.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Offre</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="glass-card p-6 relative group overflow-hidden hover:border-blue-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Supprimer l'offre"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                {plan.interval === 'month' ? 'Facturation mensuelle' : 'Facturation annuelle'}
                            </p>

                            <div className="flex items-baseline gap-1 mt-auto">
                                <span className="text-3xl font-bold text-white">{plan.amount}</span>
                                <span className="text-gray-500">CHF / {plan.interval === 'month' ? 'mois' : 'an'}</span>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-full py-20 text-center glass-card border-dashed border-gray-700">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Aucune offre active</h3>
                            <p className="text-gray-400 mb-6">Commencez par créer votre premier abonnement.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                                + Créer une offre
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Plan Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-[#1A1D24] text-white w-full max-w-md rounded-2xl shadow-2xl border border-white/10 p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Nouvelle Offre</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nom de l'offre</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Suivi Mensuel Premium"
                                    className="input-field w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prix (CHF)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="0.01"
                                        placeholder="100.00"
                                        className="input-field w-full pl-4 pr-12"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">CHF</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Fréquence</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interval: 'month' })}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.interval === 'month'
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4" /> Mensuel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interval: 'year' })}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.interval === 'year'
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4" /> Annuel
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Création...
                                    </span>
                                ) : (
                                    'Créer l\'offre'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OffersPage;
