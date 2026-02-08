import React, { useState, useEffect } from 'react';
import { Search, Dumbbell, Clock, Repeat, Zap, Plus, Loader, Trash2 } from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SessionBlock } from './BlockManager';

interface BlockLibraryModalProps {
    onClose: () => void;
    onSelect: (block: SessionBlock) => void;
}

export function BlockLibraryModal({ onClose, onSelect }: BlockLibraryModalProps) {
    const [templates, setTemplates] = useState<SessionBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch templates (blocks with is_template=true)
            const { data, error } = await supabase
                .from('exercise_groups')
                .select(`
          *,
          exercises:session_exercises (
            *,
            exercise:exercises (*)
          )
        `)
                .eq('is_template', true)
                .or(`coach_id.eq.${user?.id},coach_id.is.null`) // Own templates + System templates (if any)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform to SessionBlock format
            const formattedTemplates: SessionBlock[] = (data || []).map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                rounds: t.repetitions,
                duration_seconds: t.duration_seconds,
                order_index: 0,
                exercises: t.exercises?.map((e: any) => ({
                    ...e,
                    exercise: e.exercise
                })) || [],
                is_template: true
            }));

            setTemplates(formattedTemplates);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Impossible de charger les modèles.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation();
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

        try {
            const { error } = await supabase
                .from('exercise_groups')
                .delete()
                .eq('id', templateId);

            if (error) throw error;
            setTemplates(templates.filter(t => t.id !== templateId));
        } catch (err) {
            console.error('Error deleting template:', err);
            setError('Impossible de supprimer le modèle.');
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'circuit': return <Repeat className="w-4 h-4" />;
            case 'amrap': return <Zap className="w-4 h-4" />;
            case 'interval': return <Clock className="w-4 h-4" />;
            default: return <Dumbbell className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'circuit': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'amrap': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'interval': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        }
    };

    return (
        <ResponsiveModal
            isOpen={true}
            onClose={onClose}
            title="Bibliothèque de blocs"
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col h-[60vh]">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher un modèle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10 w-full"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className="group bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-2 uppercase tracking-wider ${getTypeColor(template.type)}`}>
                                            {getTypeIcon(template.type)}
                                            {template.type}
                                        </div>
                                        <h3 className="font-bold text-white text-lg">{template.name}</h3>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteTemplate(e, template.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Supprimer le modèle"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 pl-1">
                                    {template.exercises.slice(0, 3).map((ex, idx) => (
                                        <div key={idx} className="flex items-center text-sm text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2"></span>
                                            <span className="flex-1">{ex.exercise.name}</span>
                                            <span className="text-gray-600 text-xs">{ex.sets}x{ex.reps}</span>
                                        </div>
                                    ))}
                                    {template.exercises.length > 3 && (
                                        <div className="text-xs text-gray-500 pl-4">
                                            + {template.exercises.length - 3} autres exercices
                                        </div>
                                    )}
                                    {template.exercises.length === 0 && (
                                        <div className="text-xs text-gray-500 italic">Vide</div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Aucun modèle trouvé.</p>
                            <p className="text-gray-600 text-sm mt-2">Enregistrez vos blocs comme modèles pour les retrouver ici.</p>
                        </div>
                    )}
                </div>
            </div>
        </ResponsiveModal>
    );
}
