import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Clock, Hash, Ruler, Weight } from 'lucide-react';
import { SessionExercise } from './BlockManager';

interface SortableExerciseProps {
    exercise: SessionExercise;
    onChange: (exercise: SessionExercise) => void;
    onRemove: (exerciseId: string) => void;
}

export function SortableExercise({ exercise, onChange, onRemove }: SortableExerciseProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: exercise.id, data: { type: 'Exercise', exercise } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Determine initial mode based on non-zero values
    const getInitialMode = () => {
        if (exercise.duration_seconds && exercise.duration_seconds > 0) return 'duration';
        if (exercise.distance_meters && exercise.distance_meters > 0) return 'distance';
        return 'reps';
    };

    const [mode, setMode] = useState<'reps' | 'duration' | 'distance'>(getInitialMode());

    const handleChange = (field: keyof SessionExercise, value: number) => {
        onChange({
            ...exercise,
            [field]: value
        });
    };

    return (
        <div ref={setNodeRef} style={style} className="p-3 bg-white/5 rounded-lg border border-white/5 group relative mb-2">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1">
                        <GripVertical className="w-4 h-4" />
                    </button>
                    <div className="font-medium text-white">{exercise.exercise.name}</div>
                </div>
                <button
                    onClick={() => onRemove(exercise.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Supprimer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
                {/* Type Selector */}
                <div className="col-span-3 sm:col-span-2">
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-blue-500 outline-none"
                    >
                        <option value="reps">Reps</option>
                        <option value="duration">Temps</option>
                        <option value="distance">Dist</option>
                    </select>
                </div>

                {/* Common: Sets */}
                <div className="col-span-2 relative">
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Séries</span>
                    <input
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) => handleChange('sets', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Mode Specific Inputs */}
                {mode === 'reps' && (
                    <>
                        <div className="col-span-2 relative">
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Reps</span>
                            <input
                                type="number"
                                min="0"
                                value={exercise.reps}
                                onChange={(e) => handleChange('reps', parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2 relative">
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">kg</span>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={exercise.weight}
                                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </>
                )}

                {mode === 'duration' && (
                    <div className="col-span-4 relative">
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Sec</span>
                        <input
                            type="number"
                            min="0"
                            value={exercise.duration_seconds || 0}
                            onChange={(e) => handleChange('duration_seconds', parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                {mode === 'distance' && (
                    <div className="col-span-4 relative">
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Mètres</span>
                        <input
                            type="number"
                            min="0"
                            value={exercise.distance_meters || 0}
                            onChange={(e) => handleChange('distance_meters', parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                {/* Common: Rest */}
                <div className="col-span-3 sm:col-span-3 relative">
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Repos</span>
                    <div className="relative">
                        <Clock className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="number"
                            min="0"
                            step="5"
                            value={exercise.rest_time}
                            onChange={(e) => handleChange('rest_time', parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded pl-7 pr-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
