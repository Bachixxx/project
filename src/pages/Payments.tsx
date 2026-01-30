import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Check, X, DollarSign, Calendar, User, Clock, Users, Plus, Minus, Download, TrendingUp, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateMonthlyIncomeReport } from '../utils/pdfGenerator';

interface Payment {
  id: string;
  appointment_id: string | null;
  client_id: string | null;
  amount: number;
  status: 'pending' | 'paid';
  payment_method: 'cash' | 'transfer' | 'online';
  payment_date: string | null;
  notes: string;
  created_at: string;
  appointment?: {
    title: string;
    start: string;
    type: 'private' | 'group';
    max_participants: number;
    current_participants: number;
  };
  client: {
    full_name: string;
    email: string;
  } | null;
}

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [coachInfo, setCoachInfo] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchCoachInfo();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments(
            title, 
            start,
            type,
            max_participants,
            current_participants
          ),
          client:clients(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('full_name, email, phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setCoachInfo(data);
    } catch (error) {
      console.error('Error fetching coach info:', error);
    }
  };

  const handleStatusChange = async (paymentId: string, status: 'pending' | 'paid') => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          payment_date: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', paymentId);

      if (error) throw error;
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const searchTarget = (
      payment.client?.full_name ||
      payment.appointment?.title ||
      payment.notes ||
      'Paiement Terminal'
    ).toLowerCase();

    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateGroupRevenue = (payment: Payment) => {
    if (payment.appointment?.type === 'group') {
      return payment.amount * payment.appointment.current_participants;
    }
    return payment.amount;
  };

  const handleDownloadPDF = () => {
    if (!coachInfo) {
      alert('Impossible de générer le PDF. Informations du coach manquantes.');
      return;
    }

    const currentDate = new Date();
    const month = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
    const year = currentDate.getFullYear().toString();

    // Transform payments data for PDF
    const pdfPayments = filteredPayments.map(payment => ({
      id: payment.id,
      date: payment.appointment?.start || payment.payment_date || payment.created_at,
      client_name: payment.client?.full_name || (payment.appointment ? payment.appointment.title : 'Client Terminal'),
      program_name: payment.appointment?.title || payment.notes || 'Paiement sans contact',
      amount: calculateGroupRevenue(payment),
      status: payment.status
    }));

    generateMonthlyIncomeReport(pdfPayments, coachInfo, month, year);
  };

  // Stats calculation
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + calculateGroupRevenue(curr), 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending')
    .reduce((acc, curr) => acc + calculateGroupRevenue(curr), 0);

  const totalTransactions = payments.length;

  return (
    <div className="p-6 max-w-[2000px] mx-auto animate-fade-in min-h-screen">

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-1 mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Suivi des Paiements</h1>
          <p className="text-gray-400">Gérez vos revenus et suivez l'état des paiements clients.</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Rapport Mensuel (PDF)</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-green-400" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Revenu Total (Encaissé)
            </p>
            <h3 className="text-3xl font-bold text-white">{totalRevenue.toFixed(2)} <span className="text-lg text-gray-500 font-normal">CHF</span></h3>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-24 h-24 text-yellow-400" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> En Attente
            </p>
            <h3 className="text-3xl font-bold text-yellow-500">{pendingRevenue.toFixed(2)} <span className="text-lg text-yellow-500/50 font-normal">CHF</span></h3>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24 text-blue-400" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Transactions
            </p>
            <h3 className="text-3xl font-bold text-white">{totalTransactions}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client, une séance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full md:w-[200px] appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-800">Tous les statuts</option>
            <option value="pending" className="bg-gray-800">En attente</option>
            <option value="paid" className="bg-gray-800">Payé</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-white/5 transition-colors group">
                {/* Icon & Basic Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${payment.status === 'paid' ? 'bg-green-500/20 text-green-400 shadow-green-500/10' : 'bg-yellow-500/20 text-yellow-400 shadow-yellow-500/10'
                    }`}>
                    {payment.payment_method === 'online' ? (
                      <CreditCard className="w-6 h-6" />
                    ) : payment.status === 'paid' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">
                      {payment.appointment
                        ? (payment.appointment?.type === 'private'
                          ? (payment.client?.full_name || 'Client Inconnu')
                          : payment.appointment?.title || 'Séance inconnue')
                        : (payment.notes || 'Paiement Terminal')
                      }
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(payment.appointment?.start || payment.payment_date || payment.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {payment.appointment
                          ? (payment.appointment.type === 'private' ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />)
                          : <Smartphone className="w-3.5 h-3.5" />
                        }
                        {payment.appointment
                          ? (payment.appointment.type === 'private' ? 'Privé' : `Groupe (${payment.appointment.current_participants}/${payment.appointment.max_participants})`)
                          : 'Terminal'
                        }
                      </span>
                      {payment.payment_method === 'online' && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs border border-blue-500/20">
                            Stripe
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="flex flex-col items-start md:items-end gap-1 min-w-[150px]">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {calculateGroupRevenue(payment).toFixed(2)} <span className="text-sm text-gray-500 font-normal">CHF</span>
                  </span>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${payment.status === 'paid'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                    {payment.status === 'paid' ? 'Payé' : 'En attente'}
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto flex justify-end">
                  {payment.payment_method === 'online' && payment.status === 'paid' ? (
                    <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-sm font-medium flex items-center gap-2 cursor-not-allowed opacity-50">
                      <Check className="w-4 h-4" /> Payé en ligne
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(
                        payment.id,
                        payment.status === 'pending' ? 'paid' : 'pending'
                      )}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors w-full md:w-auto justify-center ${payment.status === 'pending'
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                    >
                      {payment.status === 'pending' ? (
                        <>
                          <Check className="w-4 h-4" /> Marquer payé
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" /> Annuler paiement
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 glass-card">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Aucun paiement trouvé</h3>
              <p className="text-gray-400">Aucune transaction ne correspond à vos critères de recherche.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icon component needed for stats card
function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default PaymentsPage;