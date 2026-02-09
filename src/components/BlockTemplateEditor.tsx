import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus, Dumbbell, Clock, Zap, Repeat, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveModal } from './ResponsiveModal';
import { SessionBlock, SessionExercise } from './BlockManager';
import { ExerciseSelector } from './library/ExerciseSelector';
import { ExerciseEditModal } from './ExerciseEditModal';
import { SortableExercise } from './SortableExercise';

interface BlockTemplateEditorProps {
    template: SessionBlock | null;
    onClose: () => void;
    onSave: (templateData: SessionBlock) => void;
}

export function BlockTemplateEditor({ template, onClose, onSave }: BlockTemplateEditorProps) {
    const { user } = useAuth();
    // Block Metadata State
    const [name, setName] = useState(template?.name || '');
    const [type, setType] = useState<'regular' | 'circuit' | 'amrap' | 'interval'>(template?.type || 'regular');
    const [rounds, setRounds] = useState(template?.rounds || 3);
    const [durationMinutes, setDurationMinutes] = useState(template?.duration_seconds ? Math.floor(template.duration_seconds / 60) : 10);

    // Exercises State
    const [exercises, setExercises] = useState<SessionExercise[]>(template?.exercises || []);

    // Library Exercises State
    const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);

    // UI State
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [editingExercise, setEditingExercise] = useState<SessionExercise | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (showExercisePicker && libraryExercises.length === 0) {
            fetchLibraryExercises();
        }
    }, [showExercisePicker]);

    const fetchLibraryExercises = async () => {
        try {
            setLoadingLibrary(true);
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .or(`coach_id.eq.${user?.id},coach_id.is.null`)
                .order('name');

            if (error) throw error;
            setLibraryExercises(data || []);
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            setLoadingLibrary(false);
        }
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setExercises((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }

        setActiveId(null);
    };

    const handleAddExercises = (selectedExercises: any[]) => {
        const formatExercises: SessionExercise[] = selectedExercises.map(ex => ({
            id: `ex-${Date.now()}-${Math.random()}`,
            exercise: ex,
            sets: 3,
            reps: 10,
            weight: 0,
            rest_time: 60,
            order_index: exercises.length,
            group_id: template?.id || null
        }));
        setExercises([...exercises, ...formatExercises]);
        setShowExercisePicker(false);
    };

    const handleUpdateExercise = (updatedEx: SessionExercise) => {
        setExercises(exercises.map(ex => ex.id === updatedEx.id ? updatedEx : ex));
        setEditingExercise(null);
    };

    const handleRemoveExercise = (exId: string) => {
        setExercises(exercises.filter(ex => ex.id !== exId));
    };

    const handleSave = () => {
        const blockData: SessionBlock = {
            id: template?.id || '', // Empty ID means new
            name: name || (type === 'circuit' ? 'Circuit' : type === 'amrap' ? 'AMRAP' : type === 'interval' ? 'Intervalle' : 'Bloc Standard'),
            type,
            rounds: type === 'circuit' ? rounds : 1,
            duration_seconds: (type === 'amrap' || type === 'interval') ? durationMinutes * 60 : undefined,
            order_index: 0,
            exercises: exercises.map((ex, idx) => ({ ...ex, order_index: idx })),
            is_template: true
        };
        onSave(blockData);
    };

    const types = [
        { id: 'regular', label: 'Standard', icon: Dumbbell, color: 'emerald' },
        { id: 'interval', label: 'Intervalle', icon: Clock, color: 'blue' },
        { id: 'amrap', label: 'AMRAP', icon: Zap, color: 'orange' },
        { id: 'circuit', label: 'Circuit', icon: Repeat, color: 'purple' },
    ];

    return (
        <ResponsiveModal
            isOpen={true}
            onClose={onClose}
            title={template ? "Modifier le modèle" : "Créer un modèle"}
            maxWidth="max-w-4xl" // Wider modal for inline editing
        >
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Block Metadata */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nom du bloc</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom personnalisé..."
                            className="input-field"
                        />
                    </div>

                    <div className="col-span-2 grid grid-cols-4 gap-2">
                        {types.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as any)}
                                className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${type === t.id
                                    ? `border-${t.color}-500 bg-${t.color}-500/10 text-white`
                                    : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <t.icon className="w-4 h-4" />
                                <span className="text-xs font-medium">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {type === 'circuit' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tours</label>
                            <input
                                type="number"
                                min="1"
                                value={rounds}
                                onChange={(e) => setRounds(parseInt(e.target.value))}
                                className="input-field"
                            />
                        </div>
                    )}

                    {(type === 'amrap' || type === 'interval') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Durée (min)</label>
                            <input
                                type="number"
                                min="1"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                className="input-field"
                            />
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-white">Exercices ({exercises.length})</h4>
                        <button
                            onClick={() => setShowExercisePicker(true)}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Ajouter
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {exercises.map((ex) => (
                                    <SortableExercise
                                        key={ex.id}
                                        exercise={ex}
                                        onChange={handleUpdateExercise}
                                        onRemove={handleRemoveExercise}
                                    />
                                ))}
                                {exercises.length === 0 && (
                                    <div className="text-center py-8 border border-dashed border-white/10 rounded-lg text-gray-500 text-sm">
                                        Aucun exercice ajouté
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <div className="p-3 bg-gray-800 border border-white/20 rounded-lg shadow-xl opacity-80">
                                    Déplacement...
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button onClick={handleSave} className="primary-button flex items-center gap-2">
                        <Save className="w-4 h-4" /> Enregistrer le modèle
                    </button>
                </div>
            </div>

            {showExercisePicker && (
                <ExerciseSelector
                    exercises={libraryExercises}
                    onClose={() => setShowExercisePicker(false)}
                    onSelect={handleAddExercises}
                    loading={loadingLibrary}
                    multiSelect={true}
                />
            )}

            {editingExercise && (
                <ExerciseEditModal
                    exercise={editingExercise}
                    onClose={() => setEditingExercise(null)}
                    onSave={handleUpdateExercise}
                />
            )}
        </ResponsiveModal>
    );
}
