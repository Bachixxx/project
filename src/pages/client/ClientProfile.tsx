import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Weight, Ruler, Edit, Save, X, Shield, Settings, Bell, LogOut, Camera, ChevronRight } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

function ClientProfile() {
  const { client, signOut } = useClientAuth();
  const navigate = useNavigate();
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [formData, setFormData] = useState({
    phone: '',
    height: '',
    weight: '',
    gender: '',
    date_of_birth: '',
    fitness_goals: [] as string[],
    medical_conditions: [] as string[]
  });

  useEffect(() => {
    if (client) {
      fetchClientDetails();
    }
  }, [client]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client?.id)
        .single();

      if (error) throw error;

      setClientDetails(data);
      setFormData({
        phone: data.phone || '',
        height: data.height || '',
        weight: data.weight || '',
        gender: data.gender || '',
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
        fitness_goals: data.fitness_goals || [],
        medical_conditions: data.medical_conditions || []
      });
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
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

  if (loading && !clientDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 pb-24 md:p-8">
      {/* Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-50">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" stroke="url(#paint0_linear)" strokeWidth="40" strokeOpacity="0.1" />
              <defs>
                <linearGradient id="paint0_linear" x1="100" y1="20" x2="100" y2="180" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl shadow-blue-500/20">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden relative group cursor-pointer">
                {clientDetails?.avatar_url ? (
                  <img src={clientDetails.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white/50" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-2">{clientDetails?.full_name || 'Invité'}</h1>
            <div className="flex flex-col md:flex-row items-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <Mail className="w-4 h-4" />
                <span>{clientDetails?.email}</span>
              </div>
              {clientDetails?.phone && (
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <Phone className="w-4 h-4" />
                  <span>{clientDetails.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing && activeTab === 'profile' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                title="Modifier le profil"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <User className="w-4 h-4" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 gap-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-white">Modifier les informations</h3>
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
                    <label className="text-sm font-medium text-blue-300 ml-1">Téléphone</label>
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
                    <label className="text-sm font-medium text-blue-300 ml-1">Date de naissance</label>
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
                    <label className="text-sm font-medium text-blue-300 ml-1">Taille (cm)</label>
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
                    <label className="text-sm font-medium text-blue-300 ml-1">Poids (kg)</label>
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
                    <label className="text-sm font-medium text-blue-300 ml-1">Genre</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900">Sélectionner</option>
                        <option value="male" className="bg-slate-900">Homme</option>
                        <option value="female" className="bg-slate-900">Femme</option>
                        <option value="other" className="bg-slate-900">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-300 ml-1">Objectifs fitness</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.fitness_goals.join(', ')}
                        onChange={(e) => handleArrayChange('fitness_goals', e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                        placeholder="Perte de poids, Prise de muscle (séparés par des virgules)"
                      />
                      <p className="text-xs text-gray-500 mt-1 ml-1">Séparez vos objectifs par des virgules</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-300 ml-1">Conditions médicales</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.medical_conditions.join(', ')}
                        onChange={(e) => handleArrayChange('medical_conditions', e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                        placeholder="Asthme, mal de dos... (séparés par des virgules)"
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
                    {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
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
                    <h3 className="text-lg font-bold text-white">Informations</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Genre</span>
                      <span className="text-white font-medium">
                        {clientDetails?.gender === 'male' ? 'Homme' :
                          clientDetails?.gender === 'female' ? 'Femme' :
                            clientDetails?.gender === 'other' ? 'Autre' : 'Non renseigné'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Age</span>
                      <span className="text-white font-medium">
                        {clientDetails?.date_of_birth
                          ? `${new Date().getFullYear() - new Date(clientDetails.date_of_birth).getFullYear()} ans`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">Anniversaire</span>
                      <span className="text-white font-medium">
                        {clientDetails?.date_of_birth
                          ? new Date(clientDetails.date_of_birth).toLocaleDateString()
                          : 'Non renseigné'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Card 2 */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                      <Ruler className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Mensurations</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Poids actuel</span>
                      <span className="text-white font-medium">{clientDetails?.weight ? `${clientDetails.weight} kg` : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Taille</span>
                      <span className="text-white font-medium">{clientDetails?.height ? `${clientDetails.height} cm` : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">IMC (Estimé)</span>
                      <span className="text-white font-medium">
                        {clientDetails?.height && clientDetails?.weight
                          ? (clientDetails.weight / Math.pow(clientDetails.height / 100, 2)).toFixed(1)
                          : '--'}
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
                    <h3 className="text-lg font-bold text-white">Santé & Objectifs</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Objectifs</h4>
                      <div className="flex flex-wrap gap-2">
                        {clientDetails?.fitness_goals && clientDetails.fitness_goals.length > 0 ? (
                          clientDetails.fitness_goals.map((goal: string, index: number) => (
                            <span key={index} className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium">
                              {goal}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm italic">Aucun objectif défini</span>
                        )}
                      </div>
                    </div>

                    {clientDetails?.medical_conditions && clientDetails.medical_conditions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conditions Médicales</h4>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Settings Section (Mock for now but consistent styling) */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/5 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Sécurité</h3>
              </div>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <span className="text-gray-300 group-hover:text-white transition-colors">Changer de mot de passe</span>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
              </button>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/5 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Notifications</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2">
                  <span className="text-gray-300 text-sm">Rappels de séance</span>
                  <div className="flex relative items-center gap-2 cursor-pointer">
                    <div className="w-11 h-6 bg-blue-600 rounded-full relative">
                      <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-gray-300 text-sm">Nouveaux programmes</span>
                  <div className="flex relative items-center gap-2 cursor-pointer">
                    <div className="w-11 h-6 bg-blue-600 rounded-full relative">
                      <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ClientProfile;