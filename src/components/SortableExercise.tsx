import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { SessionExercise } from './BlockManager';

interface SortableExerciseProps {
    exercise: SessionExercise;
    onEdit: (exercise: SessionExercise) => void;
    onRemove: (exerciseId: string) => void;
}

export function SortableExercise({ exercise, onEdit, onRemove }: SortableExerciseProps) {
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

    return (
        <div ref={setNodeRef} style={style} className="p-3 bg-white/5 rounded-lg flex justify-between items-center text-sm text-gray-300 border border-white/5 group relative mb-2">
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1">
                    <GripVertical className="w-4 h-4" />
                </button>
                <div className="font-medium text-white">{exercise.exercise.name}</div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-white/5 px-2 py-1 rounded">{exercise.sets} séries</span>
                    <span className="bg-white/5 px-2 py-1 rounded">{exercise.reps} reps</span>
                    {exercise.weight > 0 && <span className="bg-white/5 px-2 py-1 rounded">{exercise.weight}kg</span>}
                </div>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(exercise)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Modifier"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onRemove(exercise.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
