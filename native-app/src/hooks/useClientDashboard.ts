import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

export interface BrandingSettings {
    primaryColor?: string;
    logoUrl?: string;
    theme?: 'dark' | 'light';
    welcomeMessage?: string;
    appName?: string;
    dashboardHeroImage?: string;
}

export interface ClientDashboardData {
    client: any;
    branding: BrandingSettings | null;
    nextSession: any;
    activeProgram: any;
    weeklyWorkouts: number;
    weeklyWorkoutsData: any[];
    currentWeight: number | null;
    stats: {
        totalWorkouts: number;
        streakDays: number;
        level: number;
        xp: number;
    };
}

function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

function getEndOfWeek() {
    const start = getStartOfWeek();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

function calculateStreak(uniqueDates: string[]): number {
    if (!uniqueDates.length) return 0;
    const sorted = [...uniqueDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let current = sorted[0] === today ? new Date() : new Date(Date.now() - 86400000);
    for (const dateStr of sorted) {
        if (dateStr === current.toDateString()) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else break;
    }
    return streak;
}

export function useClientDashboard() {
    const { client, isLoading: authLoading } = useAuth();
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        if (!client) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const clientData = client;

            // Fetch coach branding
            let branding: BrandingSettings | null = null;
            if (clientData.coach_id) {
                const { data: coachData } = await supabase
                    .from('coaches')
                    .select('branding_settings')
                    .eq('id', clientData.coach_id)
                    .single();

                if (coachData?.branding_settings) {
                    branding = coachData.branding_settings as BrandingSettings;
                }
            }

            // Parallel fetches
            const [
                nextAppointmentRes,
                activeProgramRes,
                weeklyLogsRes,
                allLogsRes,
                latestWeightRes,
            ] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('id, title, start, duration, type, coach:coaches(full_name, avatar_url)')
                    .eq('client_id', clientData.id)
                    .gte('start', new Date().toISOString())
                    .order('start', { ascending: true })
                    .limit(1)
                    .maybeSingle(),

                supabase
                    .from('client_programs')
                    .select('*, program:programs(name, duration_weeks)')
                    .eq('client_id', clientData.id)
                    .eq('status', 'active')
                    .limit(1)
                    .maybeSingle(),

                supabase
                    .from('workout_logs')
                    .select('id, completed_at, reps, weight')
                    .eq('client_id', clientData.id)
                    .gte('completed_at', getStartOfWeek().toISOString())
                    .lte('completed_at', getEndOfWeek().toISOString()),

                supabase
                    .from('workout_logs')
                    .select('id, completed_at')
                    .eq('client_id', clientData.id),

                supabase
                    .from('body_scans')
                    .select('date, weight')
                    .eq('client_id', clientData.id)
                    .not('weight', 'is', null)
                    .order('date', { ascending: false })
                    .limit(1)
                    .maybeSingle(),
            ]);

            // Next program session
            let nextProgramSessionRes: any = { data: null };
            const activeProgram = activeProgramRes.data;

            if (activeProgram) {
                const todayStr = new Date().toISOString().split('T')[0];
                nextProgramSessionRes = await supabase
                    .from('scheduled_sessions')
                    .select('id, scheduled_date, session:sessions(name)')
                    .eq('client_id', clientData.id)
                    .eq('item_type', 'session')
                    .neq('status', 'completed')
                    .gte('scheduled_date', todayStr)
                    .order('scheduled_date', { ascending: true })
                    .limit(1)
                    .maybeSingle();
            }

            // Determine next session
            let nextSession = null;
            const candidates: any[] = [];

            if (nextAppointmentRes.data) {
                candidates.push({
                    ...nextAppointmentRes.data,
                    source: 'appointment',
                    compareDate: new Date(nextAppointmentRes.data.start),
                });
            }

            if (nextProgramSessionRes.data) {
                const dateStr = nextProgramSessionRes.data.scheduled_date;
                const now = new Date();
                let compareDate = new Date(dateStr);
                if (dateStr === now.toISOString().split('T')[0]) {
                    compareDate = new Date(now.getTime() + 60000);
                }
                candidates.push({
                    id: nextProgramSessionRes.data.id,
                    title: nextProgramSessionRes.data.session?.name || 'Entraînement',
                    start: dateStr,
                    source: 'program',
                    compareDate,
                    type: 'scheduled',
                });
            }

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.compareDate.getTime() - b.compareDate.getTime());
                nextSession = candidates[0];
            }

            // Process weekly data
            const weeklyLogs = weeklyLogsRes.data || [];
            const weeklyDates = new Set(weeklyLogs.map((l: any) => new Date(l.completed_at).toDateString()));

            // All-time stats
            const allLogs = allLogsRes.data || [];
            const uniqueDates = Array.from(new Set(allLogs.map((l: any) => new Date(l.completed_at).toDateString())));

            setData({
                client: clientData,
                branding,
                nextSession,
                activeProgram,
                weeklyWorkouts: weeklyDates.size,
                weeklyWorkoutsData: weeklyLogs,
                currentWeight: latestWeightRes.data?.weight || null,
                stats: {
                    totalWorkouts: uniqueDates.length,
                    streakDays: clientData.current_streak || calculateStreak(uniqueDates),
                    level: clientData.level || 1,
                    xp: clientData.xp || 0,
                },
            });
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [client, authLoading]);

    return { data, isLoading, error, refetch: fetchData };
}
