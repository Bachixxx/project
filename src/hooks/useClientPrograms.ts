import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    const { user } = useAuth();

    const query = useQuery({
        queryKey: ['clientPrograms', user?.id],
        queryFn: async (): Promise<ClientProgram[]> => {
            // 1. Get Client ID
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('auth_id', user?.id)
                .limit(1);

            const client = clients?.[0];

            if (clientError || !client) throw Error('Client not found');

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
        enabled: !!user?.email,
    });

    return {
        programs: query.data || [],
        isLoading: query.isLoading,
        error: query.error
    };
}
