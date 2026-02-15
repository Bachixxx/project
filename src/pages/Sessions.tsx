import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Dumbbell, Clock, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BlockManager, SessionBlock } from '../components/BlockManager';
import { ExerciseSelector } from '../components/library/ExerciseSelector';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { useCoachSessions, Session } from '../hooks/useCoachSessions';

// Updated Interfaces
interface SessionExercise {
  id: string;
  exercise: {
    id: string;
    name: string;
    category: string;
    difficulty_level: string;
    track_weight: boolean;
    track_reps: boolean;
    track_duration: boolean;
    track_distance: boolean;
    track_calories: boolean;
    tracking_type?: 'reps_weight' | 'duration' | 'distance';
  };
  sets: number;
  reps: number;
  weight: number;
  rest_time: number;
  order_index: number;
  instructions?: string;
  group_id?: string | null;
  duration_seconds?: number;
  distance_meters?: number;
  calories?: number;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty_level: string;
  coach_id: string | null;
  track_reps: boolean;
  track_weight: boolean;
  track_duration: boolean;
  track_distance: boolean;
  track_calories: boolean;
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
}

function SessionsPage() {
  const { sessions, isLoading, error: queryError, saveSession, deleteSession } = useCoachSessions();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const { user } = useAuth(); // Still needed for exercise fetch in modal, ideally move that too

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const error = errorDetails || (queryError ? 'Impossible de charger les séances.' : null);

  return (
    <div className="p-6 max-w-[2000px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Séances d'entraînement</h1>
          <p className="text-gray-400">Gérez vos séances et créez des modèles pour vos programmes</p>
        </div>
        <button
          onClick={() => {
            setSelectedSession(null);
            setIsModalOpen(true);
          }}
          className="primary-button flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Créer une séance
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-xl p-4 mb-6 text-red-200">
          {error}
        </div>
      )}

      <div className="glass-card p-4 mb-8">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une séance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session.id} className="glass-card group hover:bg-white/5 transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{session.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${session.difficulty_level === 'Débutant' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          session.difficulty_level === 'Intermédiaire' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                          {session.difficulty_level}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
                            try {
                              await deleteSession.mutateAsync(session.id);
                            } catch (error) {
                              console.error('Error deleting session:', error);
                              setErrorDetails('Failed to delete session. Please try again.');
                            }
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">{session.description || "Aucune description"}</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>Aperçu</span>
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded">
                        {(session.exercise_groups?.length || 0)} blocs • {(session.session_exercises?.length || 0)} exos
                      </span>
                    </div>
                    {/* Quick preview of blocks */}
                    <div className="space-y-1">
                      {session.exercise_groups?.slice(0, 3).map((group: any) => (
                        <div key={group.id} className="text-xs text-gray-300 flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <span>{group.name}</span>
                          <span className="text-gray-500 uppercase text-[10px]">{group.type || 'Standard'}</span>
                        </div>
                      ))}
                      {session.exercise_groups && session.exercise_groups.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">+ {session.exercise_groups.length - 3} autres blocs</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 glass-card">
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucune séance trouvée</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                Créez des séances structurées avec des blocs réutilisables.
              </p>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setIsModalOpen(true);
                }}
                className="primary-button inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Créer une séance
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <SessionModal
          session={selectedSession}
          onClose={() => setIsModalOpen(false)}
          onSave={async (sessionData: any, blocks: SessionBlock[], standaloneExercises: SessionExercise[]) => {
            try {
              setErrorDetails(null);
              await saveSession.mutateAsync({
                sessionData,
                blocks,
                standaloneExercises,
                sessionId: selectedSession?.id
              });
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error saving session:', error);
              setErrorDetails('Impossible de sauvegarder la séance.');
            }
          }}
        />
      )}

    </div>
  );
}

// --- Session Modal Component ---

