import React, { useState } from 'react';
import { X, Plus, Save, Dumbbell, GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseSelector } from '../library/ExerciseSelector';
import { supabase } from '../../lib/supabase';
import { useWorkoutBuilder, BuilderExercise, WorkoutSet } from '../../hooks/useWorkoutBuilder';

// --- Types ---
// Imported from hook

interface WorkoutBuilderDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workoutData: any) => Promise<void>;
    initialDate: Date;
    clientId: string;
}

// --- Sortable Exercise Item Component ---
function SortableExerciseItem({
    exercise,
    onRemove,
    onUpdateSet,
    onAddSet,
    onRemoveSet
}: {
    exercise: BuilderExercise;
    onRemove: () => void;
    onUpdateSet: (setId: string, field: string, value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setId: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: exercise.id });

    const style = {
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className={`bg-[#1e293b] rounded-xl border border-white/5 p-4 mb-4 group ${isDragging ? 'shadow-2xl ring-2 ring-blue-500/50 opacity-90' : ''}`}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-white transition-colors">
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-white">{exercise.name}</h3>
                </div>
                <button onClick={onRemove} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Sets Grid Header */}
            <div className="grid grid-cols-[24px_1fr_1fr_1fr_24px] gap-2 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                <div>#</div>
                <div>Reps</div>
                <div>Charge (kg)</div>
                <div>RPE / Note</div>
                <div></div>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                    <div key={set.id} className="grid grid-cols-[24px_1fr_1fr_1fr_24px] gap-2 items-center">
                        <div className="text-gray-500 text-xs font-bold text-center">{index + 1}</div>
                        <input
                            type="text"
                            value={set.reps}
                            onChange={(e) => onUpdateSet(set.id, 'reps', e.target.value)}
                            className="bg-black/20 border border-white/5 rounded px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
                            placeholder="-"
                        />
                        <input
                            type="text"
                            value={set.weight}
                            onChange={(e) => onUpdateSet(set.id, 'weight', e.target.value)}
                            className="bg-black/20 border border-white/5 rounded px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
                            placeholder="-"
                        />
                        <input
                            type="text"
                            value={set.rpe || ''}
                            onChange={(e) => onUpdateSet(set.id, 'rpe', e.target.value)}
                            className="bg-black/20 border border-white/5 rounded px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
                            placeholder="-"
                        />
                        <button
                            onClick={() => onRemoveSet(set.id)}
                            className="text-gray-600 hover:text-red-400 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-3 flex justify-center">
                <button
                    onClick={onAddSet}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Ajouter une série
                </button>
            </div>
        </div>
    );
}

// --- Main Drawer Component ---
export function WorkoutBuilderDrawer({ isOpen, onClose, onSave, initialDate, clientId }: WorkoutBuilderDrawerProps) {
    // Hooks & State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Use Custom Hook for Logic
    const {
        exercises,
        addExercises,
        removeExercise,
        updateSet,
        addSet,
        removeSet,
        reorderExercises,
        reset
    } = useWorkoutBuilder();

    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderExercises(active.id as string, over.id as string);
        }
    };

    const handleOnSelectExercises = (selected: any[]) => {
        addExercises(selected);
        setShowExerciseSelector(false);
    };

    const handleSave = async () => {
        if (!title && exercises.length === 0) return;
        setIsSaving(true);
        try {
            // Construct the final object
            const workoutData = {
                title: title || 'Séance personnalisée',
                description,
                type: 'session',
                content: {
                    modules: exercises.map(ex => ({
                        exercise_id: ex.exercise_id && ex.exercise_id.length > 10 ? ex.exercise_id : null, // Ensure valid UUID or null
                        name: ex.name,
                        sets: ex.sets.map(s => ({
                            reps: s.reps,
                            weight: s.weight,
                            rpe: s.rpe
                        }))
                    }))
                }
            };
            await onSave(workoutData);
            handleClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setTitle('');
            setDescription('');
            reset();
        }, 300);
    };

    // Database access for Exercise Selector needs 'exercises' prop
    // We will cheat and use a separate fetcher in wrapper or just pass empty array if not loaded?
    // Actually, ExerciseSelector fetches its own data? No, it takes props. 
    // We need to fetch exercises here.
    const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
    const [loadingLib, setLoadingLib] = useState(false);

    const openSelector = async () => {
        setShowExerciseSelector(true);
        if (libraryExercises.length === 0) {
            setLoadingLib(true);
            const { data } = await supabase.from('exercises').select('*').order('name');
            if (data) setLibraryExercises(data);
            setLoadingLib(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={handleClose}
            />

            {/* Sliding Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-[#0b1121] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0b1121] z-10">
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre de la séance..."
                            className="bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none w-full"
                            autoFocus
                        />
                        <div className="text-sm text-gray-400 mt-1">
                            {initialDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSaving ? '...' : <><Save className="w-4 h-4" /> Enregistrer</>}
                        </button>
                        <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

                    {/* Description */}
                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notes ou description de la séance..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:border-blue-500/50 focus:outline-none focus:bg-white/10 resize-none h-20"
                        />
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={exercises.map(e => e.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {exercises.map((exercise) => (
                                    <SortableExerciseItem
                                        key={exercise.id}
                                        exercise={exercise}
                                        onRemove={() => removeExercise(exercise.id)}
                                        onUpdateSet={(setId, field, val) => updateSet(exercise.id, setId, field as any, val)}
                                        onAddSet={() => addSet(exercise.id)}
                                        onRemoveSet={(setId) => removeSet(exercise.id, setId)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Empty State / Add Button */}
                        {exercises.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl bg-white/5/50">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                    <Dumbbell className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-medium mb-1">Commencez votre séance</h3>
                                <p className="text-gray-500 text-sm mb-4">Ajoutez des exercices depuis la bibliothèque</p>
                                <button
                                    onClick={openSelector}
                                    className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors"
                                >
                                    + Ajouter un exercice
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={openSelector}
                                className="w-full py-4 border-2 border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-400 hover:text-blue-400 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Ajouter un exercice
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Exercise Selector Modal */}
            {showExerciseSelector && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/50">
                    {/* Reuse the existing selector but ensure it fits on top of the drawer or is nested */}
                    <ExerciseSelector
                        exercises={libraryExercises}
                        loading={loadingLib}
                        onClose={() => setShowExerciseSelector(false)}
                        onSelect={handleOnSelectExercises}
                        multiSelect={true}
                    />
                </div>
            )}
        </>
    );
}

