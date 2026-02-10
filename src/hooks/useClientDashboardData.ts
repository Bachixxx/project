import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useClientAuth } from '../contexts/ClientAuthContext';

export interface DashboardData {
    clientName: string;
    nextSession: any | null;
    stats: {
        workoutsCompleted: number;
        totalDuration: number; // in minutes
        streak: number;
        level: number;
        xp: number;
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
                .select('full_name, level, xp, current_streak') // Assuming these columns exist or we mock them
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
                const appointmentDate = new Date(appointment.start).getTime();
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
            const today = new Date();
            const last7Days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const { data: weeklyLogs } = await supabase
                .from('workout_logs')
                .select('completed_at')
                .eq('client_id', client.id)
                .gte('completed_at', last7Days[0]);

            const weeklyActivity = last7Days.map(date => {
                const count = weeklyLogs?.filter(log => log.completed_at.startsWith(date)).length || 0;
                return { date, count };
            });

            // 5. Calculate Stats (Basic derivation)
            // Ideally this should be a dedicated stats table or RPC for performance
            const { count: totalWorkouts } = await supabase
                .from('workout_logs')
                .select('id', { count: 'exact', head: true })
                .eq('client_id', client.id);

            const stats = {
                workoutsCompleted: totalWorkouts || 0,
                totalDuration: 0, // Hard to sum without aggregation
                streak: clientData.current_streak || 0,
                level: clientData.level || 1,
                xp: clientData.xp || 0
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
