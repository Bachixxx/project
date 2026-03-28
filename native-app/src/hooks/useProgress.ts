import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

export interface ProgressData {
    client: any;
    weightHistory: { weight: number; date: string }[];
    workoutLogs: any[];
    exercises: any[];
    stats: {
        level: number;
        xp: number;
        streakDays: number;
        sessionsThisMonth: number;
        totalSessionsAllTime: number;
        fitnessGoals: string[];
    };
}

export function useProgress() {
    const { client, isLoading: authLoading } = useAuth();
    const [data, setData] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!client) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const clientData = client;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            // Parallel fetches
            const [
                weightHistoryRes,
                allLogsRes,
            ] = await Promise.all([
                supabase
                    .from('body_scans')
                    .select('weight, date')
                    .eq('client_id', clientData.id)
                    .not('weight', 'is', null)
                    .order('date', { ascending: true }),

                supabase
                    .from('workout_logs')
                    .select(`
                        id,
                        completed_at,
                        weight,
                        reps,
                        duration_seconds,
                        distance_meters,
                        calories,
                        exercise_id,
                        scheduled_session:scheduled_sessions (
                            scheduled_date
                        )
                    `)
                    .eq('client_id', clientData.id)
                    .order('completed_at', { ascending: true }),
            ]);

            if (weightHistoryRes.error) throw weightHistoryRes.error;
            if (allLogsRes.error) throw allLogsRes.error;

            const formattedLogs = (allLogsRes.data || []).map(log => ({
                ...log,
                scheduled_session: Array.isArray(log.scheduled_session)
                    ? log.scheduled_session[0]
                    : log.scheduled_session
            }));

            // Fetch unique exercises from logs
            const exerciseIds = Array.from(new Set(formattedLogs.map(log => log.exercise_id)));
            let exercises: any[] = [];
            if (exerciseIds.length > 0) {
                const { data: exercisesRes, error: exError } = await supabase
                    .from('exercises')
                    .select('id, name, tracking_type, track_reps, track_weight, track_duration, track_distance, track_calories')
                    .in('id', exerciseIds);

                if (exError) throw exError;
                exercises = exercisesRes || [];
            }

            // Stats calculations (matching PWA logic)
            const uniqueDates = Array.from(new Set(formattedLogs.map((l: any) => l.completed_at.split('T')[0])));
            const totalSessionsAllTime = uniqueDates.length;

            const sessionsThisMonth = uniqueDates.filter(dateStr => {
                const d = new Date(dateStr);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            setData({
                client: clientData,
                weightHistory: (weightHistoryRes.data || []).map(w => ({
                    weight: Number(w.weight),
                    date: w.date
                })),
                workoutLogs: formattedLogs,
                exercises,
                stats: {
                    level: (clientData as any).level || 1,
                    xp: (clientData as any).xp || 0,
                    streakDays: (clientData as any).current_streak || 0,
                    sessionsThisMonth,
                    totalSessionsAllTime,
                    fitnessGoals: ((clientData as any).fitness_goals || []).slice(0, 3) as string[]
                }
            });

            setError(null);
        } catch (err: any) {
            console.error('Error in useProgress:', err);
            setError(err as Error);
            Alert.alert('Erreur', err.message || 'Impossible de charger les progrès');
        } finally {
            setIsLoading(false);
        }
    }, [client, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [fetchData, authLoading]);

    return { data, isLoading, error, refetch: fetchData };
}
