import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfWeek, endOfWeek } from 'date-fns';

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface ClientDashboardData {
    client: any;
    nextSession: any;
    activeProgram: any;
    weeklyWorkouts: number;
    weeklyWorkoutsData: any[];
    weightProgress: number | null;
    programProgress: number;
    recentLogs: any[];
    weightHistory: WeightEntry[];
    currentWeight: number | null;
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
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('auth_id', user.id)
                .limit(1);

            const client = clients?.[0];

            if (clientError) throw clientError;

            // If no client profile is found, return null or a specific flag
            // This prevents the 406 error and allows the UI to handle "Account not fully set up"
            if (!client) {
                console.warn('Client profile not found for user:', user.email);
                return null as any; // or handle this state in the UI components
            }

            // 2. Parallel Fetching
            const [
                nextPersonalAppointmentRes,
                nextGroupRegistrationRes,
                activeProgramRes,
                workoutsRes,
                weightLogsRes,
                recentLogsRes,
                allWorkoutsRes,
                latestBodyScanRes
            ] = await Promise.all([
                // Next Personal Appointment
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
                    .eq('type', 'personal')
                    .gte('start', new Date().toISOString())
                    .order('start', { ascending: true })
                    .limit(1)
                    .maybeSingle(),

                // Next Group Registration
                supabase
                    .from('session_registrations')
                    .select(`
            id,
            session:session_id(
                id,
                title,
                start,
                duration,
                type,
                coach:coaches(full_name, avatar_url)
            )
          `)
                    .eq('client_id', client.id)
                    .eq('status', 'registered')
                    .gte('session.start', new Date().toISOString())
                    // PostgREST ordering on joined tables might be tricky, we'll sort in memory if needed, but attempt it here
                    .order('created_at', { ascending: false }), // Best effort ordering before filtering

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
                    .from('workout_logs')
                    .select('id, completed_at, reps, weight')
                    .eq('client_id', client.id)
                    .gte('completed_at', startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
                    .lte('completed_at', endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()),

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
                    .from('workout_logs')
                    .select('id, completed_at, reps, weight')
                    .eq('client_id', client.id),

                // Latest Body Scan (for current weight)
                supabase
                    .from('body_scans')
                    .select('date, weight')
                    .eq('client_id', client.id)
                    .not('weight', 'is', null)
                    .order('date', { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ]);

            // 2.5 Fetch Next Program Session (requires activeProgram internal ID)
            let nextProgramSessionRes: any = { data: null };
            const activeProgram = activeProgramRes.data;

            if (activeProgram) {
                // Get today's start and end to find the next valid scheduled session
                const todayStr = new Date().toISOString().split('T')[0];

                nextProgramSessionRes = await supabase
                    .from('scheduled_sessions')
                    .select(`
                        id,
                        date,
                        template:workout_template_id(name)
                    `)
                    .eq('client_id', client.id)
                    .eq('client_program_id', activeProgram.id)
                    .eq('completed', false)
                    .gte('date', todayStr)
                    .order('date', { ascending: true })
                    .limit(1)
                    .maybeSingle();
            }

            // 3. Process Data

            // Normalize and compare dates to find the absolute next session
            let nextSession = null;
            const now = new Date();
            const candidates: any[] = [];

            // 1. Personal Appointment
            if (nextPersonalAppointmentRes.data) {
                candidates.push({
                    ...nextPersonalAppointmentRes.data,
                    source: 'appointment',
                    compareDate: new Date(nextPersonalAppointmentRes.data.start)
                });
            }

            // 2. Group Registration
            // Since we couldn't properly inner-join filter with PostgREST, filter valid future sessions in memory
            if (nextGroupRegistrationRes.data && nextGroupRegistrationRes.data.length > 0) {
                const validGroupSessions = nextGroupRegistrationRes.data
                    .filter((reg: any) => reg.session && new Date(reg.session.start) >= now)
                    .map((reg: any) => ({
                        ...reg.session,
                        source: 'group',
                        compareDate: new Date(reg.session.start)
                    }))
                    .sort((a, b) => a.compareDate.getTime() - b.compareDate.getTime());

                if (validGroupSessions.length > 0) {
                    candidates.push(validGroupSessions[0]);
                }
            }

            // 3. Program Session
            if (nextProgramSessionRes.data) {
                // Determine the start time. Scheduled sessions only have a 'date' (YYYY-MM-DD), not a time.
                // We'll treat its comparison time as the start of that day, or 'now' if it's today so it shows up.
                const sessionDateStr = nextProgramSessionRes.data.date;
                const todayStr = now.toISOString().split('T')[0];

                let compareDate = new Date(sessionDateStr);
                // If it's today, set the compare time to slightly in the future so it's prioritized
                // but doesn't immediately expire.
                if (sessionDateStr === todayStr) {
                    compareDate = new Date(now.getTime() + 60000); // Now + 1 min
                }

                candidates.push({
                    id: nextProgramSessionRes.data.id,
                    title: nextProgramSessionRes.data.template?.name || 'Entraînement',
                    start: sessionDateStr, // Keep original date string for display
                    source: 'program',
                    compareDate: compareDate,
                    type: 'scheduled'
                });
            }

            // Elect the closest upcoming session
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.compareDate.getTime() - b.compareDate.getTime());
                nextSession = candidates[0];
            }

            // User requested to ONLY use biometrics (body_scans) for weight
            const latestScan = latestBodyScanRes.data;
            const currentWeight = latestScan?.weight || null;

            const weightHistory = weightLogsRes.data || [];

            const weightProgress = weightHistory.length >= 2
                ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
                : null;

            const allLogs = allWorkoutsRes.data || [];
            // Map logs to exact unique dates to calculate total completed sessions
            const uniqueWorkoutDates = Array.from(new Set(
                allLogs.map(l => new Date(l.completed_at).toDateString())
            ));

            const totalVolume = allLogs.reduce((acc, curr) => acc + ((curr.weight || 0) * (curr.reps || 0)), 0);

            // For the week specifically
            const currentWeekLogs = workoutsRes.data || [];
            const weeklyWorkoutsSet = new Set(
                currentWeekLogs.map(l => new Date(l.completed_at).toDateString())
            );

            const stats = {
                totalWorkouts: uniqueWorkoutDates.length,
                streakDays: client.current_streak || calculateStreakFromLogs(uniqueWorkoutDates),
                totalVolume: totalVolume,
                level: client.level || 1,
                xp: client.xp || 0
            };

            return {
                client,
                nextSession: nextSession,
                activeProgram: activeProgram,
                weeklyWorkouts: weeklyWorkoutsSet.size,
                weeklyWorkoutsData: workoutsRes.data || [],
                weightProgress,
                programProgress: activeProgramRes.data?.progress || 0,
                recentLogs: recentLogsRes.data || [],
                weightHistory,
                currentWeight,
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



function calculateStreakFromLogs(uniqueDates: string[]): number {
    if (!uniqueDates.length) return 0;

    const sortedDates = [...uniqueDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if first workout is today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
        return 0;
    }

    let currentDate = sortedDates[0] === today ? new Date() : new Date(Date.now() - 86400000);

    for (const dateStr of sortedDates) {
        if (dateStr === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}