function SessionModal({ session, onClose, onSave }: any) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`coach_id.eq.${user?.id},coach_id.is.null`)
        .order('name');

      if (error) throw error;
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const [formData, setFormData] = useState({
    name: session?.name || '',
    description: session?.description || '',
    duration_minutes: session?.duration_minutes || 60,
    difficulty_level: session?.difficulty_level || 'Débutant',
    session_type: session?.session_type || 'private',
  });

  // Tabs for mobile only? Or general layout.
  // Using side-by-side layout for desktop as per previous file structure.

  // Transform DB data to UI Block structure
  const [blocks, setBlocks] = useState<SessionBlock[]>(() => {
    if (!session?.exercise_groups) return [];
    return session.exercise_groups.map((g: any) => ({
      id: g.id,
      name: g.name,
      type: g.type || (g.repetitions > 1 ? 'circuit' : 'regular'),
      rounds: g.repetitions,
      duration_seconds: g.duration_seconds,
      order_index: g.order_index,
      exercises: (session.session_exercises || [])
        .filter((ex: any) => ex.group_id === g.id)
        .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
        .sort((a: any, b: any) => a.order_index - b.order_index)
    })).sort((a: any, b: any) => a.order_index - b.order_index);
  });

  const [standaloneExercises, setStandaloneExercises] = useState<SessionExercise[]>(() => {
    if (!session?.session_exercises) return [];
    return session.session_exercises
      .filter((ex: any) => !ex.group_id)
      .map((ex: any) => ({ ...ex, exercise: Array.isArray(ex.exercise) ? ex.exercise[0] : ex.exercise }))
      .sort((a: any, b: any) => a.order_index - b.order_index);
  });

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null); // null = standalone/new

  const handleAddExercises = (newExercises: any[]) => {
    const formattedExercises: SessionExercise[] = newExercises.map(ex => ({
      id: `temp-ex-${Date.now()}-${Math.random()}`,
      exercise: ex,
      sets: 3,
      reps: 10,
      weight: 0,
      rest_time: 60,
      order_index: 0,
      instructions: '',
      group_id: targetBlockId,
      duration_seconds: 60,
      distance_meters: 1000,
      calories: 0,
    }));

    if (targetBlockId) {
      setBlocks(prev => prev.map(b => {
        if (b.id === targetBlockId) {
          return { ...b, exercises: [...b.exercises, ...formattedExercises] };
        }
        return b;
      }));
    } else {
      setStandaloneExercises(prev => [...prev, ...formattedExercises]);
    }
    setShowExerciseModal(false);
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title={session ? 'Modifier la séance' : 'Créer une séance'}
      maxWidth="!max-w-[95vw] !h-[90vh] !max-h-[90vh]"
      footer={
        <div className="flex justify-end gap-4 w-full">
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
          <button
            type="button"
            onClick={() => onSave(formData, blocks, standaloneExercises)}
            className="primary-button flex items-center gap-2"
            disabled={blocks.length === 0 && standaloneExercises.length === 0}
          >
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row h-full gap-6">
        {/* Sidebar: Metadata */}
        <div className="w-full lg:w-1/3 space-y-6 overflow-y-auto custom-scrollbar p-1">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la séance</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Ex: Pectoraux Explosifs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durée (min)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulté</label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="input-field"
              placeholder="Objectifs, matériel nécessaire..."
            />
          </div>
        </div>

        {/* Main Area: Blocks */}
        <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar relative">
          <BlockManager
            blocks={blocks}
            standaloneExercises={standaloneExercises}
            onBlocksChange={setBlocks}
            onStandaloneExercisesChange={setStandaloneExercises}
            onShowExercisePicker={(blockId) => {
              setTargetBlockId(blockId);
              setShowExerciseModal(true);
            }}
          />

          {/* Empty state hint if nothing exists */}
          {blocks.length === 0 && standaloneExercises.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-500 text-sm">Ajoutez des blocs pour structurer votre séance.</p>
            </div>
          )}
        </div>
      </div>

      {showExerciseModal && (
        <ExerciseSelector
          exercises={exercises}
          onClose={() => setShowExerciseModal(false)}
          onSelect={handleAddExercises}
          multiSelect={true}
          loading={loadingExercises}
        />
      )}

    </ResponsiveModal>
  );
}

export default SessionsPage;