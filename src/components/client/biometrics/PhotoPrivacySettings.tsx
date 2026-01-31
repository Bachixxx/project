import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { PhotoConsentModal } from './PhotoConsentModal';

interface PhotoPrivacySettingsProps {
    clientId: string;
    onSettingsChange?: (enabled: boolean) => void;
}

export function PhotoPrivacySettings({ clientId, onSettingsChange }: PhotoPrivacySettingsProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
    const [consentDate, setConsentDate] = useState<string | null>(null);

    useEffect(() => {
        fetchPrivacySettings();
    }, [clientId]);

    const fetchPrivacySettings = async () => {
        if (!clientId) return;
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('photo_share_enabled, photo_share_consent_date')
                .eq('id', clientId)
                .single();

            if (data) {
                setIsEnabled(data.photo_share_enabled || false);
                setConsentDate(data.photo_share_consent_date);
            }
        } catch (error) {
            console.error("Error fetching privacy settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (isEnabled) {
            // Turning OFF - Confirm and disable immediately
            if (confirm("Êtes-vous sûr de vouloir désactiver le partage ? Votre coach ne verra plus vos photos.")) {
                updateSettings(false);
            }
        } else {
            // Turning ON - Requires Consent
            setIsConsentModalOpen(true);
        }
    };

    const updateSettings = async (enabled: boolean) => {
        setLoading(true);
        try {
            const updates: any = {
                photo_share_enabled: enabled,
            };

            if (enabled) {
                updates.photo_share_consent_date = new Date().toISOString();
            }

            const { error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId);

            if (error) throw error;

            setIsEnabled(enabled);
            if (enabled) setConsentDate(new Date().toISOString());
            if (onSettingsChange) onSettingsChange(enabled);

        } catch (error) {
            console.error("Error updating privacy settings", error);
            alert("Une erreur est survenue lors de la mise à jour des paramètres.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-10 w-40 bg-white/5 rounded-xl"></div>;

    return (
        <>
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`p-2 rounded-full ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                    {isEnabled ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                    <h3 className={`text-sm font-bold ${isEnabled ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {isEnabled ? 'Partage activé' : 'Partage désactivé (Privé)'}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {isEnabled
                            ? `Visible par votre coach (Accord du ${new Date(consentDate || '').toLocaleDateString()})`
                            : 'Vos photos sont visibles uniquement par vous.'}
                    </p>
                </div>

                <button
                    onClick={handleToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            <PhotoConsentModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                onConfirm={() => {
                    updateSettings(true);
                }}
            />
        </>
    );
}
