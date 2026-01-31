import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Target,
  Calendar,
  X,
  ChevronRight,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionAlert } from '../components/SubscriptionAlert';
import { UpgradeModal } from '../components/UpgradeModal';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  height: number;
  weight: number;
  fitness_goals: string[];
  medical_conditions: string[];
  notes: string;
  status: string;
  created_at: string;
}

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user } = useAuth();
  const { subscriptionInfo, upgradeSubscription } = useSubscription();

  const [coachCode, setCoachCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchCoachCode();
    }
  }, [user]);

  const fetchCoachCode = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('coach_code')
        .eq('id', user?.id)
        .single();

      if (data) setCoachCode(data.coach_code);
    } catch (error) {
      console.error('Error fetching coach code:', error);
    }
  };

  const handleShareInvite = async () => {
    if (!coachCode) return;

    const inviteUrl = `${window.location.origin}/client/register?code=${coachCode}`;
    const shareData = {
      title: 'Rejoins-moi sur Coachency',
      text: `Salut ! Crée ton compte client sur Coachency avec mon code ${coachCode} pour que je puisse te suivre :`,
      url: inviteUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        alert('Lien d\'invitation copié dans le presse-papier !');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user?.id)
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalClients = clients.length;

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('clients.title')}</h1>
          <p className="text-gray-400">
            {totalClients} Total Clients • {activeClients} Active
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShareInvite}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
            title="Inviter un client"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">Inviter</span>
          </button>
          <button
            onClick={() => {
              if (!subscriptionInfo?.canAddClient) {
                setIsUpgradeModalOpen(true);
                return;
              }
              setSelectedClient(null);
              setIsModalOpen(true);
            }}
            className="primary-button flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t('clients.addClient')}</span>
          </button>
        </div>
      </div>

      <SubscriptionAlert />

      {/* Search and Filter Section */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('clients.searchClients')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="sm:w-64">
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 appearance-none cursor-pointer"
            >
              <option value="">{t('common.all')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
              <option value="pending">{t('common.pending')}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="glass-card p-6 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-primary-400" />
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {client.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-white truncate pr-4">
                    {client.full_name}
                  </h3>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${client.status === 'active'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : client.status === 'inactive'
                      ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-primary-500" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-primary-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>Joined {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="flex flex-wrap gap-2">
                  {client.fitness_goals?.slice(0, 3).map((goal, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/5"
                    >
                      <Target className="w-3 h-3 mr-1 text-primary-400" />
                      {goal}
                    </span>
                  ))}
                  {client.fitness_goals?.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/5">
                      +{client.fitness_goals.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}

      {isUpgradeModalOpen && (
        <UpgradeModal
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgrade={async () => {
            try {
              await upgradeSubscription();
              setIsUpgradeModalOpen(false);
              setIsModalOpen(true);
            } catch (error) {
              console.error('Error upgrading subscription:', error);
              alert('Failed to upgrade subscription. Please try again.');
            }
          }}
        />
      )}

      {isModalOpen && (
        <ClientModal
          client={selectedClient}
          onClose={() => setIsModalOpen(false)}
          onSave={async (clientData: any) => {
            try {
              // Sanitize numeric fields
              const sanitizedData = {
                ...clientData,
                height: clientData.height === '' ? null : parseFloat(clientData.height),
                weight: clientData.weight === '' ? null : parseFloat(clientData.weight),
              };

              if (selectedClient) {
                const { error } = await supabase
                  .from('clients')
                  .update(sanitizedData)
                  .eq('id', selectedClient.id);

                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from('clients')
                  .insert([{ ...sanitizedData, coach_id: user?.id }]);

                if (error) throw error;
              }

              fetchClients();
              setIsModalOpen(false);
            } catch (error: any) {
              console.error('Error saving client:', error);
              alert(error.message || 'Une erreur est survenue lors de la création du client');
            }
          }}
        />
      )}
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    full_name: client?.full_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    date_of_birth: client?.date_of_birth || '',
    gender: client?.gender || 'male',
    height: client?.height || '',
    weight: client?.weight || '',
    fitness_goals: client?.fitness_goals || [],
    medical_conditions: client?.medical_conditions || [],
    notes: client?.notes || '',
    status: client?.status || 'active',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {client ? t('common.edit') : t('clients.addClient')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.fullName')}</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={!!client}
                  className="input-field disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.phone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.dateOfBirth')}</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.gender.label')}</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="male" className="bg-gray-800">{t('clients.form.gender.male')}</option>
                  <option value="female" className="bg-gray-800">{t('clients.form.gender.female')}</option>
                  <option value="other" className="bg-gray-800">{t('clients.form.gender.other')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.height')}</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  step="0.1"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('clients.form.weight')}</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.1"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('clients.form.fitnessGoals')}
              </label>
              <input
                type="text"
                value={formData.fitness_goals ? formData.fitness_goals.join(', ') : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    fitness_goals: value.split(',').filter((i: string) => i.trim())
                  }));
                }}
                placeholder="e.g., Weight Loss, Muscle Gain, Flexibility"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('clients.form.medicalConditions')}
              </label>
              <input
                type="text"
                value={formData.medical_conditions ? formData.medical_conditions.join(', ') : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    medical_conditions: value.split(',').filter((i: string) => i.trim())
                  }));
                }}
                placeholder="e.g., Asthma, Back Pain, None"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.notes')}</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.status')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="active" className="bg-gray-800">{t('common.active')}</option>
                <option value="inactive" className="bg-gray-800">{t('common.inactive')}</option>
                <option value="pending" className="bg-gray-800">{t('common.pending')}</option>
              </select>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="primary-button"
              >
                {t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientsPage;