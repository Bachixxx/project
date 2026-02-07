import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';

export interface WorkoutSet {
    id: string;
    reps: string;
    weight: string;
    rpe?: string;
    rest?: string;
    completed?: boolean;
}

export interface BuilderExercise {
    id: string;
    exercise_id: string;
    name: string;
    sets: WorkoutSet[];
    notes?: string;
    rest_type?: 'straight' | 'superset' | 'circuit';
}

export function useWorkoutBuilder(initialExercises: BuilderExercise[] = []) {
    const [exercises, setExercises] = useState<BuilderExercise[]>(initialExercises);

    const addExercises = useCallback((selectedExercises: any[]) => {
        const newExercises = selectedExercises.map(ex => ({
            id: uuidv4(),
            exercise_id: ex.id,
            name: ex.name,
            sets: [
                { id: uuidv4(), reps: '10', weight: '' },
                { id: uuidv4(), reps: '10', weight: '' },
                { id: uuidv4(), reps: '10', weight: '' },
            ]
        }));
        setExercises(prev => [...prev, ...newExercises]);
    }, []);

    const removeExercise = useCallback((exerciseId: string) => {
        setExercises(prev => prev.filter(e => e.id !== exerciseId));
    }, []);

    const updateSet = useCallback((exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return {
                ...ex,
                sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
            };
        }));
    }, []);

    const addSet = useCallback((exerciseId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            return {
                ...ex,
                sets: [...ex.sets, {
                    id: uuidv4(),
                    reps: lastSet ? lastSet.reps : '10',
                    weight: lastSet ? lastSet.weight : ''
                }]
            };
        }));
    }, []);

    const removeSet = useCallback((exerciseId: string, setId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return {
                ...ex,
                sets: ex.sets.filter(s => s.id !== setId)
            };
        }));
    }, []);

    const reorderExercises = useCallback((activeId: string, overId: string) => {
        setExercises((items) => {
            const oldIndex = items.findIndex((i) => i.id === activeId);
            const newIndex = items.findIndex((i) => i.id === overId);
            return arrayMove(items, oldIndex, newIndex);
        });
    }, []);

    const reset = useCallback(() => {
        setExercises([]);
    }, []);

    return {
        exercises,
        addExercises,
        removeExercise,
        updateSet,
        addSet,
        removeSet,
        reorderExercises,
        reset,
        setExercises // exposed if needed for full replace
    };
}
