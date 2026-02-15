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
}

export function useCoachSessions() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

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
        mutationFn: async ({ sessionData, blocks, standaloneExercises, sessionId }: SaveSessionParams) => {
            if (!user?.id) throw new Error("No user");

            let targetSessionId = sessionId;

            // A. Create or Update Session Record
            if (targetSessionId) {
                const { data, error } = await supabase
                    .from('sessions')
                    .update(sessionData)
                    .eq('id', targetSessionId)
                    .select()
                    .single();
                if (error) throw error;

                // Cleanup old data to rewrite
                await supabase.from('exercise_groups').delete().eq('session_id', targetSessionId);
                await supabase.from('session_exercises').delete().eq('session_id', targetSessionId);
            } else {
                const { data, error } = await supabase
                    .from('sessions')
                    .insert([{ ...sessionData, coach_id: user.id, is_template: true }])
                    .select()
                    .single();
                if (error) throw error;
                targetSessionId = data.id;
            }

            const finalSessionId = targetSessionId!;

            // B. Insert Blocks
            const blockIdMap = new Map();
            if (blocks.length > 0) {
                const blocksToInsert = blocks.map((block) => ({
                    session_id: finalSessionId,
                    name: block.name,
                    type: block.type,
                    repetitions: block.rounds || 1,
                    duration_seconds: block.duration_seconds,
                    order_index: block.order_index,
                    coach_id: user.id,
                    is_template: false,
                }));

                const { data: insertedBlocks, error: blocksError } = await supabase
                    .from('exercise_groups')
                    .insert(blocksToInsert)
                    .select();

                if (blocksError) throw blocksError;

                blocks.forEach((block, index) => {
                    blockIdMap.set(block.id, insertedBlocks[index].id);
                });
            }

            // C. Insert Exercises (Flattened)
            let allExercisesPayload: any[] = [];
            let globalOrder = 0;

            // C1. Block Exercises
            blocks.forEach((block) => {
                const realGroupId = blockIdMap.get(block.id);
                block.exercises.forEach((ex: any) => {
                    allExercisesPayload.push({
                        session_id: finalSessionId,
                        exercise_id: ex.exercise.id,
                        group_id: realGroupId,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight,
                        rest_time: ex.rest_time,
                        duration_seconds: ex.duration_seconds,
                        distance_meters: ex.distance_meters,
                        calories: ex.calories,
                        instructions: ex.instructions,
                        order_index: globalOrder++,
                    });
                });
            });

            // C2. Standalone Exercises
            standaloneExercises.forEach((ex) => {
                allExercisesPayload.push({
                    session_id: finalSessionId,
                    exercise_id: ex.exercise.id,
                    group_id: null,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    rest_time: ex.rest_time,
                    duration_seconds: ex.duration_seconds,
                    distance_meters: ex.distance_meters,
                    calories: ex.calories,
                    instructions: ex.instructions,
                    order_index: globalOrder++,
                });
            });

            if (allExercisesPayload.length > 0) {
                const { error: exError } = await supabase.from('session_exercises').insert(allExercisesPayload);
                if (exError) throw exError;
            }

            return finalSessionId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] });
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
        onError: (err, newTodo, context) => {
            if (context?.previousSessions) {
                queryClient.setQueryData(['sessions', user?.id], context.previousSessions);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] });
        },
    });

    return {
        sessions: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        saveSession,
        deleteSession,
    };
}
