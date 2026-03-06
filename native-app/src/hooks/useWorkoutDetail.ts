import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

export interface Session {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
    difficulty_level: string;
    session_exercises: { count: number }[];
}

export interface ProgramSession {
    id: string;
    order_index: number;
    session: Session;
}

export interface ProgramDetail {
    id: string;
    status: string;
    progress: number;
    scheduling_type: string;
    program: {
        id: string;
        name: string;
        description: string;
        difficulty_level: string;
        duration_weeks: number;
        coach_id: string;
        coach: {
            full_name: string;
            profile_image_url: string;
        };
        program_sessions: ProgramSession[];
    };
}

export function useWorkoutDetail(clientProgramId: string) {
    const { client } = useAuth();
    const [program, setProgram] = useState<ProgramDetail | null>(null);
    const [sessionsStatus, setSessionsStatus] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (client?.id && clientProgramId) {
            fetchDetails();
        }
    }, [client?.id, clientProgramId]);

    async function fetchDetails() {
        try {
            setIsLoading(true);
            setError(null);

            // 1. Fetch Program Details with Sessions
            const { data: programData, error: programError } = await supabase
                .from('client_programs')
                .select(`
          id,
          status,
          progress,
          scheduling_type,
          program:programs!inner (
            id,
            name,
            description,
            difficulty_level,
            duration_weeks,
            coach_id,
            coach:coaches (
              full_name,
              profile_image_url
            ),
            program_sessions!inner (
              id,
              order_index,
              session:sessions!inner (
                id,
                name,
                description,
                duration_minutes,
                difficulty_level,
                session_exercises ( count )
              )
            )
          )
        `)
                .eq('id', clientProgramId)
                .single();

            if (programError) throw programError;
            setProgram(programData as any);

            // 2. Fetch Completion Status for sessions
            const sessionIds = (programData.program as any).program_sessions.map((ps: any) => ps.session.id);

            const { data: historyData, error: historyError } = await supabase
                .from('scheduled_sessions')
                .select('session_id, status, scheduled_date, id')
                .eq('client_id', client?.id)
                .in('session_id', sessionIds)
                .order('scheduled_date', { ascending: false });

            if (historyError) throw historyError;

            const statusMap: Record<string, any> = {};
            historyData?.forEach(h => {
                if (!statusMap[h.session_id]) {
                    statusMap[h.session_id] = h;
                }
            });
            setSessionsStatus(statusMap);

        } catch (err: any) {
            console.error('Error fetching program details:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        program,
        sessionsStatus,
        isLoading,
        error,
        refetch: fetchDetails
    };
}
