import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BlockManager, SessionBlock } from '../BlockManager';
import { ExerciseSelector } from './ExerciseSelector';
import { ResponsiveModal } from '../ResponsiveModal';

// Shared interfaces for Session Builder
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
        tracking_type?: 'reps_weight' | 'duration' | 'distance';
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

export interface Exercise {
    id: string;
    name: string;
    category: string;
    difficulty_level: string;
    coach_id: string | null;
    track_reps: boolean;
    track_weight: boolean;
    track_duration: boolean;
    track_distance: boolean;
    track_calories: boolean;
    tracking_type?: 'reps_weight' | 'duration' | 'distance';
}

interface SessionBuilderModalProps {
    session?: any;
    onClose: () => void;
    onSave: (sessionData: any, blocks: SessionBlock[], standaloneExercises: SessionExercise[]) => Promise<void>;
}

export function SessionBuilderModal({ session, onClose, onSave }: SessionBuilderModalProps) {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchExercises();

        // If we have a session ID but no exercise_groups/session_exercises, we need to fetch them
        if (session?.id && !session.exercise_groups && !session.session_exercises) {
            fetchSessionDetails(session.id);
        }
    }, [session?.id]);

    const fetchSessionDetails = async (sessionId: string) => {
        try {
            setLoadingDetails(true);
            const { data, error } = await supabase
                .from('sessions')
                .select(`
          id,
          name,
          description,
          duration_minutes,
          difficulty_level,
          session_type,
          is_template,
          exercise_groups (
            id, name, repetitions, order_index, type, duration_seconds, is_template
          ),
          session_exercises (
            id, sets, reps, weight, rest_time, order_index, instructions, group_id, 
            duration_seconds, distance_meters, calories,
            exercise:exercises (
              id, name, category, difficulty_level, tracking_type, track_reps, track_weight, track_duration, track_distance, track_calories
            )
          )
        `)
                .eq('id', sessionId)
                .single();

            if (error) throw error;

            if (data) {
                // Hydrate form data with session details if missing from initial prop
                setFormData(prev => ({
                    ...prev,
                    name: data.name || prev.name,
                    description: data.description || prev.description,
                    duration_minutes: data.duration_minutes || prev.duration_minutes,
                    difficulty_level: data.difficulty_level || prev.difficulty_level,
                    session_type: data.session_type || prev.session_type,
                }));

                // Hydrate blocks
                const loadedBlocks = (data.exercise_groups || []).map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    type: g.type || (g.repetitions > 1 ? 'circuit' : 'regular'),
                    rounds: g.repetitions,
                    duration_seconds: g.duration_seconds,
                    order_index: g.order_index,
                    exercises: (data.session_exercises || [])
                        .filter((ex: any) => ex.group_id === g.id)
                        .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                })).sort((a: any, b: any) => a.order_index - b.order_index);

                setBlocks(loadedBlocks);

                // Hydrate standalone exercises
                const loadedStandalone = (data.session_exercises || [])
                    .filter((ex: any) => !ex.group_id)
                    .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
                    .sort((a: any, b: any) => a.order_index - b.order_index);

                setStandaloneExercises(loadedStandalone);
            }
        } catch (error) {
            console.error('Error fetching full session details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const fetchExercises = async () => {
        try {
            setLoadingExercises(true);
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .or(`coach_id.eq.${user?.id},coach_id.is.null`)
                .order('name');

            if (error) throw error;
            setExercises(data);
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            setLoadingExercises(false);
        }
    };

    const [formData, setFormData] = useState({
        name: session?.name || '',
        description: session?.description || '',
        duration_minutes: session?.duration_minutes || 60,
        difficulty_level: session?.difficulty_level || 'Débutant',
        session_type: session?.session_type || 'private',
    });

    // Transform DB data to UI Block structure
    const [blocks, setBlocks] = useState<SessionBlock[]>(() => {
        if (!session?.exercise_groups) return [];
        return session.exercise_groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            type: g.type || (g.repetitions > 1 ? 'circuit' : 'regular'),
            rounds: g.repetitions,
            duration_seconds: g.duration_seconds,
            order_index: g.order_index,
            exercises: (session.session_exercises || [])
                .filter((ex: any) => ex.group_id === g.id)
                .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
                .sort((a: any, b: any) => a.order_index - b.order_index)
        })).sort((a: any, b: any) => a.order_index - b.order_index);
    });

    const [standaloneExercises, setStandaloneExercises] = useState<SessionExercise[]>(() => {
        if (!session?.session_exercises) return [];
        return session.session_exercises
            .filter((ex: any) => !ex.group_id)
            .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
            .sort((a: any, b: any) => a.order_index - b.order_index);
    });

    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [targetBlockId, setTargetBlockId] = useState<string | null>(null); // null = standalone/new

    const handleAddExercises = (newExercises: any[]) => {
        const formattedExercises: SessionExercise[] = newExercises.map(ex => ({
            id: `temp-ex-${Date.now()}-${Math.random()}`,
            exercise: ex,
            sets: 3,
            reps: 10,
            weight: 0,
            rest_time: 60,
            order_index: 0,
            instructions: '',
            group_id: targetBlockId,
            duration_seconds: 60,
            distance_meters: 1000,
            calories: 0,
        }));

        if (targetBlockId) {
            setBlocks(prev => prev.map(b => {
                if (b.id === targetBlockId) {
                    return { ...b, exercises: [...b.exercises, ...formattedExercises] };
                }
                return b;
            }));
        } else {
            setStandaloneExercises(prev => [...prev, ...formattedExercises]);
        }
        setShowExerciseModal(false);
    };

    return (
        <ResponsiveModal
            isOpen={true}
            onClose={onClose}
            title={session ? 'Modifier la séance' : 'Créer une séance'}
            maxWidth="!max-w-[95vw] !h-[90vh] !max-h-[90vh]"
            footer={
                <div className="flex justify-end gap-4 w-full">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button
                        type="button"
                        onClick={() => onSave(formData, blocks, standaloneExercises)}
                        className="primary-button flex items-center gap-2"
                        disabled={blocks.length === 0 && standaloneExercises.length === 0}
                    >
                        <Save className="w-4 h-4" /> Sauvegarder
                    </button>
                </div>
            }
        >
            <div className="flex flex-col lg:flex-row h-full gap-6">
                {/* Sidebar: Metadata */}
                <div className="w-full lg:w-1/3 space-y-6 overflow-y-auto custom-scrollbar p-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la séance</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            placeholder="Ex: Pectoraux Explosifs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Durée (min)</label>
                            <input
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulté</label>
                            <select
                                value={formData.difficulty_level}
                                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                                className="input-field cursor-pointer"
                            >
                                <option value="Débutant">Débutant</option>
                                <option value="Intermédiaire">Intermédiaire</option>
                                <option value="Avancé">Avancé</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="input-field"
                            placeholder="Objectifs, matériel nécessaire..."
                        />
                    </div>
                </div>

                {/* Main Area: Blocks */}
                <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar relative">
                    <BlockManager
                        blocks={blocks}
                        standaloneExercises={standaloneExercises}
                        onBlocksChange={setBlocks}
                        onStandaloneExercisesChange={setStandaloneExercises}
                        onShowExercisePicker={(blockId) => {
                            setTargetBlockId(blockId);
                            setShowExerciseModal(true);
                        }}
                    />

                    {/* Empty state hint if nothing exists */}
                    {blocks.length === 0 && standaloneExercises.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-gray-500 text-sm">Ajoutez des blocs pour structurer votre séance.</p>
                        </div>
                    )}
                </div>
            </div>

            {showExerciseModal && (
                <ExerciseSelector
                    exercises={exercises}
                    onClose={() => setShowExerciseModal(false)}
                    onSelect={handleAddExercises}
                    multiSelect={true}
                    loading={loadingExercises}
                />
            )}

        </ResponsiveModal>
    );
}
