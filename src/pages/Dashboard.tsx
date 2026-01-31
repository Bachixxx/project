import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n';

function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activePrograms: 0,
    upcomingSessions: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
    newClientsThisMonth: 0,
    avgProgramCompletion: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [clientProgress, setClientProgress] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string, value: number }[]>([]);
  const [timeRange, setTimeRange] = useState<'6months' | 'year'>('6months');
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [coachCode, setCoachCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (allPayments.length > 0) {
      processChartData();
    }
  }, [timeRange, allPayments, language]);

  const processChartData = () => {
    const now = new Date();
    const chartData = [];

    if (timeRange === '6months') {
      // Last 6 months logic
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

        const monthRevenue = allPayments
          .filter(p => {
            const payDate = new Date(p.payment_date);
            return payDate >= monthStart && payDate < monthEnd;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const monthName = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' });
        const formattedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        chartData.push({
          name: formattedName,
          value: monthRevenue
        });
      }
    } else {
      // Current Year logic (Jan to Now)
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const monthsDiff = now.getMonth() - startOfYear.getMonth() + 1;

      for (let i = 0; i < monthsDiff; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

        const monthRevenue = allPayments
          .filter(p => {
            const payDate = new Date(p.payment_date);
            return payDate >= monthStart && payDate < monthEnd;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const monthName = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' });
        const formattedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        chartData.push({
          name: formattedName,
          value: monthRevenue
        });
      }
    }
    setRevenueData(chartData);
  };

  const fetchDashboardData = async () => {
    try {
      // Get total clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id);

      // Get coach profile (for code)
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('coach_code')
        .eq('id', user?.id)
        .single();

      if (coachProfile) {
        setCoachCode(coachProfile.coach_code);
      }

      // Get active programs
      const { count: activePrograms } = await supabase
        .from('client_programs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get upcoming sessions (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingSessionsData, count: upcomingSessionsCount } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          start,
          duration,
          client:clients(full_name),
          type
        `, { count: 'exact' })
        .eq('coach_id', user?.id)
        .gte('start', new Date().toISOString())
        .lte('start', nextWeek.toISOString())
        .eq('status', 'scheduled')
        .order('start', { ascending: true })
        .limit(5);

      if (upcomingSessionsData) {
        setUpcomingAppointments(upcomingSessionsData);
      }

      const upcomingSessions = upcomingSessionsCount; // Keep variable name for stats update below

      // Calculate monthly revenue and growth
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get new clients this month
      const { count: newClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get avg program completion
      const { data: activeProgramsProgress } = await supabase
        .from('client_programs')
        .select('progress')
        .eq('status', 'active');

      const avgProgramCompletion = activeProgramsProgress?.length
        ? Math.round(activeProgramsProgress.reduce((acc, curr) => acc + (curr.progress || 0), 0) / activeProgramsProgress.length)
        : 0;

      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Fetch payments - Get everything from start of year or 6 months ago, whichever is earlier
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const fetchStartDate = startOfYear < sixMonthsAgo ? startOfYear : sixMonthsAgo;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('status', 'paid')
        .gte('payment_date', fetchStartDate.toISOString());

      if (payments) {
        setAllPayments(payments);
      }

      const currentMonthRevenue = payments
        ?.filter(p => new Date(p.payment_date) >= startOfMonth)
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const lastMonthRevenue = payments
        ?.filter(p => {
          const d = new Date(p.payment_date);
          return d >= lastMonthDate && d < startOfMonth;
        })
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const monthlyGrowth = lastMonthRevenue
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      // Get recent activities (Programs, Workouts, Payments)
      const { data: recentPrograms } = await supabase
        .from('client_programs')
        .select(`
          id,
          start_date,
          client:clients(full_name),
          program:programs(name)
        `)
        .order('start_date', { ascending: false })
        .limit(5);

      const { data: recentWorkouts } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          date,
          client_program:client_programs(
            client:clients(full_name),
            program:programs(name)
          )
        `)
        .order('date', { ascending: false })
        .limit(5);

      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          client:clients(full_name)
        `)
        .eq('status', 'paid')
        .order('payment_date', { ascending: false })
        .limit(5);

      // Merge and sort activities
      const activities = [
        ...(recentPrograms?.map((p: any) => ({
          id: `prog-${p.id}`,
          type: 'program_start',
          date: new Date(p.start_date),
          clientName: Array.isArray(p.client) ? p.client[0]?.full_name : p.client?.full_name, // Supabase often returns single object for FKs, but if it was array, we'd handle it.
          // If TS complains about array, we cast p to any.
          detail: p.program?.name,
          rawDate: p.start_date
        })) || []),
        ...(recentWorkouts?.map((w: any) => ({
          id: `workout-${w.id}`,
          type: 'workout_complete',
          date: new Date(w.date),
          clientName: Array.isArray(w.client_program?.client) ? w.client_program?.client[0]?.full_name : w.client_program?.client?.full_name,
          detail: w.client_program?.program?.name,
          rawDate: w.date
        })) || []),
        ...(recentPayments?.map((p: any) => ({
          id: `pay-${p.id}`,
          type: 'payment',
          date: new Date(p.payment_date),
          clientName: Array.isArray(p.client) ? p.client[0]?.full_name : p.client?.full_name,
          detail: `${p.amount} CHF`,
          rawDate: p.payment_date
        })) || [])
      ].sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      // Get client progress
      const { data: clientProgressData } = await supabase
        .from('client_programs')
        .select(`
          id,
          progress,
          client:clients(full_name),
          program:programs(name)
        `)
        .eq('status', 'active')
        .order('progress', { ascending: false })
        .limit(4);

      setStats({
        totalClients: totalClients || 0,
        activePrograms: activePrograms || 0,
        upcomingSessions: upcomingSessions || 0,
        monthlyRevenue: currentMonthRevenue,
        monthlyGrowth,
        newClientsThisMonth: newClientsThisMonth || 0,
        avgProgramCompletion,
      });

      setRecentActivities(activities);
      setClientProgress(clientProgressData || []);
      // Revenue data is set by useEffect via processChartData

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t('nav.dashboard', language)}
          </h1>
          <p className="text-gray-400">
            {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-3 items-center">
            {coachCode && (
              <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl mr-2">
                <span className="text-sm text-gray-400">Code Coach:</span>
                <code className="text-primary-400 font-mono font-bold">{coachCode}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coachCode);
                    // Optional: Add toast here
                  }}
                  className="ml-2 p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                  title="Copier le code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                </button>
              </div>
            )}
            <Link
              to="/clients"
              className="glass-button flex items-center gap-2 hover:bg-primary-500/20 text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Nouveau Client</span>
            </Link>
            <Link
              to="/programs"
              className="primary-button flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer Programme</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.stats.totalClients', language)}
            value={stats.totalClients}
            subValue={`+${stats.newClientsThisMonth} ce mois`}
            icon={Users}
            color="blue"
            trend={stats.newClientsThisMonth > 0 ? stats.newClientsThisMonth : undefined}
          />
          <StatCard
            title={t('dashboard.stats.activePrograms', language)}
            value={stats.activePrograms}
            subValue={`${stats.avgProgramCompletion}% de complétion`}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title={t('dashboard.stats.upcomingSessions', language)}
            value={stats.upcomingSessions}
            subValue="7 prochains jours"
            icon={CalendarIcon}
            color="emerald"
          />
          <StatCard
            title={t('dashboard.stats.monthlyRevenue', language)}
            value={`${stats.monthlyRevenue.toLocaleString()} CHF`}
            subValue="Revenu brut"
            icon={DollarSign}
            color="amber"
            trend={stats.monthlyGrowth}
            isMoney
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Revenue Chart & Progress */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <div className="glass-card p-6 border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Aperçu des Revenus</h3>
                  <p className="text-sm text-gray-400">Évolution mensuelle</p>
                </div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '6months' | 'year')}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="6months">6 derniers mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dx={-10}
                      tickFormatter={(value) => `${value} CHF`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value} CHF`, 'Revenu']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Progress Table */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Progression Clients</h3>
                <Link to="/clients" className="text-sm text-primary-400 hover:text-primary-300">Voir tout</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Programme</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clientProgress.map((item: any) => (
                      <tr key={item.id} className="group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                              {item.client.full_name.charAt(0)}
                            </div>
                            <span className="font-medium text-white group-hover:text-primary-400 transition-colors">
                              {item.client.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-300">{item.program.name}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Actif
                          </span>
                        </td>
                        <td className="py-4 w-1/3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-10 text-right">{item.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Quick Stats */}
          <div className="space-y-8">
            {/* Recent Activity Feed */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Activité Récente</h3>
                <button className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                {recentActivities.map((activity: any, index) => (
                  <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 border-l border-white/10 last:border-0">
                    <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-gray-900 ${activity.type === 'payment' ? 'bg-emerald-500' :
                      activity.type === 'workout_complete' ? 'bg-purple-500' :
                        'bg-primary-500'
                      }`} />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">{activity.clientName || 'Client inconnu'}</span>
                        {activity.type === 'program_start' && <> a commencé le programme <span className="text-primary-400">{activity.detail}</span></>}
                        {activity.type === 'workout_complete' && <> a terminé une séance du programme <span className="text-purple-400">{activity.detail}</span></>}
                        {activity.type === 'payment' && <> a payé <span className="text-emerald-400 font-bold">{activity.detail}</span></>}
                      </p>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions Mini List */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Prochaines Séances</h3>
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4 bg-white/5 rounded-xl border border-white/5">
                    Aucune séance prévue
                  </div>
                ) : (
                  upcomingAppointments.map((session) => {
                    const startDate = new Date(session.start);
                    return (
                      <div key={session.id} className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-800 flex flex-col items-center justify-center border border-white/10">
                            <span className="text-[10px] text-gray-400 uppercase">{startDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold text-white">{startDate.getDate()}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{session.title}</h4>
                            <p className="text-xs text-gray-400">
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.client?.full_name || 'Client inconnu'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
      );
}

      interface StatCardProps {
        title: string;
      value: string | number;
      subValue: string;
      icon: any;
      color: 'blue' | 'purple' | 'emerald' | 'amber';
      trend?: number;
      isMoney?: boolean;
}

      function StatCard({title, value, subValue, icon: Icon, color, trend, isMoney }: StatCardProps) {
  const colors = {
        blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-pink-500',
      emerald: 'from-emerald-500 to-teal-500',
      amber: 'from-amber-500 to-orange-500',
  };

      const bgColors = {
        blue: 'bg-blue-500/10 text-blue-400',
      purple: 'bg-purple-500/10 text-purple-400',
      emerald: 'bg-emerald-500/10 text-emerald-400',
      amber: 'bg-amber-500/10 text-amber-400',
  };

      return (
      <div className="glass-card p-6 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
          <Icon className="w-24 h-24" />
        </div>

        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgColors[color]} ring-1 ring-white/10`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h3>
          <p className="text-xs text-gray-500">{subValue}</p>
        </div>

        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${colors[color]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      );
}

      export default Dashboard;