import React, { useState, useEffect } from 'react';
import { Shield, Users, UserX, Search, AlertTriangle, CheckCircle, Ban, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  specialization: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  subscription_status: string;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
  coach_id: string | null;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  status: string;
  created_at: string;
  coach?: {
    full_name: string;
  };
}

type AccountType = 'coaches' | 'clients';

function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<AccountType>('coaches');
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{ id: string; name: string; type: AccountType } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAccounts();
    }
  }, [isAdmin, selectedTab]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      if (selectedTab === 'coaches') {
        const { data, error } = await supabase
          .from('coaches')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCoaches(data || []);
      } else {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
        }

        if (clientsData) {
          const clientsWithCoach = await Promise.all(
            clientsData.map(async (client) => {
              if (client.coach_id) {
                const { data: coachData } = await supabase
                  .from('coaches')
                  .select('full_name')
                  .eq('id', client.coach_id)
                  .maybeSingle();

                return { ...client, coach: coachData };
              }
              return { ...client, coach: null };
            })
          );

          console.log('Fetched clients:', clientsWithCoach.length);
          setClients(clientsWithCoach);
        } else {
          setClients([]);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleBanClick = (id: string, name: string, type: AccountType) => {
    setSelectedAccount({ id, name, type });
    setBanReason('');
    setShowBanModal(true);
  };

  const handleBan = async () => {
    if (!selectedAccount || !banReason.trim()) {
      alert('Veuillez fournir une raison pour le bannissement');
      return;
    }

    setProcessing(true);
    try {
      const table = selectedAccount.type === 'coaches' ? 'coaches' : 'clients';
      const { error } = await supabase
        .from(table)
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banReason.trim(),
          banned_by: user?.id
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      alert('Compte banni avec succès');
      setShowBanModal(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error banning account:', error);
      alert('Erreur lors du bannissement du compte');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnban = async (id: string, type: AccountType) => {
    if (!confirm('Êtes-vous sûr de vouloir débannir ce compte ?')) {
      return;
    }

    setProcessing(true);
    try {
      const table = type === 'coaches' ? 'coaches' : 'clients';
      const { error } = await supabase
        .from(table)
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
          banned_by: null
        })
        .eq('id', id);

      if (error) throw error;

      alert('Compte débanni avec succès');
      fetchAccounts();
    } catch (error) {
      console.error('Error unbanning account:', error);
      alert('Erreur lors du débannissement du compte');
    } finally {
      setProcessing(false);
    }
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Panneau d'administration</h1>
          </div>
          <p className="text-gray-600">Gérez les comptes et bannissez les utilisateurs problématiques</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('coaches')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  selectedTab === 'coaches'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Users className="w-5 h-5 mr-2" />
                  Coachs ({coaches.length})
                </div>
              </button>
              <button
                onClick={() => setSelectedTab('clients')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  selectedTab === 'clients'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Users className="w-5 h-5 mr-2" />
                  Clients ({clients.length})
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    {selectedTab === 'clients' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coach
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTab === 'coaches' &&
                    filteredCoaches.map((coach) => (
                      <tr key={coach.id} className={coach.is_banned ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{coach.full_name}</div>
                              {coach.specialization && (
                                <div className="text-sm text-gray-500">{coach.specialization}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{coach.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {coach.is_banned ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <UserX className="w-3 h-3 mr-1" />
                                Banni
                              </span>
                              {coach.banned_reason && (
                                <div className="text-xs text-gray-500 mt-1">Raison: {coach.banned_reason}</div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(coach.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {coach.id !== user?.id && (
                            coach.is_banned ? (
                              <button
                                onClick={() => handleUnban(coach.id, 'coaches')}
                                disabled={processing}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                Débannir
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanClick(coach.id, coach.full_name, 'coaches')}
                                disabled={processing}
                                className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Bannir
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  {selectedTab === 'clients' &&
                    filteredClients.map((client) => (
                      <tr key={client.id} className={client.is_banned ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {client.coach?.full_name || 'Aucun coach'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.is_banned ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <UserX className="w-3 h-3 mr-1" />
                                Banni
                              </span>
                              {client.banned_reason && (
                                <div className="text-xs text-gray-500 mt-1">Raison: {client.banned_reason}</div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {client.is_banned ? (
                            <button
                              onClick={() => handleUnban(client.id, 'clients')}
                              disabled={processing}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Unlock className="w-4 h-4 mr-1" />
                              Débannir
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanClick(client.id, client.full_name, 'clients')}
                              disabled={processing}
                              className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Bannir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showBanModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Bannir {selectedAccount.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Cette action empêchera l'utilisateur d'accéder à la plateforme. Veuillez fournir une raison pour le bannissement.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Raison du bannissement..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowBanModal(false)}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBan}
                disabled={processing || !banReason.trim()}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Traitement...' : 'Bannir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
