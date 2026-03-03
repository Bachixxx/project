import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';

export interface ClientProgram {
    id: string;
    status: 'active' | 'completed' | 'paused';
    start_date: string;
    progress: number;
    program: {
        id: string;
        name: string;
        description: string;
        duration_weeks: number;
        difficulty_level: string;
        is_public: boolean;
        coach: {
            full_name: string;
        };
    };
}

export function useClientPrograms() {
    const { client } = useClientAuth();

    const query = useQuery({
        queryKey: ['clientPrograms', client?.id],
        queryFn: async (): Promise<ClientProgram[]> => {
            if (!client) throw Error('Client not authenticated');

            // 2. Fetch Programs
            const { data, error } = await supabase
                .from('client_programs')
                .select(`
          id,
          status,
          start_date,
          progress,
          program:programs (
            id,
            name,
            description,
            duration_weeks,
            difficulty_level,
            is_public,
            coach:coaches (
              full_name
            )
          )
        `)
                .eq('client_id', client.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!client?.id,
    });

    return {
        programs: query.data || [],
        isLoading: query.isLoading,
        error: query.error
    };
}
