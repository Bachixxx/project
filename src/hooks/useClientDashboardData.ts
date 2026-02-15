import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

export interface DashboardData {
    clientName: string;
    nextSession: any | null;
    stats: {
        workoutsCompleted: number;
        totalDuration: number; // in minutes
        streak: number;
        level: number;
        xp: number;
        weight?: number;
    };
    recentActivity: any[];
    weeklyActivity: { date: string; count: number }[];
}

export function useClientDashboardData() {
    const { client } = useClientAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        if (!client) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch Client Profile (for XP/Level if stored there)
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('full_name, xp, level, current_streak')
                .eq('id', client.id)
                .single();

            if (clientError) throw clientError;

            // 2. Fetch Next Session (Scheduled or Appointment)
            const now = new Date().toISOString();

            // Fetch scheduled sessions
            const { data: scheduledSessions } = await supabase
                .from('scheduled_sessions')
                .select(`
                    id, 
                    scheduled_date, 
                    status,
                    session:sessions(id, name, duration_minutes, difficulty_level)
                `)
                .eq('client_id', client.id)
                .gte('scheduled_date', now)
                .order('scheduled_date', { ascending: true })
                .limit(1);

            // Fetch appointments
            const { data: appointments } = await supabase
                .from('appointment_registrations')
                .select(`
                    appointment:appointments(
                        id, 
                        start, 
                        title, 
                        session_id
                    )
                `)
                .eq('client_id', client.id)
                .gte('appointment.start', now)
                .order('appointment(start)', { ascending: true })
                .limit(1);

            // Determine the absolute next session
            let nextSession = null;
            const scheduled = scheduledSessions?.[0];
            // @ts-ignore - Supabase join types can be tricky
            const appointment = appointments?.[0]?.appointment;

            if (scheduled && appointment) {
                const scheduledDate = new Date(scheduled.scheduled_date).getTime();
                const appointmentDate = new Date((appointment as any).start).getTime();
                nextSession = scheduledDate < appointmentDate ? { type: 'scheduled', ...scheduled } : { type: 'appointment', ...appointment };
            } else if (scheduled) {
                nextSession = { type: 'scheduled', ...scheduled };
            } else if (appointment) {
                nextSession = { type: 'appointment', ...appointment };
            }

            // 3. Fetch Recent Activity (Logs)
            const { data: recentLogs } = await supabase
                .from('workout_logs')
                .select('id, completed_at, exercise:exercises(name)')
                .eq('client_id', client.id)
                .order('completed_at', { ascending: false })
                .limit(5);

            // 4. Calculate Weekly Activity (Real Data)
            // Use date-fns for robust date handling
            const today = new Date();

            // 5. Fetch Completed Scheduled Sessions (for robustness)
            const { data: completedSessions } = await supabase
                .from('scheduled_sessions')
                .select('id, completed_at')
                .eq('client_id', client.id)
                .eq('status', 'completed')
                .gte('completed_at', subDays(today, 8).toISOString());

            const { data: weeklyLogs } = await supabase
                .from('workout_logs')
                .select('completed_at, scheduled_session_id, appointment_id')
                .eq('client_id', client.id)
                .gte('completed_at', subDays(today, 8).toISOString());

            const weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
                const d = subDays(today, 6 - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                const uniqueSessions = new Set();

                // 1. Process Logs
                weeklyLogs?.forEach(log => {
                    if (log.completed_at) {
                        const logDate = parseISO(log.completed_at);
                        if (isSameDay(logDate, d)) {
                            if (log.scheduled_session_id) uniqueSessions.add(`sched_${log.scheduled_session_id}`);
                            else if (log.appointment_id) uniqueSessions.add(`app_${log.appointment_id}`);
                            else uniqueSessions.add(`log_${logDate.getTime()}`);
                        }
                    }
                });

                // 2. Process Completed Sessions
                completedSessions?.forEach(session => {
                    if (session.completed_at) {
                        const sessionDate = parseISO(session.completed_at);
                        if (isSameDay(sessionDate, d)) {
                            uniqueSessions.add(`sched_${session.id}`);
                        }
                    }
                });

                return { date: dateStr, count: uniqueSessions.size };
            });

            // 6. Fetch Latest Weight
            const { data: latestScan } = await supabase
                .from('body_scans')
                .select('weight')
                .eq('client_id', client.id)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            // 7. Calculate Stats (Basic derivation)
            const { count: totalWorkouts } = await supabase
                .from('workout_logs')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', client.id);

            const stats = {
                workoutsCompleted: totalWorkouts || 0,
                totalDuration: 0,
                streak: clientData.current_streak || 0,
                level: clientData.level || 1,
                xp: clientData.xp || 0,
                weight: latestScan?.weight
            };

            setData({
                clientName: clientData.full_name,
                nextSession,
                stats,
                recentActivity: recentLogs || [],
                weeklyActivity
            });

        } catch (err: any) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [client]);

    return { data, loading, error, refresh: fetchDashboardData };
}
