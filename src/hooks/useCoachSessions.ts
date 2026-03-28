import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Session {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
    difficulty_level: string;
    session_type?: string;
    session_exercises?: any[];
    exercise_groups?: any[];
}

interface SaveSessionParams {
    sessionData: any;
    blocks: any[];
    standaloneExercises: any[];
    sessionId?: string;
    is_template?: boolean;
}

export function useCoachSessions() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [mutationError, setMutationError] = useState<string | null>(null);
    const clearMutationError = useCallback(() => setMutationError(null), []);

    // 1. Fetch Sessions
    const query = useQuery({
        queryKey: ['sessions', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('sessions')
                .select(`
          id,
          name,
          description,
          duration_minutes,
          difficulty_level,
          session_type,
          created_at,
          exercise_groups (
            id,
            name,
            repetitions,
            order_index,
            type,
            duration_seconds,
            is_template
          ),
          session_exercises (
            id,
            sets,
            reps,
            rest_time,
            order_index,
            instructions,
            group_id,
            duration_seconds,
            distance_meters,
            calories,
              exercise:exercises (
                id,
                name,
                category,
                difficulty_level,
                tracking_type,
                track_reps,
                track_weight,
                track_duration,
                track_distance,
                track_calories
              )
            )
        `)
                .eq('coach_id', user.id)
                .eq('is_template', true)
                .is('archived_at', null)
                .order('name');

            if (error) throw error;
            return data as Session[];
        },
        enabled: !!user,
    });

    // 2. Save Session Mutation (Create or Update)
    const saveSession = useMutation({
        mutationFn: async ({ sessionData, blocks, standaloneExercises, sessionId, is_template }: SaveSessionParams) => {
            if (!user?.id) throw new Error("No user");

            // Flatten all exercises with temp group IDs for the RPC to resolve
            const allExercisesPayload: any[] = [];
            let globalOrder = 0;

            blocks.forEach((block) => {
                block.exercises.forEach((ex: any) => {
                    allExercisesPayload.push({
                        exercise_id: ex.exercise.id,
                        group_id: block.id, // temp ID — RPC maps to real ID
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_time: ex.rest_time,
                        duration_seconds: ex.duration_seconds,
                        distance_meters: ex.distance_meters,
                        calories: ex.calories,
                        instructions: ex.instructions,
                        order_index: globalOrder++,
                    });
                });
            });

            standaloneExercises.forEach((ex) => {
                allExercisesPayload.push({
                    exercise_id: ex.exercise.id,
                    group_id: null,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_time: ex.rest_time,
                    duration_seconds: ex.duration_seconds,
                    distance_meters: ex.distance_meters,
                    calories: ex.calories,
                    instructions: ex.instructions,
                    order_index: globalOrder++,
                });
            });

            // Single atomic RPC call replaces 4+ sequential queries
            const { data: resultId, error } = await supabase.rpc('save_session_atomic', {
                p_session_data: sessionData,
                p_session_id: sessionId || null,
                p_blocks: blocks.map((b, i) => ({
                    id: b.id,
                    name: b.name,
                    type: b.type,
                    rounds: b.rounds || 1,
                    duration_seconds: b.duration_seconds,
                    order_index: i,
                })),
                p_exercises: allExercisesPayload,
                p_coach_id: user.id,
                p_is_template: is_template !== undefined ? is_template : true,
            });

            if (error) throw error;
            return resultId;
        },
        onSuccess: () => {
            setMutationError(null);
            queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] });
        },
        onError: (err: any) => {
            setMutationError(err.message || 'Erreur lors de la sauvegarde de la séance');
        },
    });

    // 3. Delete Session Mutation
    const deleteSession = useMutation({
        mutationFn: async (sessionId: string) => {
            const { error } = await supabase
                .from('sessions')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', sessionId);
            if (error) throw error;
            return sessionId;
        },
        onMutate: async (sessionId) => {
            await queryClient.cancelQueries({ queryKey: ['sessions', user?.id] });
            const previousSessions = queryClient.getQueryData(['sessions', user?.id]);

            queryClient.setQueryData(['sessions', user?.id], (old: Session[] | undefined) => {
                return old?.filter(s => s.id !== sessionId) ?? [];
            });

            return { previousSessions };
        },
        onError: (err: any, newTodo, context) => {
            if (context?.previousSessions) {
                queryClient.setQueryData(['sessions', user?.id], context.previousSessions);
            }
            setMutationError(err.message || 'Erreur lors de la suppression de la séance');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] });
        },
    });

    return {
        sessions: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        mutationError,
        clearMutationError,
        saveSession,
        deleteSession,
    };
}
