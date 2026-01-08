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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{session.session.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${statusColors[session.status] || statusColors.scheduled}`}>
                {session.status === 'scheduled' && 'Programmée'}
                {session.status === 'completed' && 'Complétée'}
                {session.status === 'cancelled' && 'Annulée'}
                {session.status === 'in_progress' && 'En cours'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">
                    {new Date(session.scheduled_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Heure</div>
                  <div className="font-medium">
                    {new Date(session.scheduled_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Client</div>
                  <div className="font-medium">{session.client.full_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Durée</div>
                  <div className="font-medium">{session.session.duration_minutes} minutes</div>
                </div>
              </div>
            </div>

            {session.session.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                  {session.session.description}
                </p>
              </div>
            )}

            {workoutItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Composition de la séance</h3>
                <div className="space-y-3">
                  {workoutItems.map((item, index) => (
                    item.type === 'exercise' ? (
                      <div key={index} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                        <div className="font-medium text-gray-800 mb-2">{item.data.name}</div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{item.data.sets} séries</span>
                          <span>•</span>
                          <span>{item.data.reps} reps</span>
                          <span>•</span>
                          <span>{item.data.rest_time}s repos</span>
                        </div>
                        {item.data.instructions && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            {item.data.instructions}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key={index} className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            {item.data.name}
                          </h4>
                          <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            {item.data.repetitions} tours
                          </span>
                        </div>
                        <div className="space-y-2">
                          {item.data.exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="font-medium text-gray-800 mb-1 text-sm">{exercise.name}</div>
                              <div className="flex gap-3 text-xs text-gray-600">
                                <span>{exercise.sets} séries</span>
                                <span>•</span>
                                <span>{exercise.reps} reps</span>
                                <span>•</span>
                                <span>{exercise.rest_time}s repos</span>
                              </div>
                              {exercise.instructions && (
                                <div className="mt-2 text-xs text-gray-600 italic">
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
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes pour le client
                </h3>
                <p className="text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  {session.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>

            {session.status === 'scheduled' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
