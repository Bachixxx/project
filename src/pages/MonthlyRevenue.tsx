import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, DollarSign, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

  const COLORS = ['#22c55e', '#eab308'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Revenus mensuels</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className={`flex items-center text-sm ${stats.monthlyGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {stats.monthlyGrowth.toFixed(1)}% vs mois dernier
              </span>
            </div>
            <h3 className="text-sm text-white/80 mb-1">Revenu total</h3>
            <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} CHF</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-sm text-white/80 mb-1">Paiements en attente</h3>
            <p className="text-2xl font-bold">{stats.pendingPayments.toFixed(2)} CHF</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-sm text-white/80 mb-1">Clients actifs</h3>
            <p className="text-2xl font-bold">{stats.activeClients}</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-sm text-white/80 mb-1">Revenu moyen par client</h3>
            <p className="text-2xl font-bold">{stats.averageRevenue.toFixed(2)} CHF</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Tendance des revenus</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                    }}
                  />
                  <Bar dataKey="revenue" fill="rgba(59, 130, 246, 0.8)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">État des paiements</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(2)} CHF`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-white/80">Payé</span>
                </div>
                <span className="text-white font-medium">{stats.paidPayments.toFixed(2)} CHF</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-white/80">En attente</span>
                </div>
                <span className="text-white font-medium">{stats.pendingPayments.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Transactions récentes</h2>
              <Link
                to="/payments"
                className="text-white/80 hover:text-white text-sm"
              >
                Voir tout
              </Link>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">{transaction.client_name}</p>
                    <p className="text-sm text-white/60">{transaction.program_name}</p>
                    <p className="text-xs text-white/40">
                      {new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{transaction.amount} CHF</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'paid'
                        ? 'bg-green-500/20 text-green-100'
                        : 'bg-yellow-500/20 text-yellow-100'
                    }`}>
                      {transaction.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyRevenue;