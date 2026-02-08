import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveModal } from './ResponsiveModal';

// Simplified Create/Edit Modals placeholders if we don't want to extract EVERYTHING yet.
// For now, let's assume we just want SELECTION. Creation can be added later or kept simple.
// To fully extract, we might need to move CreateSessionModal too, but let's start with Selector.

interface SessionSelectorProps {
    onSelect: (session: any) => void;
    onClose: () => void;
    selectedSessions?: any[]; // optional, to filter out already selected
    title?: string;
    showCreateOption?: boolean;
}

export function SessionSelector({ onSelect, onClose, selectedSessions = [], title = "Sélectionner une séance", showCreateOption = true }: SessionSelectorProps) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sessions')
                .select('id, name, description, duration_minutes, difficulty_level')
                .eq('coach_id', user?.id)
                .order('name');

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const difficulties = [...new Set(sessions.map((s: any) => s.difficulty_level))];

    const filteredSessions = sessions.filter((session: any) => {
        const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = !selectedDifficulty || session.difficulty_level === selectedDifficulty;
        // Optional: filter out already selected sessions if passed
        const isNotSelected = !selectedSessions.some((s: any) => s.session?.id === session.id || s.id === session.id);
        return matchesSearch && matchesDifficulty && isNotSelected;
    });

    return (
        <ResponsiveModal
            isOpen={true}
            onClose={onClose}
            title={title}
        >
            {showCreateOption && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            // Navigation to create session page or Modal?
                            // For now, let's just alert or handle simple creation if needed.
                            // Or better: redirect to /sessions/new ?
                            // Simplest for this refactor: just hide it or keep it limited.
                            // Let's hide it for MultiClient context for now to keep it simple, 
                            // OR implementing a simple callback if provided.
                            alert("Pour créer une nouvelle séance, allez dans la rubrique 'Bibliothèque -> Séances'");
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-medium transition-colors touch-target"
                    >
                        <Plus className="w-5 h-5" />
                        Créer une nouvelle séance
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher des séances..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
                <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="input-field sm:w-48 appearance-none cursor-pointer"
                >
                    <option value="" className="bg-gray-800">Tous les niveaux</option>
                    {difficulties.map(difficulty => (
                        <option key={difficulty as string} value={difficulty as string} className="bg-gray-800">{difficulty as string}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Chargement...</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Aucune séance trouvée</div>
                ) : (
                    filteredSessions.map((session: any) => (
                        <div key={session.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/10 transition-colors">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-white">{session.name}</h4>
                                <p className="text-sm text-gray-400">{session.difficulty_level} • {session.duration_minutes} min</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onSelect(session)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium touch-target">
                                    Sélectionner
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ResponsiveModal>
    );
}
