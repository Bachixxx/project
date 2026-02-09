import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Repeat, Clock, Dumbbell, Zap, Save, BookOpen } from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BlockLibraryModal } from './BlockLibraryModal';
import { BlockModal } from './BlockModal';

interface SessionExercise {
    id: string;
    exercise: {
        id: string;
        name: string;
        category: string;
        difficulty_level: string;
        track_weight: boolean;
        track_reps: boolean;
        track_duration: boolean;
        track_distance: boolean;
        track_calories: boolean;
    };
    sets: number;
    reps: number;
    weight: number;
    rest_time: number;
    order_index: number;
    instructions?: string;
    group_id?: string | null;
    duration_seconds?: number;
    distance_meters?: number;
    calories?: number;
}

export interface SessionBlock {
    id: string;
    type: 'regular' | 'circuit' | 'amrap' | 'interval';
    name: string;
    rounds?: number;
    duration_seconds?: number;
    order_index: number;
    exercises: SessionExercise[];
    is_template?: boolean;
}

interface BlockManagerProps {
    blocks: SessionBlock[];
    standaloneExercises: SessionExercise[]; // Legacy support or "Unsorted"
    onBlocksChange: (blocks: SessionBlock[]) => void;
    onStandaloneExercisesChange: (exercises: SessionExercise[]) => void;
    onShowExercisePicker: (blockId: string | null) => void; // null for standalone/new block
}

