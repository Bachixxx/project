import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

export interface Program {
    id: string;
    status: string;
    progress: number;
    scheduling_type: string;
    program: {
        id: string;
        name: string;
        description: string;
        duration_weeks: number;
        coach: {
            full_name: string;
        };
    };
}

export function useWorkouts() {
    const { user, client } = useAuth();
    const [workouts, setWorkouts] = useState<Program[]>([]);
    const [stats, setStats] = useState({ completedCount: 0, totalWorkouts: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // We need the client profile ID (UUID) to fetch programs
        if (client?.id) {
            fetchWorkouts();
        } else if (user === null && !isLoading) {
            // Not logged in
            setIsLoading(false);
        }
    }, [user, client?.id]);

    async function fetchWorkouts() {
        try {
            setIsLoading(true);
            const { data, error: fetchError } = await supabase
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
            duration_weeks,
            coach:coaches (
              full_name
            )
          )
        `)
                .eq('client_id', client.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setWorkouts(data as any || []);

            // Calculate simple stats for the grid
            const typedData = data as any[];
            const total = typedData?.reduce((acc: number, curr: any) => acc + (curr.program.duration_weeks * 4), 0) || 0;
            const completed = typedData?.reduce((acc: number, curr: any) => acc + Math.floor(total * (curr.progress / 100)), 0) || 0;

            setStats({
                completedCount: completed,
                totalWorkouts: total,
            });

        } catch (error: any) {
            console.error('Error fetching workouts:', error);
            Alert.alert('Erreur', error.message || 'Impossible de charger les programmes');
        } finally {
            setIsLoading(false);
        }
    }

    return {
        workouts,
        stats,
        isLoading,
        refetch: fetchWorkouts,
    };
}
