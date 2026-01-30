import React, { useState } from 'react';
import { X, Save, Scale, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useClientAuth } from '../../../contexts/ClientAuthContext';

interface AddBodyScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddBodyScanModal({ isOpen, onClose, onSuccess }: AddBodyScanModalProps) {
    const { client } = useClientAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        body_fat_percent: '',
        skeletal_muscle_mass: '',
        total_body_water_percent: '',
        bone_mass: '',
        visceral_fat_level: '',
        bmr: '',
        metabolic_age: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!client?.id) {
            setError("Erreur d'authentification");
            setLoading(false);
            return;
        }

        try {
            // Calculate derived values
            const weight = parseFloat(formData.weight);
            const height = parseFloat(formData.height);
            const bodyFatPercent = parseFloat(formData.body_fat_percent);
            const waterPercent = parseFloat(formData.total_body_water_percent);

            let bmi = null;
            if (weight && height) {
                const heightInMeters = height / 100;
                bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
            }

            let bodyFatMass = null;
            if (weight && bodyFatPercent) {
                bodyFatMass = parseFloat(((weight * bodyFatPercent) / 100).toFixed(2));
            }

            let totalBodyWater = null;
            if (weight && waterPercent) {
                totalBodyWater = parseFloat(((weight * waterPercent) / 100).toFixed(2));
            }

            const { error: insertError } = await supabase.from('body_scans').insert({
                client_id: client.id,
                date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
                weight: weight || null,
                height: height || null,
                bmi: bmi,
                body_fat_percent: bodyFatPercent || null,
                body_fat_mass: bodyFatMass,
                skeletal_muscle_mass: parseFloat(formData.skeletal_muscle_mass) || null,
                total_body_water_percent: waterPercent || null,
                total_body_water: totalBodyWater,
                bone_mass: parseFloat(formData.bone_mass) || null,
                visceral_fat_level: parseFloat(formData.visceral_fat_level) || null,
                bmr: parseInt(formData.bmr) || null,
                metabolic_age: parseInt(formData.metabolic_age) || null,
            });

            if (insertError) throw insertError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving scan:', err);
            setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Scale className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nouvelle pesée</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Poids (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="weight"
                                required
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="ex: 75.5"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Taille (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="ex: 180"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-yellow-500 uppercase">Graisse Corporelle (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="body_fat_percent"
                            value={formData.body_fat_percent}
                            onChange={handleChange}
                            placeholder="ex: 18.5"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-red-500 uppercase">Masse Musculaire (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="skeletal_muscle_mass"
                            value={formData.skeletal_muscle_mass}
                            onChange={handleChange}
                            placeholder="ex: 35.2"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-blue-400 uppercase">Eau (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="total_body_water_percent"
                                value={formData.total_body_water_percent}
                                onChange={handleChange}
                                placeholder="ex: 60"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-pink-500 uppercase">Os (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="bone_mass"
                                value={formData.bone_mass}
                                onChange={handleChange}
                                placeholder="ex: 3.5"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-purple-400 uppercase">Graisse Viscérale</label>
                            <input
                                type="number"
                                step="0.1"
                                name="visceral_fat_level"
                                value={formData.visceral_fat_level}
                                onChange={handleChange}
                                placeholder="ex: 4"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-orange-400 uppercase">BMR (kcal)</label>
                            <input
                                type="number"
                                step="1"
                                name="bmr"
                                value={formData.bmr}
                                onChange={handleChange}
                                placeholder="ex: 1750"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-400 uppercase">Âge Métabolique</label>
                            <input
                                type="number"
                                step="1"
                                name="metabolic_age"
                                value={formData.metabolic_age}
                                onChange={handleChange}
                                placeholder="ex: 25"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Enregistrement...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
