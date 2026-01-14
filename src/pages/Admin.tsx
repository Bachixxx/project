import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserX,
  Search,
  AlertTriangle,
  CheckCircle,
  Ban,
  Unlock,
  Clock,
  Mail,
  Copy,
  List,
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty_level: string;
  description: string;
  video_url?: string;
  created_at: string;
}

type AccountType = 'coaches' | 'clients' | 'waitlist' | 'exercises';

function Admin() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', dateFormatOptions);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      ...dateFormatOptions,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<AccountType>('coaches');
  const [showBanModal, setShowBanModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Selection / Editing State
  const [selectedAccount, setSelectedAccount] = useState<{ id: string; name: string; type: AccountType } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'strength',
    difficulty_level: 'intermediate',
    description: '',
    video_url: ''
  });

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
      } else if (selectedTab === 'clients') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select(`
            *,
            coach:coaches (
              full_name
            )
          `)
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;

        const processedClients = (clientsData || []).map((client: any) => ({
          ...client,
          coach: Array.isArray(client.coach) ? client.coach[0] : client.coach
        }));

        setClients(processedClients);
      } else if (selectedTab === 'waitlist') {
        const { data, error } = await supabase
          .from('waitlist')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWaitlistEntries(data || []);
      } else if (selectedTab === 'exercises') {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .is('coach_id', null)
          .order('name', { ascending: true });

        if (error) throw error;
        setExercises(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Email copié !');
  };

  /* Exercise Handlers */
  const openNewExerciseModal = () => {
    setEditingExercise(null);
    setExerciseForm({
      name: '',
      category: 'strength',
      difficulty_level: 'intermediate',
      description: '',
      video_url: ''
    });
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      category: exercise.category,
      difficulty_level: exercise.difficulty_level || 'intermediate',
      description: exercise.description || '',
      video_url: exercise.video_url || ''
    });
    setShowExerciseModal(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseForm.name) {
      alert('Le nom est requis');
      return;
    }

    setProcessing(true);
    try {
      const exerciseData = {
        ...exerciseForm,
        coach_id: null // System exercise
      };

      if (editingExercise) {
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', editingExercise.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([exerciseData]);
        if (error) throw error;
      }

      alert('Exercice sauvegardé');
      setShowExerciseModal(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Erreur lors de la suppression');
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

  const filteredWaitlist = waitlistEntries.filter(entry =>
    entry.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 glass-card max-w-md w-full">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in text-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold">Administration</h1>
          </div>
          <p className="text-gray-400">Gérez les utilisateurs, la file d'attente et le contenu global</p>
        </div>

        {selectedTab === 'exercises' ? (
          <button
            onClick={openNewExerciseModal}
            className="primary-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Exercice Système
          </button>
        ) : (
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <List className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">File d'attente:</span>
            <span className="text-lg font-bold text-white">{waitlistEntries.length}</span>
          </div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('coaches')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${selectedTab === 'coaches'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                Coachs ({coaches.length})
              </div>
              {selectedTab === 'coaches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
            </button>
            <button
              onClick={() => setSelectedTab('clients')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${selectedTab === 'clients'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                Clients ({clients.length})
              </div>
              {selectedTab === 'clients' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
            </button>
            <button
              onClick={() => setSelectedTab('waitlist')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${selectedTab === 'waitlist'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />
                File d'attente ({waitlistEntries.length})
              </div>
              {selectedTab === 'waitlist' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
            </button>
            <button
              onClick={() => setSelectedTab('exercises')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${selectedTab === 'exercises'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center justify-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                Exercices ({exercises.length})
              </div>
              {selectedTab === 'exercises' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  {selectedTab === 'exercises' ? (
                    <>
                      <th className="pb-4 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulté</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </>
                  ) : selectedTab === 'waitlist' ? (
                    <>
                      <th className="pb-4 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date d'inscription</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="pb-4 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Utilisateur</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      {selectedTab === 'clients' && <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Coach</th>}
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Depuis le</th>
                      <th className="pb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedTab === 'coaches' && filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white mr-3">
                          {coach.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{coach.full_name}</div>
                          {coach.specialization && <div className="text-xs text-gray-500">{coach.specialization}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300 text-sm">{coach.email}</td>
                    <td className="py-4">
                      {coach.is_banned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Banni</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Actif</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-400 text-sm">{formatDate(coach.created_at)}</td>
                    <td className="py-4">
                      {coach.id !== user?.id && (
                        coach.is_banned ? (
                          <button onClick={() => handleUnban(coach.id, 'coaches')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Unlock className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => handleBanClick(coach.id, coach.full_name, 'coaches')} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"><Ban className="w-4 h-4" /></button>
                        )
                      )}
                    </td>
                  </tr>
                ))}

                {selectedTab === 'exercises' && filteredExercises.map((ex) => (
                  <tr key={ex.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4 font-medium text-white">{ex.name}</td>
                    <td className="py-4 text-gray-300 text-sm capitalize">{ex.category}</td>
                    <td className="py-4 text-gray-300 text-sm capitalize">{ex.difficulty_level}</td>
                    <td className="py-4 flex gap-2">
                      <button onClick={() => openEditExerciseModal(ex)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExercise(ex.id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}

                {selectedTab === 'clients' && filteredClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white mr-3">
                          {client.full_name.charAt(0)}
                        </div>
                        <div className="font-medium text-white">{client.full_name}</div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300 text-sm">{client.email}</td>
                    <td className="py-4 text-gray-400 text-sm">{client.coach?.full_name || '-'}</td>
                    <td className="py-4">
                      {client.is_banned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Banni</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Actif</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-400 text-sm">{formatDate(client.created_at)}</td>
                    <td className="py-4">
                      {client.is_banned ? (
                        <button onClick={() => handleUnban(client.id, 'clients')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Unlock className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => handleBanClick(client.id, client.full_name, 'clients')} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"><Ban className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}

                {selectedTab === 'waitlist' && filteredWaitlist.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center text-gray-300">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        {entry.email}
                      </div>
                    </td>
                    <td className="py-4 text-gray-400 text-sm">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => copyToClipboard(entry.email)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary-400 transition-colors"
                        title="Copier l'email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border border-white/10">
            <div className="flex items-center mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-medium text-white">
                Bannir {selectedAccount.name}
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Cette action empêchera l'utilisateur d'accéder à la plateforme.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Raison du bannissement..."
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowBanModal(false)}
                disabled={processing}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBan}
                disabled={processing || !banReason.trim()}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {processing ? 'Traitement...' : 'Confirmer le bannissement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingExercise ? 'Modifier l\'exercice' : 'Nouvel Exercice Système'}
              </h3>
              <button onClick={() => setShowExerciseModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={exerciseForm.name}
                  onChange={e => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
                  <select
                    value={exerciseForm.category}
                    onChange={e => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="strength">Musculation</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Souplesse</option>
                    <option value="hiit">HIIT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Difficulté</label>
                  <select
                    value={exerciseForm.difficulty_level}
                    onChange={e => setExerciseForm({ ...exerciseForm, difficulty_level: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={exerciseForm.description}
                  onChange={e => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vidéo URL (Optionnel)</label>
                <input
                  type="text"
                  value={exerciseForm.video_url}
                  onChange={e => setExerciseForm({ ...exerciseForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowExerciseModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveExercise}
                disabled={processing}
                className="primary-button flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
