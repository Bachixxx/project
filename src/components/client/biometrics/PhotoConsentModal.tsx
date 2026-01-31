import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PhotoConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    clientName?: string;
}

export function PhotoConsentModal({ isOpen, onClose, onConfirm, clientName }: PhotoConsentModalProps) {
    const [signature, setSignature] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (signature.trim().toUpperCase() !== "J'ACCEPTE") {
            setError("Veuillez taper 'J'ACCEPTE' pour confirmer.");
            return;
        }

        setLoading(true);
        // Simulate delay or api call if needed internally, but actual logic happens in callback
        await new Promise(r => setTimeout(r, 500));
        onConfirm();
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                        Consentement de Partage
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-sm text-blue-200">
                        <p>
                            En activant le partage, vous autorisez votre coach à visualiser vos photos d'évolution.
                            Ces photos sont des données sensibles et seront traitées avec la plus stricte confidentialité.
                        </p>
                    </div>

                    <div className="space-y-4 text-sm text-gray-300">
                        <h3 className="font-bold text-white">CLAUSE DE CONFIDENTIALITÉ ET RESPONSABILITÉ</h3>
                        <p>
                            En signant ce formulaire, je reconnais que :
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>J'accepte volontairement de partager mes photos corporelles avec mon coach assigné sur la plateforme.</li>
                            <li>Ces photos ont pour unique but le suivi de mon évolution physique et l'ajustement de mon programme.</li>
                            <li>Mon coach est tenu au secret professionnel et s'engage à ne jamais diffuser ces images sans mon accord écrit séparé.</li>
                            <li>Je peux révoquer cet accès à tout moment via mes paramètres, ce qui masquera immédiatement les photos pour le coach.</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <label className="block text-sm font-medium text-gray-400">
                            Pour accepter, veuillez taper <span className="text-white font-bold select-all">J'ACCEPTE</span> ci-dessous :
                        </label>
                        <input
                            type="text"
                            value={signature}
                            onChange={(e) => {
                                setSignature(e.target.value);
                                setError(null);
                            }}
                            placeholder="J'ACCEPTE"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600 font-mono tracking-widest text-center uppercase"
                        />
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-white/5">
                    <button
                        onClick={handleConfirm}
                        disabled={loading || signature.trim().toUpperCase() !== "J'ACCEPTE"}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Validation...' : 'Je confirme et active le partage'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}
