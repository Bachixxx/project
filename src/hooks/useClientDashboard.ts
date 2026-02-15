import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface ClientDashboardData {
    client: any;
    nextSession: any;
    activeProgram: any;
    weeklyWorkouts: number;
    weightProgress: number | null;
    programProgress: number;
    recentLogs: any[];
    weightHistory: WeightEntry[];
    stats: {
        totalWorkouts: number;
        streakDays: number;
        totalVolume: number;
        level: number;
        xp: number;
    };
}

export function useClientDashboard() {
    const { user } = useAuth();

    // We need to find the client ID associated with this user ID
    // Assuming the auth user is the client account owner

    const query = useQuery({
        queryKey: ['clientDashboard', user?.id],
        queryFn: async (): Promise<ClientDashboardData> => {
            if (!user?.email) throw new Error('User not authenticated');

            // 1. Get Client Profile
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('email', user.email)
                .single();

            if (clientError) throw clientError;
            if (!client) throw new Error('Client profile not found');

            // 2. Parallel Fetching
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const [
                nextSessionRes,
                activeProgramRes,
                workoutsRes,
                weightLogsRes,
                recentLogsRes,
                allWorkoutsRes
            ] = await Promise.all([
                // Next Session
                supabase
                    .from('appointments')
                    .select(`
            id,
            title,
            start,
            duration,
            type,
            coach:coaches(full_name, avatar_url)
          `)
                    .eq('client_id', client.id)
                    .gte('start', new Date().toISOString())
                    .order('start', { ascending: true })
                    .limit(1)
                    .maybeSingle(),

                // Active Program
                supabase
                    .from('client_programs')
                    .select(`
            *,
            program:programs(name, duration_weeks)
          `)
                    .eq('client_id', client.id)
                    .eq('status', 'active')
                    .maybeSingle(),

                // Weekly Workouts (This week)
                supabase
                    .from('workout_sessions')
                    .select('id, date, duration_minutes, volume_load')
                    .eq('client_id', client.id)
                    .gte('date', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString()),

                // Weight Logs (Last 30 days)
                supabase
                    .from('weight_logs')
                    .select('date, weight')
                    .eq('client_id', client.id)
                    .order('date', { ascending: true })
                    .limit(30),

                // Recent Activity Logs
                supabase
                    .from('workout_logs')
                    .select(`
            id,
            created_at,
            exercise_id,
            sets,
            reps,
            weight
          `)
                    .eq('client_id', client.id)
                    .order('created_at', { ascending: false })
                    .limit(5),

                // All Workouts (for stats)
                supabase
                    .from('workout_sessions')
                    .select('id, date')
                    .eq('client_id', client.id)
            ]);

            // 3. Process Data
            const weightHistory = weightLogsRes.data || [];
            const weightProgress = weightHistory.length >= 2
                ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
                : null;

            const stats = {
                totalWorkouts: allWorkoutsRes.count || allWorkoutsRes.data?.length || 0,
                streakDays: client.current_streak || calculateStreak(allWorkoutsRes.data || []), // Use DB streak, fallback to calc
                totalVolume: workoutsRes.data?.reduce((acc, curr) => acc + (curr.volume_load || 0), 0) || 0,
                level: client.level || 1,
                xp: client.xp || 0
            };

            return {
                client,
                nextSession: nextSessionRes.data,
                activeProgram: activeProgramRes.data,
                weeklyWorkouts: workoutsRes.data?.length || 0,
                weightProgress,
                programProgress: activeProgramRes.data?.progress || 0,
                recentLogs: recentLogsRes.data || [],
                weightHistory,
                stats
            };
        },
        enabled: !!user?.email,
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error
    };
}

function calculateStreak(workouts: any[]): number {
    if (!workouts.length) return 0;

    const sortedDates = workouts
        .map(w => new Date(w.date).toDateString())
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(sortedDates)];
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if first workout is today or yesterday
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let currentDate = uniqueDates[0] === today ? new Date() : new Date(Date.now() - 86400000);

    for (const dateStr of uniqueDates) {
        if (dateStr === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}