// --- Sortable Item Wrapper ---
function SortableBlock({ block, children, onRemove, onEdit, onAddExercise, onSaveTemplate }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id, data: { type: 'Block', block } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'circuit': return <Repeat className="w-4 h-4" />;
            case 'amrap': return <Zap className="w-4 h-4" />;
            case 'interval': return <Clock className="w-4 h-4" />;
            default: return <Dumbbell className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'circuit': return 'Circuit';
            case 'amrap': return 'AMRAP';
            case 'interval': return 'Intervalle';
            default: return 'Standard';
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
        <div ref={setNodeRef} style={style} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <div className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-2 uppercase tracking-wider ${getTypeColor(block.type)}`}>
                        {getTypeIcon(block.type)}
                        {getTypeLabel(block.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{block.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            {block.type === 'circuit' && (
                                <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {block.rounds} tours</span>
                            )}
                            {(block.type === 'amrap' || block.type === 'interval') && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {block.duration_seconds ? Math.floor(block.duration_seconds / 60) + ' min' : 'Durée libre'}</span>
                            )}
                            <span>{block.exercises.length} exercices</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onSaveTemplate} className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Enregistrer comme modèle">
                        <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => onAddExercise(block.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Ajouter un exercice">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(block)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Modifier">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onRemove(block.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-4 space-y-2">
                {children}
            </div>
        </div>
    );
}

// --- Main Manager Component ---
export function BlockManager({
    blocks,
    standaloneExercises,
    onBlocksChange,
    onStandaloneExercisesChange,
    onShowExercisePicker,
}: BlockManagerProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingBlock, setEditingBlock] = useState<SessionBlock | null>(null);
    const [editingExercise, setEditingExercise] = useState<{ exercise: SessionExercise, blockId: string | null } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const { user } = useAuth();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
            }
        }

        setActiveId(null);
    };

    const handleCreateBlock = (blockData: any) => {
        const newBlock: SessionBlock = {
            id: `block-${Date.now()}`,
            name: blockData.name,
            type: blockData.type,
            rounds: blockData.rounds || 1,
            duration_seconds: blockData.duration_seconds || 0,
            order_index: blocks.length,
            exercises: [],
        };
        onBlocksChange([...blocks, newBlock]);
        setShowCreateModal(false);
    };

    const handleImportBlock = (template: SessionBlock) => {
        const newBlock: SessionBlock = {
            ...template,
            id: `block-${Date.now()}`,
            order_index: blocks.length,
            is_template: false,
            exercises: template.exercises.map(ex => ({
                ...ex,
                id: `ex-${Date.now()}-${Math.random()}`,
                group_id: `block-${Date.now()}`
            }))
        };
        onBlocksChange([...blocks, newBlock]);
        setShowLibraryModal(false);
    };

    const handleSaveTemplate = async (block: SessionBlock) => {
        if (!user) return;
        if (!window.confirm(`Voulez-vous enregistrer le bloc "${block.name}" comme modèle ?`)) return;

        try {
            const { data: groupData, error: groupError } = await supabase
                .from('exercise_groups')
                .insert([{
                    name: block.name,
                    type: block.type,
                    repetitions: block.rounds,
                    duration_seconds: block.duration_seconds,
                    is_template: true,
                    coach_id: user.id,
                    session_id: null
                }])
                .select()
                .single();

            if (groupError) throw groupError;

            if (block.exercises.length > 0) {
                const exercisesPayload = block.exercises.map((ex, idx) => ({
                    group_id: groupData.id,
                    exercise_id: ex.exercise.id,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    rest_time: ex.rest_time,
                    order_index: idx,
                    calories: ex.calories // Added missing field
                }));

                const { error: exError } = await supabase
                    .from('session_exercises')
                    .insert(exercisesPayload);

                if (exError) throw exError;
            }

            alert('Modèle enregistré avec succès !');
        } catch (err: any) {
            console.error('Error saving template:', err);
            alert(`Erreur lors de l'enregistrement du modèle: ${err.message || 'Erreur inconnue'}`);
        }
    };

    const handleUpdateBlock = (blockData: any) => {
        if (!editingBlock) return;
        const updatedBlocks = blocks.map(b => b.id === editingBlock.id ? { ...b, ...blockData } : b);
        onBlocksChange(updatedBlocks);
        setEditingBlock(null);
    };

    const handleDeleteBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block && block.exercises.length > 0) {
            const freedExercises = block.exercises.map(ex => ({ ...ex, group_id: null }));
            onStandaloneExercisesChange([...standaloneExercises, ...freedExercises]);
        }
        onBlocksChange(blocks.filter(b => b.id !== blockId));
    };

    const handleUpdateExercise = (updatedExercise: SessionExercise) => {
        if (!editingExercise) return;

        if (editingExercise.blockId) {
            // Update inside a block
            const updatedBlocks = blocks.map(b => {
                if (b.id === editingExercise.blockId) {
                    return {
                        ...b,
                        exercises: b.exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
                    };
                }
                return b;
            });
            onBlocksChange(updatedBlocks);
        } else {
            // Update standalone
            const updatedStandalone = standaloneExercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex);
            onStandaloneExercisesChange(updatedStandalone);
        }
        setEditingExercise(null);
    };

    const handleDeleteExercise = (exerciseId: string, blockId: string | null) => {
        if (blockId) {
            const updatedBlocks = blocks.map(b => {
                if (b.id === blockId) {
                    return {
                        ...b,
                        exercises: b.exercises.filter(ex => ex.id !== exerciseId)
                    };
                }
                return b;
            });
            onBlocksChange(updatedBlocks);
        } else {
            const updatedStandalone = standaloneExercises.filter(ex => ex.id !== exerciseId);
            onStandaloneExercisesChange(updatedStandalone);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-semibold text-white">Contenu de la séance</h3>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => onShowExercisePicker(null)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium border border-white/10 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Exercice
                    </button>
                    <button
                        onClick={() => setShowLibraryModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-500/20 text-sm"
                    >
                        <BookOpen className="w-4 h-4" />
                        Bibliothèque
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Bloc
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. Blocks Section */}
                {blocks.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {blocks.map((block) => (
                                    <div key={block.id} className="relative group">
                                        <SortableBlock
                                            block={block}
                                            onRemove={handleDeleteBlock}
                                            onEdit={setEditingBlock}
                                            onAddExercise={onShowExercisePicker}
                                            onSaveTemplate={() => handleSaveTemplate(block)}
                                        >
                                            {block.exercises.length === 0 ? (
                                                <div className="text-center py-6 border border-dashed border-white/10 rounded-lg text-gray-500 text-xs">
                                                    Aucun exercice dans ce bloc
                                                </div>
                                            ) : (
                                                block.exercises.map((ex, idx) => (
                                                    <div key={ex.id || idx} className="p-3 bg-black/20 rounded-lg flex justify-between items-center text-sm text-gray-300 border border-white/5 group/ex">
                                                        <div className="flex items-center gap-3">
                                                            {/* TODO: Drag Handle for exercises */}
                                                            <span>{ex.exercise.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>{ex.sets} x {ex.reps}</span>
                                                                {ex.weight > 0 && <span>• {ex.weight}kg</span>}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover/ex:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setEditingExercise({ exercise: ex, blockId: block.id })}
                                                                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                {/* Using existing delete flow but reusing handler for consistency if we wanted */}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </SortableBlock>
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <div className="p-4 bg-gray-800 border border-white/20 rounded-xl shadow-2xl opacity-80 cursor-grabbing">
                                    <h3 className="font-bold text-white text-lg">Déplacement...</h3>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {/* 2. Standalone Exercises Section */}
                {standaloneExercises.length > 0 && (
                    <div className="space-y-3">
                        {blocks.length > 0 && <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Exercices libres</h4>}
                        {standaloneExercises.map((ex, idx) => (
                            <div key={ex.id || idx} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">{ex.exercise.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                            <span>{ex.sets} séries</span>
                                            <span>•</span>
                                            <span>{ex.reps} reps</span>
                                            {ex.weight > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{ex.weight} kg</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingExercise({ exercise: ex, blockId: null })}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteExercise(ex.id, null)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {blocks.length === 0 && standaloneExercises.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                        <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">La séance est vide</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                            Commencez par ajouter un bloc pour structurer votre séance ou ajoutez simplement des exercices.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => onShowExercisePicker(null)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Ajouter un exercice
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Ajouter un bloc
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(showCreateModal || editingBlock) && (
                <BlockModal
                    block={editingBlock}
                    onClose={() => { setShowCreateModal(false); setEditingBlock(null); }}
                    onSave={editingBlock ? handleUpdateBlock : handleCreateBlock}
                />
            )}

            {showLibraryModal && (
                <BlockLibraryModal
                    onClose={() => setShowLibraryModal(false)}
                    onSelect={handleImportBlock}
                />
            )}

            {editingExercise && (
                <ExerciseEditModal
                    exercise={editingExercise.exercise}
                    onClose={() => setEditingExercise(null)}
                    onSave={handleUpdateExercise}
                />
            )}
        </div>
    );
}



function ExerciseEditModal({ exercise, onClose, onSave }: { exercise: SessionExercise, onClose: () => void, onSave: (ex: SessionExercise) => void }) {
    const [sets, setSets] = useState(exercise.sets);
    const [reps, setReps] = useState(exercise.reps);
    const [weight, setWeight] = useState(exercise.weight || 0);
    const [restTime, setRestTime] = useState(exercise.rest_time || 60);
    const [durationSeconds, setDurationSeconds] = useState(exercise.duration_seconds || 0);
    const [distanceMeters, setDistanceMeters] = useState(exercise.distance_meters || 0);
    const [calories, setCalories] = useState(exercise.calories || 0);
    const [instructions, setInstructions] = useState(exercise.instructions || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...exercise,
            sets,
            reps,
            weight,
            rest_time: restTime,
            duration_seconds: durationSeconds,
            distance_meters: distanceMeters,
            calories,
            instructions
        });
    };

    return (
        <ResponsiveModal isOpen={true} onClose={onClose} title={`Modifier ${exercise.exercise.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Séries</label>
                        <input
                            type="number"
                            min="1"
                            value={sets}
                            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Répétitions</label>
                        <input
                            type="number"
                            min="0"
                            value={reps}
                            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Poids (kg)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Repos (sec)</label>
                        <input
                            type="number"
                            min="0"
                            step="5"
                            value={restTime}
                            onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Durée (sec)</label>
                        <input
                            type="number"
                            min="0"
                            value={durationSeconds}
                            onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Distance (m)</label>
                        <input
                            type="number"
                            min="0"
                            value={distanceMeters}
                            onChange={(e) => setDistanceMeters(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
                        <input
                            type="number"
                            min="0"
                            value={calories}
                            onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                            className="input-field"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="input-field min-h-[80px]"
                        placeholder="Instructions particulières..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="primary-button">Valider</button>
                </div>
            </form>
        </ResponsiveModal>
    );
}
