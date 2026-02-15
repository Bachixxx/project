import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


export interface DashboardStats {
    totalClients: number;
    activePrograms: number;
    upcomingSessions: number;
    monthlyRevenue: number;
    monthlyGrowth: number;
    newClientsThisMonth: number;
    avgProgramCompletion: number;
}

export interface Activity {
    id: string;
    type: 'program_start' | 'workout_complete' | 'payment';
    date: Date;
    clientName: string;
    detail: string;
    rawDate: string;
}

export interface DashboardData {
    stats: DashboardStats;
    recentActivities: Activity[];
    clientProgress: any[];
    allPayments: any[];
    upcomingAppointments: any[];
    coachCode: string | null;
}

export function useCoachDashboard() {
    const { user } = useAuth();
    // const { language } = useLanguage(); // Removed unused


    const query = useQuery({
        queryKey: ['coachDashboard', user?.id],
        queryFn: async (): Promise<DashboardData> => {
            if (!user?.id) throw new Error('User not authenticated');

            // 1. Parallel Fetching for independent data
            const [
                clientsRes,
                coachProfileRes,
                activeProgramsRes,
                upcomingSessionsRes,
                newClientsRes,
                activeProgramsProgressRes,
                paymentsRes,
                recentProgramsRes,
                recentWorkoutsRes,
                recentPaymentsRes,
                clientProgressRes
            ] = await Promise.all([
                // Total Clients
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('coach_id', user.id),
                // Coach Profile (Code)
                supabase.from('coaches').select('coach_code').eq('id', user.id).single(),
                // Active Programs Count
                supabase.from('client_programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                // Upcoming Sessions (Next 7 days)
                supabase
                    .from('appointments')
                    .select(`id, title, start, duration, client:clients(full_name), type`, { count: 'exact' })
                    .eq('coach_id', user.id)
                    .gte('start', new Date().toISOString())
                    .lte('start', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
                    .eq('status', 'scheduled')
                    .order('start', { ascending: true })
                    .limit(5),
                // New Clients This Month
                supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true })
                    .eq('coach_id', user.id)
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
                // Active Programs Progress (for Avg)
                supabase.from('client_programs').select('progress').eq('status', 'active'),
                // Payments (All for charts)
                supabase
                    .from('payments')
                    .select('amount, payment_date')
                    .eq('status', 'paid')
                    .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()), // Get last 6 months minimum
                // Recent Programs
                supabase
                    .from('client_programs')
                    .select(`id, start_date, client:clients(full_name), program:programs(name)`)
                    .order('start_date', { ascending: false })
                    .limit(5),
                // Recent Workouts
                supabase
                    .from('workout_sessions')
                    .select(`id, date, client_program:client_programs(client:clients(full_name), program:programs(name))`)
                    .order('date', { ascending: false })
                    .limit(5),
                // Recent Payments
                supabase
                    .from('payments')
                    .select(`id, amount, payment_date, client:clients(full_name)`)
                    .eq('status', 'paid')
                    .order('payment_date', { ascending: false })
                    .limit(5),
                // Client Progress List
                supabase
                    .from('client_programs')
                    .select(`id, progress, client:clients(full_name), program:programs(name)`)
                    .eq('status', 'active')
                    .order('progress', { ascending: false })
                    .limit(4)
            ]);

            // 2. Process Data
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const payments = paymentsRes.data || [];
            const currentMonthRevenue = payments
                .filter((p: any) => new Date(p.payment_date) >= startOfMonth)
                .reduce((sum: number, p: any) => sum + p.amount, 0);

            const lastMonthRevenue = payments
                .filter((p: any) => {
                    const d = new Date(p.payment_date);
                    return d >= lastMonthDate && d < startOfMonth;
                })
                .reduce((sum: number, p: any) => sum + p.amount, 0);

            const monthlyGrowth = lastMonthRevenue
                ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
                : 0;

            const avgProgramCompletion = activeProgramsProgressRes.data?.length
                ? Math.round(activeProgramsProgressRes.data.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / activeProgramsProgressRes.data.length)
                : 0;

            // Merge Activities
            const activities: Activity[] = [
                ...(recentProgramsRes.data?.map((p: any) => ({
                    id: `prog-${p.id}`,
                    type: 'program_start',
                    date: new Date(p.start_date),
                    clientName: Array.isArray(p.client) ? p.client[0]?.full_name : p.client?.full_name,
                    detail: p.program?.name,
                    rawDate: p.start_date
                })) || []),
                ...(recentWorkoutsRes.data?.map((w: any) => ({
                    id: `workout-${w.id}`,
                    type: 'workout_complete',
                    date: new Date(w.date),
                    clientName: Array.isArray(w.client_program?.client) ? w.client_program?.client[0]?.full_name : w.client_program?.client?.full_name,
                    detail: w.client_program?.program?.name,
                    rawDate: w.date
                })) || []),
                ...(recentPaymentsRes.data?.map((p: any) => ({
                    id: `pay-${p.id}`,
                    type: 'payment',
                    date: new Date(p.payment_date),
                    clientName: Array.isArray(p.client) ? p.client[0]?.full_name : p.client?.full_name,
                    detail: `${p.amount} CHF`,
                    rawDate: p.payment_date
                })) || [])
            ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
                .slice(0, 5) as Activity[];

            return {
                stats: {
                    totalClients: clientsRes.count || 0,
                    activePrograms: activeProgramsRes.count || 0,
                    upcomingSessions: upcomingSessionsRes.count || 0,
                    monthlyRevenue: currentMonthRevenue,
                    monthlyGrowth,
                    newClientsThisMonth: newClientsRes.count || 0,
                    avgProgramCompletion,
                },
                recentActivities: activities,
                clientProgress: clientProgressRes.data || [],
                allPayments: payments,
                upcomingAppointments: upcomingSessionsRes.data || [],
                coachCode: coachProfileRes.data?.coach_code || null
            };
        },
        enabled: !!user,
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error
    };
}
