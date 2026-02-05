import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { startOfWeek, endOfWeek, subWeeks, formatISO } from 'date-fns';

export function LivePulseWidget() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        currentWeek: 0,
        previousWeek: 0,
        trend: 0
    });

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const now = new Date();

            // Current Week range (Monday to Sunday)
            const currentStart = startOfWeek(now, { weekStartsOn: 1 });
            const currentEnd = endOfWeek(now, { weekStartsOn: 1 });

            // Previous Week range
            const prevStart = subWeeks(currentStart, 1);
            const prevEnd = subWeeks(currentEnd, 1);

            // Fetch Current Week
            // We use scheduled_date for reliability as per Risk Radar findings
            const { count: currentCount, error: currentError } = await supabase
                .from('scheduled_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', user?.id)
                .eq('status', 'completed')
                .gte('scheduled_date', currentStart.toISOString())
                .lte('scheduled_date', currentEnd.toISOString());

            if (currentError) throw currentError;

            // Fetch Previous Week
            const { count: prevCount, error: prevError } = await supabase
                .from('scheduled_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', user?.id)
                .eq('status', 'completed')
                .gte('scheduled_date', prevStart.toISOString())
                .lte('scheduled_date', prevEnd.toISOString());

            if (prevError) throw prevError;

            const current = currentCount || 0;
            const previous = prevCount || 0;

            // Calculate Trend Percentage
            let trend = 0;
            if (previous > 0) {
                trend = Math.round(((current - previous) / previous) * 100);
            } else if (current > 0) {
                trend = 100; // 100% increase if previous was 0
            }

            setStats({
                currentWeek: current,
                previousWeek: previous,
                trend
            });

        } catch (error) {
            console.error('Error fetching pulse stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="glass-card p-6 h-full flex items-center justify-center animate-pulse">
            <div className="h-6 w-24 bg-white/10 rounded"></div>
        </div>
    );

    const getTrendColor = (trend: number) => {
        if (trend > 0) return 'text-green-400';
        if (trend < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const getTrendIcon = (trend: number) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 ml-1" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 ml-1" />;
        return <Minus className="w-4 h-4 ml-1" />;
    };

    return (
        <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-24 h-24 text-primary-500" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Live Pulse</h3>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-end relative z-10">
                <div className="flex items-end gap-3 mb-1">
                    <span className="text-5xl font-black text-white tracking-tight">
                        {stats.currentWeek}
                    </span>
                    <span className="text-sm font-medium text-gray-400 mb-2">
                        séances
                    </span>
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">
                    Cette semaine
                </p>

                <div className="flex items-center gap-2 py-2 px-3 bg-white/5 rounded-lg w-fit backdrop-blur-sm border border-white/5">
                    <span className={`text-sm font-bold flex items-center ${getTrendColor(stats.trend)}`}>
                        {stats.trend > 0 ? '+' : ''}{stats.trend}%
                        {getTrendIcon(stats.trend)}
                    </span>
                    <span className="text-xs text-gray-400 border-l border-white/10 pl-2 ml-1">
                        vs semaine dernière ({stats.previousWeek})
                    </span>
                </div>
            </div>
        </div>
    );
}
