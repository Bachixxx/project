import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Weight, Ruler, Edit, Save, X, Shield, Settings, Bell, LogOut, ChevronRight } from 'lucide-react';
import { TutorialCard } from '../../components/client/TutorialCard';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { NavRail } from '../../components/client/shared/NavRail';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

import { t } from '../../i18n';

declare global {
  interface Window {
    OneSignal: any;
  }
}

function ClientProfile() {
  const { client, signOut, refreshClient } = useClientAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'profile' | 'settings' || 'profile';

  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);
  const [formData, setFormData] = useState({
    phone: '',
    height: '',
    weight: '',
    gender: '',
    date_of_birth: '',
    fitness_goals: [] as string[],
    medical_conditions: [] as string[]
  });

  // Coach Handover State
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachCode, setCoachCode] = useState('');
  const [changingCoach, setChangingCoach] = useState(false);
  const [coachDetails, setCoachDetails] = useState<any>(null); // To store current coach info


  useEffect(() => {
    if (client) {
      fetchClientDetails();
    }
  }, [client]);

  const fetchClientDetails = async () => {
    try {
      // 1. Try cache first
      const cacheKey = `client_details_${client?.id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setClientDetails(parsed);
          setFormData({
            phone: parsed.phone || '',
            height: parsed.height || '',
            weight: parsed.weight || '',
            gender: parsed.gender || '',
            date_of_birth: parsed.date_of_birth ? new Date(parsed.date_of_birth).toISOString().split('T')[0] : '',
            fitness_goals: parsed.fitness_goals || [],
            medical_conditions: parsed.medical_conditions || []
          });
          // Don't set loading true if cache exists
        } catch (e) {
          console.error("Error parsing client details cache", e);
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client?.id)
        .single();

      if (error) throw error;

      // Update state
      setClientDetails(data);
      // Only update form data if we are NOT editing (to avoid overwriting user input)
      if (!isEditing) {
        setFormData({
          phone: data.phone || '',
          height: data.height || '',
          weight: data.weight || '',
          gender: data.gender || '',
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
          fitness_goals: data.fitness_goals || [],
          medical_conditions: data.medical_conditions || []
        });
      }

      // Update Cache
      localStorage.setItem(cacheKey, JSON.stringify(data));

    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachDetails = async () => {
    if (!clientDetails?.coach_id) return;

    // 1. Try cache first
    const cacheKey = `coach_details_${clientDetails.coach_id}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        setCoachDetails(JSON.parse(cachedData));
      } catch (e) {
        console.error("Error parsing coach details cache", e);
      }
    }

    const { data } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', clientDetails.coach_id)
      .single();

    if (data) {
      setCoachDetails(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (clientDetails?.coach_id) {
      fetchCoachDetails();
    }
  }, [clientDetails]);

  const handleChangeCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachCode.trim()) return;

    if (!confirm("Attention : Changer de coach donnera accès à vos données (programmes, historique, biométrie) à ce nouveau coach. L'ancien coach perdra ses accès. Continuer ?")) {
      return;
    }

    try {
      setChangingCoach(true);
      const { error } = await supabase.rpc('link_client_to_coach', {
        coach_code_input: coachCode
      });

      if (error) throw error;

      alert("Coach modifié avec succès !");
      setShowCoachModal(false);
      setCoachCode('');
      // Refresh data (Global for branding/context and Local for UI)
      await refreshClient();
      await fetchClientDetails();
    } catch (err: any) {
      console.error("Error changing coach:", err);
      alert(err.message || "Erreur lors du changement de coach. Vérifiez le code.");
    } finally {
      setChangingCoach(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: 'fitness_goals' | 'medical_conditions', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { error } = await supabase
        .from('clients')
        .update({
          phone: formData.phone,
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          fitness_goals: formData.fitness_goals,
          medical_conditions: formData.medical_conditions
        })
        .eq('id', client?.id);

      if (error) throw error;

      setIsEditing(false);
      fetchClientDetails();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/client/login');
  };

  const handleDeleteAccount = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      if (confirm("Confirmez-vous la suppression définitive de toutes vos données ?")) {
        try {
          setLoading(true);
          // Call Supabase Edge Function or use RPC if available, for now just signOut and show alert
          // In a real app, this should trigger a cloud function to clean up data
          const { error } = await supabase.rpc('delete_user_account'); // Hypothetical RPC

          if (error) {
            console.error("Delete account error:", error);
            // Fallback if RPC doesn't exist:
            // alert("Veuillez contacter votre coach pour supprimer votre compte définitivement.");

            // Actually, let's just sign out for safety if we can't delete directly from client
            await signOut();
            navigate('/login');
            return;
          }

          await signOut();
          navigate('/login');
        } catch (error) {
          console.error("Error deleting account:", error);
          alert("Une erreur est survenue.");
          setLoading(false);
        }
      }
    }
  };

  if (loading && !clientDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative">
      {/* Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 max-w-5xl mx-auto px-4"
      >

        {/* Premium Profile Hero */}
        <div className="relative w-full pb-20 mb-4">
          {/* Banner with Gradient */}
          <div className="h-[280px] w-full relative overflow-hidden rounded-b-[3rem] shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-[#0f172a]/60 to-[#0f172a] z-10" />
            <img
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
              alt="Profile Cover"
              className="w-full h-full object-cover opacity-60"
            />

            {/* Header Actions */}
            <div className="absolute top-0 right-0 p-6 pt-[calc(env(safe-area-inset-top)+1rem)] z-20 flex gap-2">
              <button
                onClick={handleSignOut}
                className="p-3 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full backdrop-blur-md transition-all"
                title={t('profile.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Floating Avatar & Info */}
          <div className="absolute -bottom-10 left-0 w-full flex flex-col items-center z-20 px-4">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full p-1.5 bg-[#0f172a] shadow-2xl shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden relative group">
                  {clientDetails?.avatar_url ? (
                    <img src={clientDetails.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Edit className="w-8 h-8 text-white" />
                    </button>
                  )}
                </div>
              </div>
              {/* Status Badge */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-[#0f172a] rounded-full"></div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{clientDetails?.full_name || t('profile.guest')}</h1>
              <p className="text-blue-400 font-medium text-sm flex items-center justify-center gap-2">
                <Mail className="w-3 h-3" /> {clientDetails?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Nav Rail */}
        <div className="-mx-4 md:-mx-8 mb-8 sticky top-0 z-40">
          <NavRail
            tabs={[
              { id: 'profile', label: t('profile.title'), icon: User },
              { id: 'settings', label: t('profile.settings'), icon: Settings }
            ]}
            activeTab={activeTab}
            onTabChange={(id: string) => setActiveTab(id as 'profile' | 'settings')}
          />
        </div>

        <TutorialCard
          tutorialId="profile_intro"
          title="Votre Espace Personnel 👤"
          message="Mettez à jour vos informations, gérez votre abonnement et retrouvez les documents partagés par votre coach."
          className="mb-8"
        />

        {/* Content Area */}

        {/* Content Area */}
        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-8 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white">{t('profile.editTitle')}</h3>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-white/5 text-gray-400 p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.phone')}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.birthDate')}</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.height')}</label>
                      <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          step="0.1"
                          placeholder="175"
                          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.weight')}</label>
                      <div className="relative">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          step="0.1"
                          placeholder="70"
                          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.gender')}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-slate-900">{t('profile.genders.select')}</option>
                          <option value="male" className="bg-slate-900">{t('profile.genders.male')}</option>
                          <option value="female" className="bg-slate-900">{t('profile.genders.female')}</option>
                          <option value="other" className="bg-slate-900">{t('profile.genders.other')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.goals')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.fitness_goals.join(', ')}
                          onChange={(e) => handleArrayChange('fitness_goals', e.target.value)}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                          placeholder={t('profile.fields.goalsPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-1 ml-1">{t('profile.fields.goalsHelp')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-300 ml-1">{t('profile.fields.conditions')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.medical_conditions.join(', ')}
                          onChange={(e) => handleArrayChange('medical_conditions', e.target.value)}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                          placeholder={t('profile.fields.conditionsPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/20 transition-all font-semibold flex items-center gap-2 group"
                    >
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {loading ? t('profile.saving') : t('profile.save')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Info Card 1 */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{t('profile.personalInfo')}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{t('profile.fields.gender')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.gender === 'male' ? t('profile.genders.male') :
                            clientDetails?.gender === 'female' ? t('profile.genders.female') :
                              clientDetails?.gender === 'other' ? t('profile.genders.other') : t('profile.genders.none')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{t('profile.fields.age')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.date_of_birth
                            ? `${new Date().getFullYear() - new Date(clientDetails.date_of_birth).getFullYear()} ${t('profile.fields.years')}`
                            : t('profile.empty.na')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400 text-sm">{t('profile.fields.birthday')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.date_of_birth
                            ? new Date(clientDetails.date_of_birth).toLocaleDateString()
                            : t('profile.genders.none')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* My Coach Card */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                        <Shield className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Mon Coach</h3>
                    </div>

                    <div className="space-y-4">
                      {coachDetails ? (
                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                          {coachDetails.profile_image_url ? (
                            <img src={coachDetails.profile_image_url} className="w-12 h-12 rounded-full object-cover" alt="Coach" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                              {coachDetails.full_name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-white">{coachDetails.full_name}</h4>
                            <p className="text-xs text-gray-400">{coachDetails.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm italic">
                          Aucun coach assigné.
                        </div>
                      )}

                      <button
                        onClick={() => setShowCoachModal(true)}
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20"
                      >
                        {coachDetails ? "Changer de coach" : "Ajouter un coach"}
                      </button>
                    </div>
                  </div>

                  {/* Info Card 2 */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                        <Ruler className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{t('profile.measurements')}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{t('profile.fields.currentWeight')}</span>
                        <span className="text-white font-medium">{clientDetails?.weight ? `${clientDetails.weight} kg` : t('profile.empty.data')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{t('profile.fields.height').replace(' (cm)', '')}</span>
                        <span className="text-white font-medium">{clientDetails?.height ? `${clientDetails.height} cm` : t('profile.empty.data')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400 text-sm">{t('profile.fields.bmi')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.height && clientDetails?.weight
                            ? (clientDetails.weight / Math.pow(clientDetails.height / 100, 2)).toFixed(1)
                            : t('profile.empty.data')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Goals Card */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                        <Shield className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{t('profile.healthGoals')}</h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('clients.goals')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {clientDetails?.fitness_goals && clientDetails.fitness_goals.length > 0 ? (
                            clientDetails.fitness_goals.map((goal: string, index: number) => (
                              <span key={index} className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium">
                                {goal}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm italic">{t('profile.empty.goals')}</span>
                          )}
                        </div>
                      </div>

                      {clientDetails?.medical_conditions && clientDetails.medical_conditions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.fields.conditions')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {clientDetails.medical_conditions.map((condition: string, index: number) => (
                              <span key={index} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settings Section (Mock for now but consistent styling) */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('profile.security')}</h3>
                </div>
                <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                  <span className="text-gray-300 group-hover:text-white transition-colors">{t('profile.changePassword')}</span>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
                </button>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('profile.notifications')}</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Activez les notifications pour recevoir des rappels pour vos séances et vos nouveaux programmes.
                  </p>
                  <button
                    onClick={async () => {
                      if (window.OneSignal) {
                        // Check if already subscribed
                        const isPushSupported = window.OneSignal.Notifications.isPushSupported();
                        if (isPushSupported) {
                          // This prompts the native browser permission request 
                          // or the OneSignal Slidedown if configured
                          await window.OneSignal.Notifications.requestPermission();
                          // Also try manual opt-in
                          await window.OneSignal.User.PushSubscription.optIn();
                          alert("Notifications activées !");
                        } else {
                          alert("Les notifications ne sont pas supportées sur ce navigateur.");
                        }
                      } else {
                        alert("Erreur: OneSignal non chargé. Essayez de rafraîchir la page.");
                      }
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Activer les notifications Push
                  </button>


                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-card p-6 rounded-3xl border border-red-500/20 hover:border-red-500/40 transition-all md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('profile.dangerZone')}</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                  <div>
                    <h4 className="font-bold text-white mb-1">{t('profile.deleteAccount')}</h4>
                    <p className="text-sm text-gray-400">Cette action est irréversible. Toutes vos données seront effacées.</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-bold whitespace-nowrap"
                  >
                    {t('profile.deleteAccountAction') || "Supprimer mon compte"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}</AnimatePresence>

      </motion.div>

      {/* Change Coach Modal */}
      {/* Change Coach Drawer */}
      <Drawer.Root open={showCoachModal} onOpenChange={setShowCoachModal} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-[#1e293b] flex flex-col rounded-t-[10px] h-fit max-h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 outline-none">
            <div className="p-4 bg-[#1e293b] rounded-t-[10px] flex-1 pb-10">
              <div aria-hidden className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-600 mb-8" />
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Shield className="w-8 h-8" />
                  </div>
                  <Drawer.Title className="text-2xl font-bold text-white mb-2">Changer de Coach</Drawer.Title>
                  <Drawer.Description className="text-gray-400 text-sm">
                    Entrez le code unique fourni par votre nouveau coach pour rejoindre son équipe.
                  </Drawer.Description>
                </div>

                <form onSubmit={handleChangeCoach} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Code Coach</label>
                    <input
                      type="text"
                      value={coachCode}
                      onChange={(e) => setCoachCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest text-lg uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="CODE-1234"
                      required
                    />
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200/80">
                    <p className="flex gap-2">
                      <span className="shrink-0">⚠️</span>
                      <span>
                        En changeant de coach, vous donnez accès à votre historique et vos programmes en cours à votre nouveau coach.
                      </span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={changingCoach || !coachCode}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingCoach ? "Vérification..." : "Confirmer le changement"}
                  </button>
                </form>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </motion.div>
  );
}

export default ClientProfile;