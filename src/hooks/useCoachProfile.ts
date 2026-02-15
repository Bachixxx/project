import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStripeAccountStatus } from '../lib/stripe';

export interface Coach {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    specialization: string;
    bio: string;
    profile_image_url: string | null;
    created_at: string;
    stripe_account_id?: string;
    coach_code?: string;
}

export function useCoachProfile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['coach', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('coaches')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data as Coach;
        },
        enabled: !!user,
    });

    const stripeStatusQuery = useQuery({
        queryKey: ['coach-stripe-status', user?.id],
        queryFn: async () => {
            if (!query.data?.stripe_account_id) return null;
            try {
                return await getStripeAccountStatus();
            } catch (err) {
                console.error("Failed to fetch stripe status", err);
                return null;
            }
        },
        enabled: !!query.data?.stripe_account_id,
        staleTime: 60 * 1000, // Stripe status might change more often, check every minute if visited
    });

    const updateProfile = useMutation({
        mutationFn: async (updatedData: Partial<Coach>) => {
            if (!user?.id) throw new Error("No user");

            const { error } = await supabase
                .from('coaches')
                .update(updatedData)
                .eq('id', user.id);

            if (error) throw error;
            return updatedData;
        },
        onMutate: async (newCoachData) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['coach', user?.id] });

            // Snapshot the previous value
            const previousCoach = queryClient.getQueryData(['coach', user?.id]);

            // Optimistically update to the new value
            queryClient.setQueryData(['coach', user?.id], (old: Coach | null) => ({
                ...old,
                ...newCoachData,
            }));

            // Return a context object with the snapshotted value
            return { previousCoach };
        },
        onError: (err, newTodo, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousCoach) {
                queryClient.setQueryData(['coach', user?.id], context.previousCoach);
            }
        },
        onSettled: () => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ['coach', user?.id] });
        },
    });

    return {
        coach: query.data,
        isLoading: query.isLoading,
        error: query.error,
        stripeStatus: stripeStatusQuery.data,
        updateProfile,
    };
}
