import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Client {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    height: number;
    weight: number;
    fitness_goals: string[];
    medical_conditions: string[];
    notes: string;
    status: string;
    created_at: string;
}

export function useCoachClients() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Clients
    const query = useQuery({
        queryKey: ['clients', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('coach_id', user.id)
                .order('full_name');

            if (error) throw error;
            return data as Client[];
        },
        enabled: !!user,
    });

    // 2. Create Client Mutation
    const createClient = useMutation({
        mutationFn: async (newClient: Partial<Client>) => {
            if (!user?.id) throw new Error("No user");

            const { data, error } = await supabase
                .from('clients')
                .insert([{ ...newClient, coach_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
            // Also invalidate subscription info as client count changed
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
        },
    });

    // 3. Update Client Mutation
    const updateClient = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
            const { error } = await supabase
                .from('clients')
                .update(data)
                .eq('id', id);

            if (error) throw error;
            return { id, ...data };
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['clients', user?.id] });
            const previousClients = queryClient.getQueryData(['clients', user?.id]);

            queryClient.setQueryData(['clients', user?.id], (old: Client[] | undefined) => {
                return old?.map((client) =>
                    client.id === id ? { ...client, ...data } : client
                );
            });

            return { previousClients };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousClients) {
                queryClient.setQueryData(['clients', user?.id], context.previousClients);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
        },
    });

    return {
        clients: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        createClient,
        updateClient,
    };
}
