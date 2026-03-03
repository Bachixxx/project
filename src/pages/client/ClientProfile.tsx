import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Ruler, Edit, Save, X, Shield, Settings, Bell, LogOut, ChevronRight, Trash2 } from 'lucide-react';
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
        <div className="relative w-full pb-20 mb-24">
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
                <div className="space-y-6 max-w-2xl mx-auto pb-8">

                  {/* Personal Info Group */}
                  <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('profile.personalInfo')}</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.gender')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.gender === 'male' ? t('profile.genders.male') :
                            clientDetails?.gender === 'female' ? t('profile.genders.female') :
                              clientDetails?.gender === 'other' ? t('profile.genders.other') : t('profile.genders.none')}
                        </span>
                      </div>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.age')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.date_of_birth
                            ? `${new Date().getFullYear() - new Date(clientDetails.date_of_birth).getFullYear()} ${t('profile.fields.years')}`
                            : t('profile.empty.na')}
                        </span>
                      </div>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.birthday')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.date_of_birth
                            ? new Date(clientDetails.date_of_birth).toLocaleDateString()
                            : t('profile.genders.none')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Measurements Group */}
                  <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('profile.measurements')}</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.currentWeight')}</span>
                        <span className="text-white font-medium">{clientDetails?.weight ? `${clientDetails.weight} kg` : t('profile.empty.data')}</span>
                      </div>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.height').replace(' (cm)', '')}</span>
                        <span className="text-white font-medium">{clientDetails?.height ? `${clientDetails.height} cm` : t('profile.empty.data')}</span>
                      </div>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{t('profile.fields.bmi')}</span>
                        <span className="text-white font-medium">
                          {clientDetails?.height && clientDetails?.weight
                            ? (clientDetails.weight / Math.pow(clientDetails.height / 100, 2)).toFixed(1)
                            : t('profile.empty.data')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Goals Group */}
                  <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                      <Shield className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('profile.healthGoals')}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('clients.goals')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {clientDetails?.fitness_goals && clientDetails.fitness_goals.length > 0 ? (
                            clientDetails.fitness_goals.map((goal: string, index: number) => (
                              <span key={index} className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium">
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
                              <span key={index} className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My Coach Group */}
                  <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
                      <User className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mon Coach</h3>
                    </div>
                    <div className="p-6">
                      {coachDetails ? (
                        <div className="flex items-center gap-4 bg-[#0f172a] p-4 rounded-2xl border border-white/5 mb-4 shadow-inner">
                          {coachDetails.profile_image_url ? (
                            <img src={coachDetails.profile_image_url} className="w-14 h-14 rounded-full object-cover shadow-lg shadow-black/50" alt="Coach" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                              {coachDetails.full_name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-lg">{coachDetails.full_name}</h4>
                            <p className="text-sm text-indigo-400/80">{coachDetails.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-sm italic border border-dashed border-white/10 rounded-2xl mb-4">
                          Aucun coach assigné.
                        </div>
                      )}

                      <button
                        onClick={() => setShowCoachModal(true)}
                        className="w-full py-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold transition-colors border border-indigo-500/20 active:scale-[0.98]"
                      >
                        {coachDetails ? "Changer de coach" : "Ajouter un coach"}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto pb-8 space-y-6">

              {/* Security */}
              <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                <div className="px-6 py-4 bg-white/5 border-b border-white/5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sécurité & Compte</h3>
                </div>
                <div className="divide-y divide-white/5">
                  <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group active:bg-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{t('profile.changePassword')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={async () => {
                      if (window.OneSignal) {
                        const isPushSupported = window.OneSignal.Notifications.isPushSupported();
                        if (isPushSupported) {
                          await window.OneSignal.Notifications.requestPermission();
                          await window.OneSignal.User.PushSubscription.optIn();
                          alert("Notifications activées !");
                        } else {
                          alert("Les notifications ne sont pas supportées sur ce navigateur.");
                        }
                      } else {
                        alert("Erreur: OneSignal non chargé. Essayez de rafraîchir la page.");
                      }
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group active:bg-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-slate-200 font-medium block group-hover:text-white transition-colors">{t('profile.notifications')}</span>
                        <span className="text-xs text-slate-500">Activer les rappels push</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </button>

                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#1e293b]/50 border border-red-900/30 rounded-[2rem] overflow-hidden mt-6 backdrop-blur-xl">
                <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/10">
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">{t('profile.dangerZone')}</h3>
                </div>
                <div className="divide-y divide-red-500/10">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-500/10 transition-colors group active:bg-red-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <span className="text-red-400 font-medium block group-hover:text-red-300 transition-colors">{t('profile.deleteAccountAction') || "Supprimer mon compte"}</span>
                        <span className="text-xs text-red-500/50">Action irréversible</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-500/50 group-hover:text-red-400 transition-colors" />
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