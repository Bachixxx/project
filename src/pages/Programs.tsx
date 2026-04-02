import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  DollarSign,
  Layers,
  Dumbbell,
  Clock,
  Target,
  Globe,
  UserPlus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCoachPrograms, Program, ProgramSession, Session } from '../hooks/useCoachPrograms';
import { ShareProgramModal } from '../components/ShareProgramModal';
import { ResponsiveModal } from '../components/ResponsiveModal';

// --- Main Page Component ---

function ProgramsPage() {
  // const { subscriptionInfo } = useSubscription();
  const {
    programs,
    isLoading: loading,
    error: queryError,
    saveProgram,
    deleteProgram
  } = useCoachPrograms();

  // const [programs, setPrograms] = useState<Program[]>([]); // Removed, using hook
  // const [loading, setLoading] = useState(true); // Removed, using hook
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [sharingProgram, setSharingProgram] = useState<Program | null>(null);

  // useEffect for fetching removed, hook handles it.

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Programmes</h1>
          <p className="text-gray-400">
            {programs.length} Programmes Created
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedProgram(null);
            setIsModalOpen(true);
          }}
          className="primary-button flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Créer un programme</span>
        </button>
      </div>



      {(error || queryError) && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-500/5 text-white">
          {error || (queryError as Error)?.message}
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-card p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des programmes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="glass-card p-6 group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{program.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock className="w-3 h-3 mr-1" />
                      {program.duration_weeks} sem
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${program.difficulty_level === 'Débutant'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : program.difficulty_level === 'Intermédiaire'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      <Target className="w-3 h-3 mr-1" />
                      {program.difficulty_level}
                    </span>
                    {program.is_public && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSharingProgram(program)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Assigner à des clients"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
                        try {
                          await deleteProgram.mutateAsync(program.id);
                        } catch (error) {
                          console.error('Error deleting program:', error);
                          setError('Failed to delete program. Please try again.');
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                {program.description || "Aucune description"}
              </p>

              <div className="mt-auto space-y-4">
                <div className="border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Séances incluses</span>
                    <span className="font-semibold text-white">{program.program_sessions?.length || 0}</span>
                  </div>
                </div>

                {program.price ? (
                  <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg p-3 border border-primary-500/20 flex items-center justify-between">
                    <span className="text-sm text-primary-400 font-medium">Prix</span>
                    <span className="text-lg font-bold text-white">{program.price} CHF</span>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Prix</span>
                    <span className="text-lg font-bold text-gray-300">Gratuit</span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProgramModal
          program={selectedProgram}
          onClose={() => setIsModalOpen(false)}
          onSave={async (programData: any, selectedSessions: any[]) => {
            try {
              await saveProgram.mutateAsync({
                programData,
                selectedSessions,
                programId: selectedProgram?.id
              });
              setIsModalOpen(false);
            } catch (error: any) {
              console.error('Error saving program:', error);
              setError('Failed to save program. Please try again.');
            }
          }}
        />
      )}

      {sharingProgram && (
        <ShareProgramModal
          program={sharingProgram as any}
          onClose={() => setSharingProgram(null)}
          onSuccess={() => {
            setSharingProgram(null);
            // Optionally refresh or show an alert
          }}
        />
      )}
    </div>
  );
}

// --- Program Modal ---

function ProgramModal({ program, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    description: program?.description || '',
    duration_weeks: program?.duration_weeks || 4,
    difficulty_level: program?.difficulty_level || 'Débutant',
    price: program?.price ?? null,
    is_public: program?.is_public || false,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<ProgramSession[]>(
    program?.program_sessions || []
  );
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('sessions')
        .select('id, name, description, duration_minutes, difficulty_level')
        .eq('coach_id', user?.id)
        .is('archived_at', null)
        .order('name');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        name === 'duration_weeks' ? parseInt(value) || 1 :
          name === 'price' ? (value === '' || value === null ? null : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSessions.length === 0) {
      setError('Vous devez ajouter au moins une séance au programme.');
      return;
    }

    onSave(formData, selectedSessions);
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title={program ? 'Modifier le programme' : 'Créer un programme'}
      position="right"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-4 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="program-form"
            disabled={selectedSessions.length === 0}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none"
          >
            {program ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      }
    >
      <div className="p-1">
        {error && (
          <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form id="program-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Info Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Informations Générales</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-2">Nom du programme</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                  placeholder="Ex: Prise de masse 12 semaines"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm resize-none"
                  placeholder="Décrivez l'objectif du programme..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-2">Durée (semaines)</label>
                  <input
                    type="number"
                    name="duration_weeks"
                    value={formData.duration_weeks}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-2">Difficulté</label>
                  <select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleChange}
                    className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    <option value="Débutant" className="bg-[#0f172a]">Débutant</option>
                    <option value="Intermédiaire" className="bg-[#0f172a]">Intermédiaire</option>
                    <option value="Avancé" className="bg-[#0f172a]">Avancé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-2">Prix (CHF)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price ?? ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-[#0f172a] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 ml-1">
                    Vide pour gratuit
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl bg-[#0f172a] border border-white/5 cursor-pointer group hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="w-5 h-5 rounded bg-[#1e293b] border-white/10 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Rendre public dans le marketplace
                </span>
              </label>
            </div>
          </div>

          {/* Sessions Section */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Séances du Programme</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors text-sm font-medium border border-blue-500/20 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter une séance
              </button>
            </div>

            {selectedSessions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0f172a] border border-dashed border-white/10 text-center flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500/50 mb-3" />
                <p className="text-gray-400 font-medium mb-1">Aucune séance sélectionnée</p>
                <p className="text-xs text-gray-500">Un programme doit contenir au moins une séance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSessions.map((ps: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[#0f172a] border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl transition-all group">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <span className="text-blue-400 font-bold text-xs sm:text-sm">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{ps.session?.name || 'Séance supprimée'}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2 truncate mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-300 border border-white/5">{ps.session?.difficulty_level}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{ps.session?.duration_minutes} min</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          const newSessions = [...selectedSessions];
                          if (index > 0) {
                            [newSessions[index], newSessions[index - 1]] = [newSessions[index - 1], newSessions[index]];
                            setSelectedSessions(newSessions);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${index > 0 ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
                        disabled={index === 0}
                        title="Monter"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newSessions = selectedSessions.filter((_, i) => i !== index);
                          setSelectedSessions(newSessions);
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {showSessionModal && (
          <SessionSelector
            sessions={sessions}
            selectedSessions={selectedSessions}
            onSelect={(session: any) => {
              setSelectedSessions([
                ...selectedSessions,
                {
                  id: `temp-${Date.now()}`,
                  session,
                  order_index: selectedSessions.length,
                },
              ]);
              setShowSessionModal(false);
            }}
            onClose={() => setShowSessionModal(false)}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </ResponsiveModal>
  );
}

// --- Session Selector ---

function SessionSelector({ sessions, selectedSessions, onSelect, onClose }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const difficulties = [...new Set(sessions.map((s: any) => s.difficulty_level))];

  const filteredSessions = sessions.filter((session: any) => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || session.difficulty_level === selectedDifficulty;
    const isNotSelected = !selectedSessions.find((ps: any) => ps.session.id === session.id);
    return matchesSearch && matchesDifficulty && isNotSelected;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Sélectionner une séance</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des séances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-field sm:w-48 appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-800">Tous les niveaux</option>
              {difficulties.map(difficulty => (
                <option key={difficulty as string} value={difficulty as string} className="bg-gray-800">{difficulty as string}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {filteredSessions.map((session: any) => (
              <div key={session.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/10 transition-colors">
                <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{session.name}</h4>
                  <p className="text-sm text-gray-400">{session.difficulty_level} • {session.duration_minutes} min</p>
                </div>
                <button onClick={() => onSelect(session)} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium">
                  Sélectionner
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default ProgramsPage;