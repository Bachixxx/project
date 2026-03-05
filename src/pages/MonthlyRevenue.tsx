import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RevenueStats {
  totalRevenue: number;
  monthlyGrowth: number;
  activeClients: number;
  averageRevenue: number;
  pendingPayments: number;
  paidPayments: number;
}

interface Transaction {
  id: string;
  date: string;
  client_name: string;
  program_name: string;
  amount: number;
  status: 'pending' | 'paid';
}

function MonthlyRevenue() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeClients: 0,
    averageRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRevenueData();
    }
  }, [user]);

  const fetchRevenueData = async () => {
    try {
      setError(null);
      // Get current month's start and end dates
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch appointments with payments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start,
          title,
          price,
          type,
          current_participants,
          client:clients(full_name),
          payment:payments(status)
        `)
        .gte('start', startOfMonth.toISOString())
        .order('start', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Transform appointments data
      const transformedTransactions = appointmentsData.map(t => ({
        id: t.id,
        date: t.start,
        client_name: t.client?.full_name || 'Cours collectif',
        program_name: t.title,
        amount: t.type === 'group' ? (t.price || 0) * (t.current_participants || 0) : (t.price || 0),
        status: t.payment?.[0]?.status || 'pending',
      }));

      setTransactions(transformedTransactions);

      // Calculate total revenue and payment stats
      const paidPayments = transformedTransactions.filter(t => t.status === 'paid');
      const pendingPayments = transformedTransactions.filter(t => t.status === 'pending');

      const totalRevenue = paidPayments.reduce((sum, t) => sum + t.amount, 0);
      const totalPending = pendingPayments.reduce((sum, t) => sum + t.amount, 0);

      // Fetch last month's revenue for comparison
      const lastMonth = new Date(startOfMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('appointments')
        .select(`
          price,
          type,
          current_participants,
          payments(status)
        `)
        .gte('start', lastMonth.toISOString())
        .lt('start', startOfMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const lastMonthRevenue = lastMonthData
        .filter(t => t.payments?.[0]?.status === 'paid')
        .reduce((sum, t) => {
          const amount = t.type === 'group' ? (t.price || 0) * (t.current_participants || 0) : (t.price || 0);
          return sum + amount;
        }, 0);

      const monthlyGrowth = lastMonthRevenue ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Fetch active clients count
      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id)
        .eq('status', 'active');

      // Generate chart data for the last 12 months
      const chartData = await generateChartData();

      setStats({
        totalRevenue,
        monthlyGrowth,
        activeClients: activeClients || 0,
        averageRevenue: activeClients ? totalRevenue / activeClients : 0,
        pendingPayments: totalPending,
        paidPayments: totalRevenue,
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError('Une erreur est survenue lors de la récupération des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    const months = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data } = await supabase
        .from('appointments')
        .select(`
          price,
          type,
          current_participants,
          payments(status)
        `)
        .gte('start', date.toISOString())
        .lt('start', endDate.toISOString());

      const revenue = data
        ?.filter(t => t.payments?.[0]?.status === 'paid')
        .reduce((sum, t) => {
          const amount = t.type === 'group' ? (t.price || 0) * (t.current_participants || 0) : (t.price || 0);
          return sum + amount;
        }, 0) || 0;

      months.push({
        name: date.toLocaleString('fr-FR', { month: 'short' }),
        revenue,
      });
    }

    return months;
  };

  const paymentStatusData = [
    { name: 'Payé', value: stats.paidPayments },
    { name: 'En attente', value: stats.pendingPayments },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-2 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Revenus Mensuels
          </h1>
          <p className="text-gray-400">
            Aperçu financier détaillé et suivi des paiements
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-24 h-24" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl ring-1 ring-white/10">
              <DollarSign className="w-6 h-6" />
            </div>
            {stats.monthlyGrowth !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stats.monthlyGrowth >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {stats.monthlyGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(Math.round(stats.monthlyGrowth))}%
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Revenu total (mois)</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{stats.totalRevenue.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF</h3>
            <p className="text-xs text-gray-500">Paiements validés</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Pending Payments */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl ring-1 ring-white/10">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">En attente</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{stats.pendingPayments.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF</h3>
            <p className="text-xs text-gray-500">Paiements non validés</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Active Clients */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl ring-1 ring-white/10">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Clients actifs (payants)</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{stats.activeClients}</h3>
            <p className="text-xs text-gray-500">Ayant généré du revenu</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Average Revenue */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-24 h-24" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl ring-1 ring-white/10">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Revenu moyen</p>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{stats.averageRevenue.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF</h3>
            <p className="text-xs text-gray-500">Par client actif</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Revenue Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Tendance des Revenus</h3>
              <p className="text-sm text-gray-400">Évolution sur les 12 derniers mois</p>
            </div>
          </div>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueGraph" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(val) => `${val} CHF`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#10b981', fontWeight: 600 }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                  cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                  formatter={(value: number) => [`${value} CHF`, 'Chiffre d\'affaires']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenueGraph)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Distribution & Recent */}
        <div className="space-y-8">

          {/* Payment Status Pie */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Répartition</h3>
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value} CHF`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-xl font-bold text-white">{(stats.paidPayments + stats.pendingPayments).toLocaleString('fr-CH', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-sm text-gray-300 font-medium">Validé</span>
                </div>
                <span className="text-sm font-bold text-white">{stats.paidPayments.toLocaleString('fr-CH')} CHF</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="text-sm text-gray-300 font-medium">En attente</span>
                </div>
                <span className="text-sm font-bold text-white">{stats.pendingPayments.toLocaleString('fr-CH')} CHF</span>
              </div>
            </div>
          </div>

        </div>

        {/* Full Width Transactions Table */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Transactions du mois en cours</h3>
              <p className="text-sm text-gray-400">Basé sur les séances planifiées</p>
            </div>
            <Link to="/payments" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Tous les paiements <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Programme / Info</th>
                  <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Montant</th>
                  <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      Aucune transaction pour le moment ce mois-ci.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const tDate = new Date(transaction.date);
                    return (
                      <tr key={transaction.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2">
                          <span className="text-sm text-gray-300">
                            {tDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                              {transaction.client_name.charAt(0)}
                            </div>
                            <span className="font-medium text-white group-hover:text-primary-400 transition-colors">
                              {transaction.client_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-400">{transaction.program_name}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-sm font-bold text-white">
                            {transaction.amount.toLocaleString('fr-CH', { minimumFractionDigits: 0 })} CHF
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${transaction.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                            {transaction.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MonthlyRevenue;