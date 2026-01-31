import React, { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';

interface TutorialCardProps {
    tutorialId: string;
    title: string;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

export function TutorialCard({ tutorialId, title, message, onDismiss, className = '' }: TutorialCardProps) {
    const { client, refreshClient } = useClientAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(false);

    // Don't render if already seen
    if (client?.tutorials_seen?.includes(tutorialId)) {
        return null;
    }

    if (!isVisible) return null;

    const handleDismiss = async () => {
        if (!client?.id) return;
        setLoading(true);

        try {
            const currentTutorials = (client.tutorials_seen as string[]) || [];
            const newTutorials = [...currentTutorials, tutorialId];

            const { error } = await supabase
                .from('clients')
                .update({ tutorials_seen: newTutorials })
                .eq('id', client.id);

            if (error) throw error;

            // Optimistic update locally
            setIsVisible(false);
            if (onDismiss) onDismiss();

            // Refresh context in background
            refreshClient();

        } catch (err) {
            console.error('Error dismissing tutorial:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 ${className} animate-fade-in`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 flex gap-4">
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Lightbulb className="w-6 h-6" />
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="text-[10px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Astuce</span>
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={handleDismiss}
                        disabled={loading}
                        className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                        {loading ? 'Masquage...' : 'J\'ai compris, ne plus afficher'}
                    </button>
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
