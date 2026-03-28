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
}

export interface ProgramSession {
    id: string;
    session: Session;
    order_index: number;
}

export interface Program {
    id: string;
    name: string;
    description: string;
    duration_weeks: number;
    difficulty_level: string;
    price: number;
    is_public: boolean;
    program_sessions: ProgramSession[];
    coach_id: string;
}

export interface SaveProgramParams {
    programData: Partial<Program>;
    selectedSessions: ProgramSession[];
    programId?: string;
    knownUpdatedAt?: string;
}

export function useCoachPrograms() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [mutationError, setMutationError] = useState<string | null>(null);
    const clearMutationError = useCallback(() => setMutationError(null), []);

    const query = useQuery({
        queryKey: ['programs', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('programs')
                .select(`
          *,
          program_sessions (
            id,
            session:sessions (
              id,
              name,
              description,
              duration_minutes,
              difficulty_level
            ),
            order_index
          )
        `)
                .eq('coach_id', user.id)
                .order('name');

            if (error) throw error;

            // Sanitize data: Filter out program_sessions with null sessions (e.g. deleted sessions)
            const safeData = (data as any[]).map(program => ({
                ...program,
                program_sessions: program.program_sessions?.filter((ps: any) => ps.session !== null) || []
            }));

            return safeData as Program[];
        },
        enabled: !!user,
    });

    const saveProgram = useMutation({
        mutationFn: async ({ programData, selectedSessions, programId, knownUpdatedAt }: SaveProgramParams) => {
            let finalProgramId = programId;

            // Remove program_sessions and other non-column fields from programData
            const { program_sessions, updated_at, ...cleanProgramData } = programData as any;

            // 1. Create or Update Program
            if (programId) {
                let query = supabase
                    .from('programs')
                    .update(cleanProgramData)
                    .eq('id', programId);

                // Optimistic lock: only update if updated_at hasn't changed
                if (knownUpdatedAt) {
                    query = query.eq('updated_at', knownUpdatedAt);
                }

                const { data: updatedRows, error } = await query.select('id');
                if (error) throw error;
                if (!updatedRows || updatedRows.length === 0) {
                    throw new Error('Ce programme a été modifié par quelqu\'un d\'autre. Veuillez rafraîchir la page.');
                }

                // Delete existing sessions to replace them
                await supabase
                    .from('program_sessions')
                    .delete()
                    .eq('program_id', programId);
            } else {
                const { data, error } = await supabase
                    .from('programs')
                    .insert([{ ...cleanProgramData, coach_id: user?.id }])
                    .select()
                    .single();
                if (error) throw error;
                finalProgramId = data.id;
            }

            // 2. Insert Sessions
            if (selectedSessions.length > 0 && finalProgramId) {
                const programSessions = selectedSessions.map((session, index) => ({
                    program_id: finalProgramId,
                    session_id: session.session.id,
                    order_index: index,
                }));

                const { error: sessionError } = await supabase
                    .from('program_sessions')
                    .insert(programSessions);

                if (sessionError) throw sessionError;
            }

            return finalProgramId;
        },
        onSuccess: () => {
            setMutationError(null);
            queryClient.invalidateQueries({ queryKey: ['programs', user?.id] });
        },
        onError: (err: any) => {
            setMutationError(err.message || 'Erreur lors de la sauvegarde du programme');
        },
    });

    const deleteProgram = useMutation({
        mutationFn: async (programId: string) => {
            const { error } = await supabase
                .from('programs')
                .delete()
                .eq('id', programId);
            if (error) throw error;
        },
        onSuccess: () => {
            setMutationError(null);
            queryClient.invalidateQueries({ queryKey: ['programs', user?.id] });
        },
        onError: (err: any) => {
            setMutationError(err.message || 'Erreur lors de la suppression du programme');
        },
    });

    return {
        programs: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        mutationError,
        clearMutationError,
        saveProgram,
        deleteProgram,
    };
}
