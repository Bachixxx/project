import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Scale, AlertCircle, ChevronDown, ChevronUp, Activity, Droplets, Bone, Dumbbell } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useClientAuth } from '../../../contexts/ClientAuthContext';
import { useQueryClient } from '@tanstack/react-query';


interface AddBodyScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const InputField = ({ label, name, placeholder, value, onChange, color = "blue", type = "number", step = "0.1", icon: Icon }: any) => (
    <div className="space-y-1.5">
        <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-${color}-400`}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </label>
        <input
            type={type}
            step={step}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700 text-lg font-medium"
        />
    </div>
);

export function AddBodyScanModal({ isOpen, onClose, onSuccess }: AddBodyScanModalProps) {
    const { client } = useClientAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'general' | 'composition' | 'segmental' | 'segmental_fat'>('general');

    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        bmi: '',
        body_fat_percent: '',
        skeletal_muscle_mass: '',
        total_body_water_percent: '',
        bone_mass: '',
        visceral_fat_level: '',
        bmr: '',
        metabolic_age: '',
        // Segmental Muscle
        segmental_muscle_right_arm: '',
        segmental_muscle_left_arm: '',
        segmental_muscle_trunk: '',
        segmental_muscle_right_leg: '',
        segmental_muscle_left_leg: '',
        // Segmental Fat
        segmental_fat_right_arm: '',
        segmental_fat_left_arm: '',
        segmental_fat_trunk: '',
        segmental_fat_right_leg: '',
        segmental_fat_left_leg: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate BMI
            if (name === 'weight' || name === 'height') {
                const w = parseFloat(name === 'weight' ? value : prev.weight);
                const h = parseFloat(name === 'height' ? value : prev.height);
                if (w && h) {
                    const heightInMeters = h / 100;
                    const bmi = (w / (heightInMeters * heightInMeters)).toFixed(2);
                    newData.bmi = bmi;
                }
            }
            return newData;
        });
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

            // Use manual BMI if provided, otherwise calculate
            let bmi = parseFloat(formData.bmi);
            if (!bmi && weight && height) {
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
                date: new Date().toISOString().split('T')[0],
                weight: weight || null,
                height: height || null,
                bmi: bmi || null,
                body_fat_percent: bodyFatPercent || null,
                body_fat_mass: bodyFatMass,
                skeletal_muscle_mass: parseFloat(formData.skeletal_muscle_mass) || null,
                total_body_water_percent: waterPercent || null,
                total_body_water: totalBodyWater,
                bone_mass: parseFloat(formData.bone_mass) || null,
                visceral_fat_level: parseFloat(formData.visceral_fat_level) || null,
                bmr: parseInt(formData.bmr) || null,
                metabolic_age: parseInt(formData.metabolic_age) || null,
                // Segmental
                segmental_muscle_right_arm: parseFloat(formData.segmental_muscle_right_arm) || null,
                segmental_muscle_left_arm: parseFloat(formData.segmental_muscle_left_arm) || null,
                segmental_muscle_trunk: parseFloat(formData.segmental_muscle_trunk) || null,
                segmental_muscle_right_leg: parseFloat(formData.segmental_muscle_right_leg) || null,
                segmental_muscle_left_leg: parseFloat(formData.segmental_muscle_left_leg) || null,
                segmental_fat_right_arm: parseFloat(formData.segmental_fat_right_arm) || null,
                segmental_fat_left_arm: parseFloat(formData.segmental_fat_left_arm) || null,
                segmental_fat_trunk: parseFloat(formData.segmental_fat_trunk) || null,
                segmental_fat_right_leg: parseFloat(formData.segmental_fat_right_leg) || null,
                segmental_fat_left_leg: parseFloat(formData.segmental_fat_left_leg) || null,
            });

            if (insertError) throw insertError;

            queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving scan:', err);
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };



    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090b]">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center z-20 safe-top">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Scale className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Nouvelle pesée</h2>
                        <p className="text-xs text-gray-400">Ajouter des mesures corporelles</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable Form Area */}
            <form id="scan-form" onSubmit={handleSubmit} className="w-full h-full pt-24 pb-32 overflow-y-auto px-6 space-y-8">

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Section 1: General */}
                <section>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Général
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField value={formData.weight} onChange={handleChange} label="Poids (kg)" name="weight" placeholder="0.0" color="blue" />
                        <InputField value={formData.height} onChange={handleChange} label="Taille (cm)" name="height" placeholder="0" color="gray" />
                        <div className="col-span-2">
                            <InputField value={formData.bmi} onChange={handleChange} label="IMC (Calculé)" name="bmi" placeholder="--" color="emerald" />
                        </div>
                    </div>
                </section>

                {/* Section 2: Composition */}
                <section>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Composition
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField value={formData.body_fat_percent} onChange={handleChange} label="Graisse (%)" name="body_fat_percent" placeholder="%" color="yellow" icon={Activity} />
                        <InputField value={formData.skeletal_muscle_mass} onChange={handleChange} label="Muscle (kg)" name="skeletal_muscle_mass" placeholder="kg" color="red" icon={Dumbbell} />
                        <InputField value={formData.total_body_water_percent} onChange={handleChange} label="Eau (%)" name="total_body_water_percent" placeholder="%" color="cyan" icon={Droplets} />
                        <InputField value={formData.bone_mass} onChange={handleChange} label="Os (kg)" name="bone_mass" placeholder="kg" color="pink" icon={Bone} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <InputField value={formData.visceral_fat_level} onChange={handleChange} label="G. Viscérale" name="visceral_fat_level" placeholder="Niveau" color="purple" icon={Activity} step="1" />
                        <InputField value={formData.bmr} onChange={handleChange} label="BMR (kcal)" name="bmr" placeholder="kcal" color="orange" icon={Activity} step="1" />
                    </div>
                </section>

                {/* Section 3: Segmental Muscle */}
                <section className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <button type="button" onClick={() => setActiveSection(activeSection === 'segmental' ? 'general' : 'segmental')} className="w-full flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                            Muscle Segmentaire
                        </h3>
                        {activeSection === 'segmental' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    {activeSection === 'segmental' && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in pb-4 border-b border-white/10 mb-4">
                            <div className="col-span-2 bg-black/20 p-3 rounded-xl border border-white/5 text-center mb-2">
                                <p className="text-xs text-gray-400 mb-2">Saisissez la masse musculaire en kg</p>
                            </div>
                            <InputField value={formData.segmental_muscle_left_arm} onChange={handleChange} label="Bras Gauche" name="segmental_muscle_left_arm" placeholder="kg" color="red" />
                            <InputField value={formData.segmental_muscle_right_arm} onChange={handleChange} label="Bras Droit" name="segmental_muscle_right_arm" placeholder="kg" color="red" />
                            <div className="col-span-2">
                                <InputField value={formData.segmental_muscle_trunk} onChange={handleChange} label="Tronc" name="segmental_muscle_trunk" placeholder="kg" color="red" />
                            </div>
                            <InputField value={formData.segmental_muscle_left_leg} onChange={handleChange} label="Jambe Gauche" name="segmental_muscle_left_leg" placeholder="kg" color="red" />
                            <InputField value={formData.segmental_muscle_right_leg} onChange={handleChange} label="Jambe Droite" name="segmental_muscle_right_leg" placeholder="kg" color="red" />
                        </div>
                    )}
                </section>

                {/* Section 4: Segmental Fat */}
                <section className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <button type="button" onClick={() => setActiveSection(activeSection === 'segmental_fat' ? 'general' : 'segmental_fat')} className="w-full flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                            Graisse Segmentaire
                        </h3>
                        {activeSection === 'segmental_fat' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    {activeSection === 'segmental_fat' && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in">
                            <div className="col-span-2 bg-black/20 p-3 rounded-xl border border-white/5 text-center mb-2">
                                <p className="text-xs text-gray-400 mb-2">Saisissez la masse graisseuse en kg</p>
                            </div>
                            <InputField value={formData.segmental_fat_left_arm} onChange={handleChange} label="Bras Gauche" name="segmental_fat_left_arm" placeholder="kg" color="yellow" />
                            <InputField value={formData.segmental_fat_right_arm} onChange={handleChange} label="Bras Droit" name="segmental_fat_right_arm" placeholder="kg" color="yellow" />
                            <div className="col-span-2">
                                <InputField value={formData.segmental_fat_trunk} onChange={handleChange} label="Tronc" name="segmental_fat_trunk" placeholder="kg" color="yellow" />
                            </div>
                            <InputField value={formData.segmental_fat_left_leg} onChange={handleChange} label="Jambe Gauche" name="segmental_fat_left_leg" placeholder="kg" color="yellow" />
                            <InputField value={formData.segmental_fat_right_leg} onChange={handleChange} label="Jambe Droite" name="segmental_fat_right_leg" placeholder="kg" color="yellow" />
                        </div>
                    )}
                </section>
            </form>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a] border-t border-white/10 p-6 safe-bottom z-20">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <div className="loading loading-spinner loading-sm" /> : <Save className="w-5 h-5" />}
                    Enregistrer la mesure
                </button>
            </div>
        </div>,
        document.body
    );
}
