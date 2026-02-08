import React, { useState } from 'react';
import { Plus, X, Trash2, Edit2, GripVertical, Repeat, Clock, Dumbbell, Zap } from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
function SortableBlock({ block, children, onRemove, onEdit, onAddExercise }: any) {
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
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    const handleUpdateBlock = (blockData: any) => {
        if (!editingBlock) return;
        const updatedBlocks = blocks.map(b => b.id === editingBlock.id ? { ...b, ...blockData } : b);
        onBlocksChange(updatedBlocks);
        setEditingBlock(null);
    };

    const handleDeleteBlock = (blockId: string) => {
        // Move exercises to standalone? Or just delete?
        // Let's preserve exercises as standalone for now to be safe, like before.
        const block = blocks.find(b => b.id === blockId);
        if (block && block.exercises.length > 0) {
            const freedExercises = block.exercises.map(ex => ({ ...ex, group_id: null }));
            onStandaloneExercisesChange([...standaloneExercises, ...freedExercises]);
        }
        onBlocksChange(blocks.filter(b => b.id !== blockId));
    };

    // Exercise Management Helpers (passed down to Block Inner)
    // For now, simpler implementation: verify drag/drop of exercises LATER if needed.
    // We start with Block Reordering and CRUD.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Structure de la séance</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter un bloc
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {blocks.map((block) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                onRemove={handleDeleteBlock}
                                onEdit={setEditingBlock}
                                onAddExercise={onShowExercisePicker}
                            >
                                {block.exercises.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-lg text-gray-500 text-sm">
                                        Glissez des exercices ici ou cliquez sur +
                                    </div>
                                ) : (
                                    block.exercises.map((ex, idx) => (
                                        <div key={ex.id || idx} className="p-3 bg-black/20 rounded-lg flex justify-between items-center text-sm text-gray-300">
                                            <span>{ex.exercise.name}</span>
                                            <span className="text-xs text-gray-500">{ex.sets} x {ex.reps}</span>
                                        </div>
                                    ))
                                )}
                            </SortableBlock>
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

            {/* Modals */}
            {(showCreateModal || editingBlock) && (
                <BlockModal
                    block={editingBlock}
                    onClose={() => { setShowCreateModal(false); setEditingBlock(null); }}
                    onSave={editingBlock ? handleUpdateBlock : handleCreateBlock}
                />
            )}
        </div>
    );
}

// --- Block Creation/Edit Modal ---
function BlockModal({ block, onClose, onSave }: any) {
    const [type, setType] = useState<'regular' | 'circuit' | 'amrap' | 'interval'>(block?.type || 'regular');
    const [name, setName] = useState(block?.name || '');
    const [rounds, setRounds] = useState(block?.rounds || 3);
    const [durationMinutes, setDurationMinutes] = useState(block?.duration_seconds ? block.duration_seconds / 60 : 10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name || (type === 'circuit' ? 'Circuit' : type === 'amrap' ? 'AMRAP' : type === 'interval' ? 'Intervalle' : 'Bloc Standard'),
            type,
            rounds: type === 'circuit' ? rounds : 1,
            duration_seconds: (type === 'amrap' || type === 'interval') ? durationMinutes * 60 : null,
        });
    };

    const types = [
        { id: 'regular', label: 'Standard', icon: Dumbbell, desc: 'Séries classiques, échauffement, retour au calme.', color: 'emerald' },
        { id: 'interval', label: 'Intervalle', icon: Clock, desc: 'Entraînement par intervalles (HIIT, Tabata).', color: 'blue' },
        { id: 'amrap', label: 'AMRAP', icon: Zap, desc: 'Autant de tours que possible dans un temps imparti.', color: 'orange' },
        { id: 'circuit', label: 'Circuit', icon: Repeat, desc: 'Enchaînement d’exercices sur plusieurs tours.', color: 'purple' },
    ];

    return (
        <ResponsiveModal isOpen={true} onClose={onClose} title={block ? "Modifier le bloc" : "Ajouter un bloc"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!block && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {types.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setType(t.id as any)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${type === t.id
                                    ? `border-${t.color}-500 bg-${t.color}-500/10`
                                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${type === t.id ? `bg-${t.color}-500 text-white` : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <t.icon className="w-5 h-5" />
                                </div>
                                <h4 className={`font-bold ${type === t.id ? 'text-white' : 'text-gray-300'}`}>{t.label}</h4>
                                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom du bloc</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={type === 'warmup' ? "Échauffement" : "Nom personnalisé..."}
                        className="input-field"
                    />
                </div>

                {type === 'circuit' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de tours</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={rounds}
                            onChange={(e) => setRounds(parseInt(e.target.value))}
                            className="input-field"
                        />
                    </div>
                )}

                {(type === 'amrap' || type === 'interval') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Durée (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                            className="input-field"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="primary-button">{block ? 'Sauvegarder' : 'Ajouter le bloc'}</button>
                </div>
            </form>
        </ResponsiveModal>
    );
}
