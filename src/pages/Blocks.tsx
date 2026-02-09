import React, { useState, useEffect } from 'react';
import { Search, Dumbbell, Clock, Repeat, Zap, Plus, Loader, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SessionBlock } from '../components/BlockManager';
import { BlockModal } from '../components/BlockModal';

export default function Blocks() {
    const [templates, setTemplates] = useState<SessionBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SessionBlock | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchTemplates();
        }
    }, [user]);

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
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc modèle ? Cela n\'affectera pas les séances existantes.')) return;

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

    const handleSaveBlock = async (blockData: any) => {
        try {
            if (editingTemplate) {
                // Update existing template
                const { error } = await supabase
                    .from('exercise_groups')
                    .update({
                        name: blockData.name,
                        type: blockData.type,
                        repetitions: blockData.rounds,
                        duration_seconds: blockData.duration_seconds
                    })
                    .eq('id', editingTemplate.id);

                if (error) throw error;
            } else {
                // Create new template
                const { error } = await supabase
                    .from('exercise_groups')
                    .insert([{
                        name: blockData.name,
                        type: blockData.type,
                        repetitions: blockData.rounds,
                        duration_seconds: blockData.duration_seconds,
                        is_template: true,
                        coach_id: user?.id,
                        session_id: null
                    }])
                    .select()
                    .single();

                if (error) throw error;
            }

            fetchTemplates();
            setIsModalOpen(false);
            setEditingTemplate(null);
        } catch (err: any) {
            console.error('Error saving template:', err);
            setError('Erreur lors de la sauvegarde du modèle.');
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
        <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Blocs</h1>
                    <p className="text-gray-400">
                        Gérez vos modèles de blocs pour construire vos séances plus rapidement.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setIsModalOpen(true);
                    }}
                    className="primary-button flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Créer un bloc
                </button>
            </div>

            {/* Search */}
            <div className="glass-card p-4 relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Rechercher un bloc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-full"
                />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => {
                                setEditingTemplate(template);
                                setIsModalOpen(true);
                            }}
                            className="group bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl p-6 cursor-pointer transition-all duration-200 flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-2 uppercase tracking-wider ${getTypeColor(template.type)}`}>
                                    {getTypeIcon(template.type)}
                                    {template.type}
                                </div>
                                <button
                                    onClick={(e) => handleDeleteTemplate(e, template.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Supprimer le modèle"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="font-bold text-white text-xl mb-2">{template.name}</h3>

                            <div className="flex-1 space-y-2 mb-4 bg-black/20 rounded-lg p-3">
                                {template.exercises.slice(0, 5).map((ex, idx) => (
                                    <div key={idx} className="flex items-center text-sm text-gray-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2 flex-shrink-0"></span>
                                        <span className="flex-1 truncate">{ex.exercise.name}</span>
                                        <span className="text-gray-600 text-xs flex-shrink-0 ml-2">{ex.sets}x{ex.reps}</span>
                                    </div>
                                ))}
                                {template.exercises.length > 5 && (
                                    <div className="text-xs text-gray-500 pl-4 pt-1 border-t border-white/5 mt-2">
                                        + {template.exercises.length - 5} autres exercices
                                    </div>
                                )}
                                {template.exercises.length === 0 && (
                                    <div className="text-xs text-gray-500 italic text-center py-2">Aucun exercice</div>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {template.duration_seconds ? Math.floor(template.duration_seconds / 60) + ' min' : (template.type === 'circuit' ? `${template.rounds} tours` : '-')}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex items-center gap-1">
                                    Modifier <Edit2 className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                        <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Aucun bloc modèle trouvé</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                            Créez des blocs modèles pour les réutiliser dans vos séances.
                        </p>
                        <button
                            onClick={() => {
                                setEditingTemplate(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            Créer mon premier bloc
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <BlockModal
                    block={editingTemplate}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTemplate(null);
                    }}
                    onSave={handleSaveBlock}
                />
            )}
        </div>
    );
}
