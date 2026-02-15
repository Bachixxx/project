import { format, subDays, isSameDay, parseISO } from 'date-fns';

// ...

// 5. Fetch Completed Scheduled Sessions (for robustness)
const today = new Date();
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

// 4. Calculate Weekly Activity (Real Data)
// Generate last 7 days and count sessions for each
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

// 6. Calculate Stats (Basic derivation)
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
