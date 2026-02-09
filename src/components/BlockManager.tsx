import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Repeat, Clock, Dumbbell, Zap, Save, Link, Unlink } from 'lucide-react';
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
import { ExerciseEditModal } from './ExerciseEditModal';
import { SortableExercise } from './SortableExercise';
import { useDroppable } from '@dnd-kit/core';

export interface SessionExercise {
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
    superset_id?: string | null;
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
function SortableBlock({ block, children, onRemove, onEdit, onAddExercise, onSaveTemplate, onExplode, isDraggingOverlay }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id, data: { type: 'Block', block } });

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: block.id,
        data: { type: 'Container', block }
    });

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
                    {/* Explode Button */}
                    <button onClick={onExplode} className="p-2 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Dégrouper (vers exercices libres)">
                        <Unlink className="w-4 h-4" />
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
            {/* Exercises Container - Droppable */}
            <div ref={setDroppableRef} className="p-4 space-y-2 min-h-[60px]">
                <SortableContext items={block.exercises.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>
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
    const { setNodeRef: setStandaloneRef } = useDroppable({
        id: 'standalone-container',
        data: { type: 'Container', id: 'standalone-container' }
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const findContainer = (id: string, currentBlocks: SessionBlock[], currentStandalone: SessionExercise[]) => {
        if (id === 'standalone-container') return 'standalone-container';
        if (currentBlocks.find(b => b.id === id)) return id; // It's a block

        // Find which block contains the exercise
        const block = currentBlocks.find(b => b.exercises.find(e => e.id === id));
        if (block) return block.id;

        // Check standalone
        if (currentStandalone.find(e => e.id === id)) return 'standalone-container';

        return null;
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over || !active) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // Only handle Exercise drag here (Block drag is simple reorder in DragEnd)
        if (activeType !== 'Exercise') return;

        const activeId = active.id;
        const overId = over.id;

        // Find containers
        const activeContainer = findContainer(activeId, blocks, standaloneExercises);
        const overContainer = findContainer(overId, blocks, standaloneExercises);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Moving between containers
        // Scenario 1: Block -> Standalone
        if (activeContainer !== 'standalone-container' && overContainer === 'standalone-container') {
            const sourceBlock = blocks.find(b => b.id === activeContainer);
            const exercise = sourceBlock?.exercises.find(e => e.id === activeId);

            if (sourceBlock && exercise) {
                const newExercise = { ...exercise, group_id: null, superset_id: null }; // Reset links when moving to standalone? Or keep? Reset for now to avoid complexity

                const newBlocks = blocks.map(b =>
                    b.id === activeContainer
                        ? { ...b, exercises: b.exercises.filter(e => e.id !== activeId) }
                        : b
                );
                onBlocksChange(newBlocks);
                onStandaloneExercisesChange([...standaloneExercises, newExercise]);
            }
        }
        // Scenario 2: Standalone -> Block
        else if (activeContainer === 'standalone-container' && overContainer !== 'standalone-container') {
            const exercise = standaloneExercises.find(e => e.id === activeId);
            if (exercise) {
                const newExercise = { ...exercise, group_id: overContainer };

                const newBlocks = blocks.map(b =>
                    b.id === overContainer
                        ? { ...b, exercises: [...b.exercises, newExercise] }
                        : b
                );
                onBlocksChange(newBlocks);
                onStandaloneExercisesChange(standaloneExercises.filter(e => e.id !== activeId));
            }
        }
        // Scenario 3: Block -> Block
        else if (activeContainer !== 'standalone-container' && overContainer !== 'standalone-container') {
            const sourceBlock = blocks.find(b => b.id === activeContainer);
            const exercise = sourceBlock?.exercises.find(e => e.id === activeId);

            if (sourceBlock && exercise) {
                const newExercise = { ...exercise, group_id: overContainer, superset_id: null };

                const newBlocks = blocks.map(b => {
                    if (b.id === activeContainer) {
                        return { ...b, exercises: b.exercises.filter(e => e.id !== activeId) };
                    }
                    if (b.id === overContainer) {
                        return { ...b, exercises: [...b.exercises, newExercise] };
                    }
                    return b;
                });
                onBlocksChange(newBlocks);
            }
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        const activeType = active.data.current?.type;

        setActiveId(null);

        if (!over) return;

        if (activeType === 'Block') {
            if (active.id !== over.id) {
                const oldIndex = blocks.findIndex((b) => b.id === active.id);
                const newIndex = blocks.findIndex((b) => b.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
                }
            }
        } else if (activeType === 'Exercise') {
            const activeContainer = findContainer(active.id, blocks, standaloneExercises);
            const overContainer = findContainer(over.id, blocks, standaloneExercises);

            if (activeContainer && overContainer && activeContainer === overContainer) {
                // Reorder within same container
                if (activeContainer === 'standalone-container') {
                    const oldIndex = standaloneExercises.findIndex(e => e.id === active.id);
                    const newIndex = standaloneExercises.findIndex(e => e.id === over.id);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        onStandaloneExercisesChange(arrayMove(standaloneExercises, oldIndex, newIndex));
                    }
                } else {
                    // Inside a block
                    const blockIndex = blocks.findIndex(b => b.id === activeContainer);
                    if (blockIndex !== -1) {
                        const block = blocks[blockIndex];
                        const oldIndex = block.exercises.findIndex(e => e.id === active.id);
                        const newIndex = block.exercises.findIndex(e => e.id === over.id);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            const newExercises = arrayMove(block.exercises, oldIndex, newIndex);
                            const newBlocks = [...blocks];
                            newBlocks[blockIndex] = { ...block, exercises: newExercises };
                            onBlocksChange(newBlocks);
                        }
                    }
                }
            }
        }
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
        // Ask confirmation? No, direct delete as per previous logic.
        // But if we delete, we lose exercises unless we use "Explode"
        onBlocksChange(blocks.filter(b => b.id !== blockId));
    };

    const handleExplodeBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block && block.exercises.length > 0) {
            const freedExercises = block.exercises.map(ex => ({
                ...ex,
                group_id: null
                // We keep superset_id to allow linking in standalone! 
            }));
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

    const handleUnlinkExercises = (blockId: string | null, index: number) => {
        let exercises: SessionExercise[];

        if (blockId) {
            const block = blocks.find(b => b.id === blockId);
            if (!block) return;
            exercises = [...block.exercises];
        } else {
            exercises = [...standaloneExercises];
        }

        const currentEx = exercises[index];
        const nextEx = exercises[index + 1];

        const isLinkedToPrev = index > 0 && exercises[index - 1].superset_id === currentEx.superset_id;

        if (nextEx) {
            const isNextLinkedToFollowing = exercises[index + 2] && exercises[index + 2].superset_id === nextEx.superset_id;
            if (isNextLinkedToFollowing) {
                const newId = `superset-${Date.now()}-split`;
                for (let i = index + 1; i < exercises.length; i++) {
                    if (exercises[i].superset_id === nextEx.superset_id) {
                        exercises[i] = { ...exercises[i], superset_id: newId };
                    } else { break; }
                }
            } else {
                exercises[index + 1] = { ...nextEx, superset_id: null };
            }
        }

        if (!isLinkedToPrev) {
            exercises[index] = { ...currentEx, superset_id: null, rest_time: 60 };
        }

        if (blockId) {
            const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, exercises } : b);
            onBlocksChange(updatedBlocks);
        } else {
            onStandaloneExercisesChange(exercises);
        }
    };

    const handleLinkExercises = (blockId: string | null, index: number) => {
        let exercises: SessionExercise[];

        if (blockId) {
            const block = blocks.find(b => b.id === blockId);
            if (!block) return;
            exercises = [...block.exercises];
        } else {
            exercises = [...standaloneExercises];
        }

        const currentEx = exercises[index];
        const nextEx = exercises[index + 1];

        if (currentEx && nextEx) {
            const newSupersetId = currentEx.superset_id || `superset-${Date.now()}`;
            exercises[index] = { ...currentEx, superset_id: newSupersetId, rest_time: 0 };
            exercises[index + 1] = { ...nextEx, superset_id: newSupersetId };

            if (blockId) {
                const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, exercises } : b);
                onBlocksChange(updatedBlocks);
            } else {
                onStandaloneExercisesChange(exercises);
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            {(blocks.length > 0 || standaloneExercises.length > 0) && (
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Structure de la séance</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLibraryModal(true)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border border-white/10"
                        >
                            <Dumbbell className="w-4 h-4" />
                            Bibliothèque
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un bloc
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {(blocks.length > 0 || standaloneExercises.length > 0) ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        {/* 1. Blocks Section */}
                        {blocks.length > 0 && (
                            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-4">
                                    {blocks.map((block) => (
                                        <SortableBlock
                                            key={block.id}
                                            block={block}
                                            onRemove={handleDeleteBlock}
                                            onEdit={setEditingBlock}
                                            onAddExercise={onShowExercisePicker}
                                            onSaveTemplate={() => handleSaveTemplate(block)}
                                            onExplode={() => handleExplodeBlock(block.id)}
                                        >
                                            {block.exercises.length === 0 ? (
                                                <div className="text-center py-6 border border-dashed border-white/10 rounded-lg text-gray-500 text-xs text-white">
                                                    Aucun exercice (Glissez-en ici)
                                                </div>
                                            ) : (
                                                block.exercises.map((ex, idx) => {
                                                    const nextExercise = block.exercises[idx + 1];
                                                    const prevExercise = block.exercises[idx - 1];
                                                    const isLinkedToNext = nextExercise && ex.superset_id && nextExercise.superset_id === ex.superset_id;
                                                    const isLinkedToPrev = prevExercise && ex.superset_id && prevExercise.superset_id === ex.superset_id;

                                                    return (
                                                        <SortableExercise
                                                            key={ex.id}
                                                            exercise={ex}
                                                            isLinkedToNext={isLinkedToNext}
                                                            isLinkedToPrev={isLinkedToPrev}
                                                            onLink={() => handleLinkExercises(block.id, idx)}
                                                            onUnlink={() => handleUnlinkExercises(block.id, idx)}
                                                            onChange={(updated) => {
                                                                const newExs = [...block.exercises];
                                                                newExs[idx] = updated;
                                                                const newBlocks = blocks.map(b => b.id === block.id ? { ...b, exercises: newExs } : b);
                                                                onBlocksChange(newBlocks);
                                                            }}
                                                            onRemove={() => handleDeleteExercise(ex.id, block.id)}
                                                        />
                                                    );
                                                })
                                            )}
                                        </SortableBlock>
                                    ))}
                                </div>
                            </SortableContext>
                        )}

                        {/* 2. Standalone Exercises Section */}
                        <div ref={setStandaloneRef} className={`transition-colors rounded-xl ${blocks.length > 0 ? 'mt-8 p-4 bg-white/5 border border-white/10 min-h-[100px]' : ''}`}>
                            {(blocks.length > 0) && (
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Exercices libres</h4>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>
                            )}

                            <SortableContext items={standaloneExercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                {standaloneExercises.length === 0 && blocks.length > 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
                                        Glissez des exercices ici pour les rendre libres
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {standaloneExercises.map((ex, idx) => {
                                            const nextExercise = standaloneExercises[idx + 1];
                                            const prevExercise = standaloneExercises[idx - 1];
                                            const isLinkedToNext = nextExercise && ex.superset_id && nextExercise.superset_id === ex.superset_id;
                                            const isLinkedToPrev = prevExercise && ex.superset_id && prevExercise.superset_id === ex.superset_id;

                                            return (
                                                <SortableExercise
                                                    key={ex.id}
                                                    exercise={ex}
                                                    isLinkedToNext={isLinkedToNext}
                                                    isLinkedToPrev={isLinkedToPrev}
                                                    onLink={() => handleLinkExercises(null, idx)}
                                                    onUnlink={() => handleUnlinkExercises(null, idx)}
                                                    onChange={(updated) => {
                                                        const newExs = [...standaloneExercises];
                                                        newExs[idx] = updated;
                                                        onStandaloneExercisesChange(newExs);
                                                    }}
                                                    onRemove={() => handleDeleteExercise(ex.id, null)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </SortableContext>
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <div className="p-4 bg-gray-800 border border-white/20 rounded-xl shadow-2xl opacity-80 cursor-grabbing">
                                    <h3 className="font-bold text-white text-lg">Déplacement...</h3>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    /* Empty State - Only if truly empty */
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
                            <button
                                onClick={() => setShowLibraryModal(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium border border-white/10"
                            >
                                Importer depuis la bibliothèque
                            </button>
                        </div>
                    </div>
                )}
            </div>
    {/* Modals */ }
{
    (showCreateModal || editingBlock) && (
        <BlockModal
            block={editingBlock}
            onClose={() => { setShowCreateModal(false); setEditingBlock(null); }}
            onSave={editingBlock ? handleUpdateBlock : handleCreateBlock}
        />
    )
}

{
    showLibraryModal && (
        <BlockLibraryModal
            onClose={() => setShowLibraryModal(false)}
            onSelect={handleImportBlock}
        />
    )
}

{
    editingExercise && (
        <ExerciseEditModal
            exercise={editingExercise.exercise}
            onClose={() => setEditingExercise(null)}
            onSave={handleUpdateExercise}
        />
    )
}
        </div >
    );
}




