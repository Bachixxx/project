import React, { useState, useEffect } from 'react';
import { Search, X, Dumbbell, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Session {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
    difficulty_level: string;
    session_type: string;
}

interface SessionSelectorProps {
    onSelect: (session: Session) => void;
    onClose: () => void;
}

export function SessionSelector({ onSelect, onClose }: SessionSelectorProps) {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sessions')
                .select('id, name, description, duration_minutes, difficulty_level, session_type')
                .eq('coach_id', user?.id)
                .order('name');

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="glass-card w-full max-w-2xl flex flex-col max-h-[80vh] animate-slide-in relative">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/95 rounded-t-2xl sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white">Choisir une séance</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 bg-[#0f172a]">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher une séance..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-9 w-full"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        filteredSessions.length > 0 ? (
                            filteredSessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => onSelect(session)}
                                    className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                                            {session.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {session.duration_minutes} min
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded border ${session.difficulty_level === 'Débutant' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    session.difficulty_level === 'Intermédiaire' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {session.difficulty_level}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400" />
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
                                <Dumbbell className="w-10 h-10 opacity-50" />
                                <p>Aucune séance trouvée</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
