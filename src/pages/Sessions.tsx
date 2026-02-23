import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Dumbbell, Clock, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BlockManager, SessionBlock } from '../components/BlockManager';
import { ExerciseSelector } from '../components/library/ExerciseSelector';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { useCoachSessions, Session } from '../hooks/useCoachSessions';
import { SessionBuilderModal } from '../components/library/SessionBuilderModal';
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
        <SessionBuilderModal
          session={selectedSession}
          onClose={() => setIsModalOpen(false)}
          onSave={async (sessionData, blocks, standaloneExercises) => {
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

export default SessionsPage;
