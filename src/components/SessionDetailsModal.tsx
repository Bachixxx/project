import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, XCircle, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SessionDetailsModalProps {
  scheduledSessionId: string;
  onClose: () => void;
  onStatusChange?: () => void;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  rest_time: number;
  order_index: number;
  group_id: string | null;
  instructions?: string;
}

interface ExerciseGroup {
  id: string;
  name: string;
  repetitions: number;
  order_index: number;
  exercises: Exercise[];
}

type WorkoutItem =
  | { type: 'exercise'; data: Exercise; order_index: number }
  | { type: 'group'; data: ExerciseGroup; order_index: number };

interface SessionDetails {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  session: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    difficulty_level: string | null;
  };
  client: {
    full_name: string;
  };
}

export function SessionDetailsModal({ scheduledSessionId, onClose, onStatusChange }: SessionDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);

  useEffect(() => {
    fetchSessionDetails();
  }, [scheduledSessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase
        .from('scheduled_sessions')
        .select(`
          *,
          session:sessions (
            id,
            name,
            description,
            duration_minutes,
            difficulty_level
          ),
          client:clients (
            full_name
          )
        `)
        .eq('id', scheduledSessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .select(`
          *,
          exercise:exercises (
            id,
            name,
            category
          )
        `)
        .eq('session_id', sessionData.session.id)
        .order('order_index');

      if (exercisesError) throw exercisesError;

      const formattedExercises = (exercisesData || []).map(ex => ({
        id: ex.exercise.id,
        name: ex.exercise.name,
        category: ex.exercise.category,
        sets: ex.sets,
        reps: ex.reps,
        rest_time: ex.rest_time,
        order_index: ex.order_index,
        group_id: ex.group_id,
        instructions: ex.instructions
      }));

      const individualExercises = formattedExercises.filter(ex => !ex.group_id);

      const { data: groupsData, error: groupsError } = await supabase
        .from('exercise_groups')
        .select('*')
        .eq('session_id', sessionData.session.id)
        .order('order_index');

      if (groupsError) throw groupsError;

      const formattedGroups = (groupsData || []).map(group => ({
        id: group.id,
        name: group.name,
        repetitions: group.repetitions,
        order_index: group.order_index,
        exercises: formattedExercises.filter(ex => ex.group_id === group.id)
      }));

      const items: WorkoutItem[] = [
        ...individualExercises.map(ex => ({
          type: 'exercise' as const,
          data: ex,
          order_index: ex.order_index
        })),
        ...formattedGroups.map(group => ({
          type: 'group' as const,
          data: group,
          order_index: group.order_index
        }))
      ].sort((a, b) => a.order_index - b.order_index);

      setSession(sessionData);
      setWorkoutItems(items);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ status: newStatus })
        .eq('id', scheduledSessionId);

      if (error) throw error;

      if (onStatusChange) {
        onStatusChange();
      }

      fetchSessionDetails();
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-[#1e293b] rounded-xl p-8 border border-white/10 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{session.session.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[session.status] || statusColors.scheduled}`}>
                {session.status === 'scheduled' && 'Programmée'}
                {session.status === 'completed' && 'Complétée'}
                {session.status === 'cancelled' && 'Annulée'}
                {session.status === 'in_progress' && 'En cours'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Date</div>
                  <div className="font-medium text-white">
                    {new Date(session.scheduled_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Heure</div>
                  <div className="font-medium text-white">
                    {new Date(session.scheduled_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Client</div>
                  <div className="font-medium text-white">{session.client.full_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Durée</div>
                  <div className="font-medium text-white">{session.session.duration_minutes} minutes</div>
                </div>
              </div>
            </div>

            {session.session.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Description
                </h3>
                <p className="text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 leading-relaxed">
                  {session.session.description}
                </p>
              </div>
            )}

            {workoutItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Composition de la séance</h3>
                <div className="space-y-3">
                  {workoutItems.map((item, index) => (
                    item.type === 'exercise' ? (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="font-bold text-white mb-2 text-lg">{item.data.name}</div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{item.data.sets} séries</span>
                          <span className="text-gray-600">•</span>
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">{item.data.reps} reps</span>
                          <span className="text-gray-600">•</span>
                          <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">{item.data.rest_time}s repos</span>
                        </div>
                        {item.data.instructions && (
                          <div className="mt-3 text-sm text-gray-400 italic bg-black/20 p-2 rounded-lg border-l-2 border-gray-500">
                            {item.data.instructions}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key={index} className="bg-green-500/5 rounded-xl p-5 border border-green-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-white flex items-center gap-2 text-lg">
                            <Layers className="w-5 h-5 text-green-400" />
                            {item.data.name}
                          </h4>
                          <span className="text-sm font-bold text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                            {item.data.repetitions} tours
                          </span>
                        </div>
                        <div className="space-y-3 pl-4 border-l-2 border-green-500/20">
                          {item.data.exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <div className="font-medium text-white mb-2">{exercise.name}</div>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                                <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded">{exercise.sets} séries</span>
                                <span>•</span>
                                <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded">{exercise.reps} reps</span>
                                <span>•</span>
                                <span className="bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded">{exercise.rest_time}s repos</span>
                              </div>
                              {exercise.instructions && (
                                <div className="mt-2 text-xs text-gray-400 italic">
                                  {exercise.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {session.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Notes pour le client
                </h3>
                <p className="text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 leading-relaxed">
                  {session.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 p-6 bg-white/5">
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Fermer
            </button>

            {session.status === 'scheduled' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 transition-all font-bold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer comme complétée
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
