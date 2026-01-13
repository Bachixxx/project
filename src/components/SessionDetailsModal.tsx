import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, XCircle, Layers, Edit2, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  exercise_id: string; // Reference to the base exercise definition
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
  duration_seconds?: number;
  distance_meters?: number;
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

interface BaseExercise {
  id: string;
  name: string;
  category: string;
  tracking_type: 'reps_weight' | 'duration' | 'distance';
}

export function SessionDetailsModal({ scheduledSessionId, onClose, onStatusChange }: SessionDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<BaseExercise[]>([]);
  const [editedItems, setEditedItems] = useState<WorkoutItem[]>([]);

  useEffect(() => {
    fetchSessionDetails();
  }, [scheduledSessionId]);

  useEffect(() => {
    if (isEditing) {
      fetchAvailableExercises();
      setEditedItems(JSON.parse(JSON.stringify(workoutItems))); // Deep copy for editing
    }
  }, [isEditing]);

  const fetchAvailableExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, tracking_type')
        .eq('coach_id', user?.id)
        .order('name');

      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

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

      // If session is completed, fetch logs
      if (sessionData.status === 'completed') {
        const { data: logs, error: logsError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('scheduled_session_id', scheduledSessionId);

        if (!logsError) {
          setWorkoutLogs(logs || []);
        }
      }

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .select(`
          *,
          exercise:exercises (
            id,
            name,
            category,
            tracking_type
          )
        `)
        .eq('session_id', sessionData.session.id)
        .order('order_index');

      if (exercisesError) throw exercisesError;

      const formattedExercises = (exercisesData || []).map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise.id, // Keep reference to base exercise ID
        name: ex.exercise.name,
        category: ex.exercise.category,
        sets: ex.sets,
        reps: ex.reps,
        rest_time: ex.rest_time,
        order_index: ex.order_index,
        group_id: ex.group_id,
        instructions: ex.instructions,
        tracking_type: ex.exercise.tracking_type,
        duration_seconds: ex.duration_seconds,
        distance_meters: ex.distance_meters
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

  const getExerciseLogs = (exerciseId: string) => {
    return workoutLogs.filter(log => log.exercise_id === exerciseId).sort((a, b) => a.set_number - b.set_number);
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

  // --- Edit Mode Handlers ---

  const handleAddExercise = () => {
    if (availableExercises.length === 0) return;

    const newExercise = availableExercises[0];
    const newItem: WorkoutItem = {
      type: 'exercise',
      order_index: editedItems.length,
      data: {
        id: `temp-${Date.now()}`,
        exercise_id: newExercise.id,
        name: newExercise.name,
        category: newExercise.category,
        sets: 3,
        reps: 12,
        rest_time: 60,
        duration_seconds: 60,
        distance_meters: 1000,
        tracking_type: newExercise.tracking_type,
        order_index: editedItems.length,
        group_id: null,
        instructions: ''
      }
    };

    setEditedItems([...editedItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof Exercise, value: any) => {
    const newItems = [...editedItems];
    if (newItems[index].type === 'exercise') {
      newItems[index].data = { ...newItems[index].data, [field]: value };

      // If updating exercise_id, update name/category too
      if (field === 'exercise_id') {
        const exercise = availableExercises.find(e => e.id === value);
        if (exercise) {
          newItems[index].data.name = exercise.name;
          newItems[index].data.category = exercise.category;
          newItems[index].data.tracking_type = exercise.tracking_type;
        }
      }
    }
    setEditedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(newItems);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      if (!session || !user) return;

      // 1. Create a new "Cloned" Session (Copy-on-Write)
      const { data: newSession, error: createSessionError } = await supabase
        .from('sessions')
        .insert({
          coach_id: user.id,
          name: session.session.name + ' (Modifié)', // Or keep unique name logic
          description: session.session.description,
          duration_minutes: session.session.duration_minutes,
          difficulty_level: session.session.difficulty_level
        })
        .select()
        .single();

      if (createSessionError) throw createSessionError;

      // 2. Insert Exercises for this new session
      for (let i = 0; i < editedItems.length; i++) {
        const item = editedItems[i];

        if (item.type === 'exercise') {
          const { error: insertError } = await supabase
            .from('session_exercises')
            .insert({
              session_id: newSession.id,
              exercise_id: item.data.exercise_id,
              sets: item.data.sets,
              reps: item.data.reps,
              rest_time: item.data.rest_time,
              duration_seconds: item.data.duration_seconds,
              distance_meters: item.data.distance_meters,
              instructions: item.data.instructions,
              order_index: i,
              group_id: null
            });

          if (insertError) throw insertError;
        }
        // NOTE: Groups logic omitted for brevity as user asked for adding/modifying exercises specifically,
        // but can be added similarly if needed. For now, strict exercise support in edit mode.
        // If the original had groups, they are in 'editedItems', we need to handle them or flat them?
        // To be safe, let's just handle simple exercises for this first iteration of "Edit Mode" 
        // OR better: Handle groups by re-creating them if they exist in editedItems.
        else if (item.type === 'group') {
          const { data: newGroup, error: groupError } = await supabase
            .from('exercise_groups')
            .insert({
              session_id: newSession.id,
              name: item.data.name,
              repetitions: item.data.repetitions,
              order_index: i
            })
            .select()
            .single();

          if (groupError) throw groupError;

          // Insert each exercise in the group
          for (let j = 0; j < item.data.exercises.length; j++) {
            const groupEx = item.data.exercises[j];
            await supabase.from('session_exercises').insert({
              session_id: newSession.id,
              exercise_id: groupEx.exercise_id,
              sets: groupEx.sets,
              reps: groupEx.reps,
              rest_time: groupEx.rest_time,
              instructions: groupEx.instructions,
              order_index: j,
              group_id: newGroup.id
            });
          }
        }
      }

      // 3. Update Scheduled Session to point to the new Session
      const { error: updateScheduleError } = await supabase
        .from('scheduled_sessions')
        .update({ session_id: newSession.id })
        .eq('id', scheduledSessionId);

      if (updateScheduleError) throw updateScheduleError;

      setIsEditing(false);
      fetchSessionDetails(); // Refresh view
      alert('Séance modifiée avec succès ! (Une copie unique a été créée)');

    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Erreur lors de la sauvegarde des modifications.");
    } finally {
      setSaving(false);
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

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 max-w-[400px] truncate">{session.session.name}</h2>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[session.status] || statusColors.scheduled}`}>
                  {session.status === 'scheduled' && 'Programmée'}
                  {session.status === 'completed' && 'Complétée'}
                  {session.status === 'cancelled' && 'Annulée'}
                  {session.status === 'in_progress' && 'En cours'}
                </span>
                {session.session.name.includes('(Modifié)') && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                    <AlertCircle className="w-3 h-3" />
                    Personnalisée
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && session.status === 'scheduled' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                  title="Modifier le contenu de la séance"
                >
                  <Edit2 className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Modifier</span>
                </button>
              )}
              <button
                onClick={onClose}
                disabled={isEditing || saving}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

          {/* View Mode: Session Details */}
          {!isEditing && (
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">
                      {session.status === 'completed' ? 'Résultats de la séance' : 'Composition de la séance'}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {workoutItems.map((item, index) => (
                      item.type === 'exercise' ? (
                        <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-white text-lg">{item.data.name}</div>
                            {session.status === 'completed' && (
                              <div className="text-xs font-medium px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                                {getExerciseLogs(item.data.exercise_id).length} / {item.data.sets} séries
                              </div>
                            )}
                          </div>


                          {/* Planned Details */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-3">
                            {item.data.tracking_type === 'duration' ? (
                              <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                {Math.floor((item.data.duration_seconds || 0) / 60)}m {(item.data.duration_seconds || 0) % 60}s
                              </span>
                            ) : item.data.tracking_type === 'distance' ? (
                              <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                {item.data.distance_meters}m
                              </span>
                            ) : (
                              <>
                                <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">{item.data.sets} séries</span>
                                <span className="text-gray-600">•</span>
                                <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">{item.data.reps} reps</span>
                                <span className="text-gray-600">•</span>
                                <span className="bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded border border-orange-500/20">{item.data.rest_time}s repos</span>
                              </>
                            )}
                          </div>

                          {/* Completed Logs Comparison */}
                          {session.status === 'completed' && getExerciseLogs(item.data.exercise_id).length > 0 && (
                            <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/5 space-y-2">
                              {getExerciseLogs(item.data.exercise_id).map((log, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-400 font-medium">Série {log.set_number}</span>
                                  <div className="flex items-center gap-3">
                                    <span className={`font-mono ${log.reps >= item.data.reps ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {log.reps} reps
                                    </span>
                                    <span className="text-gray-600">x</span>
                                    <span className="font-mono text-white font-bold">{log.weight} kg</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

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
                                </div>

                                {/* Logs for Group Exercise */}
                                {session.status === 'completed' && getExerciseLogs(exercise.exercise_id).length > 0 && (
                                  <div className="mt-2 text-xs bg-black/30 rounded p-2 border border-white/5 space-y-1">
                                    {getExerciseLogs(exercise.exercise_id).map((log, logIdx) => (
                                      <div key={logIdx} className="flex justify-between">
                                        <span className="text-gray-500">S#{log.set_number}</span>
                                        <span className="text-white font-mono">{log.reps} x {log.weight}kg</span>
                                      </div>
                                    ))}
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
                    {session.status === 'completed' ? 'Retour Client' : 'Notes pour le client'}
                  </h3>
                  <p className="text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 leading-relaxed">
                    {session.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Edit Mode Content */}
          {isEditing && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-200">
                  Vous êtes en train de modifier cette séance. Une <strong>copie unique</strong> de la séance sera créée pour ce créneau, afin de ne pas affecter votre bibliothèque originale.
                </p>
              </div>

              <div className="space-y-4">
                {editedItems.map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-xl border border-white/10 p-4 transition-all hover:bg-white/[0.07]">
                    {item.type === 'exercise' ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Exercice</label>
                            <select
                              value={item.data.exercise_id}
                              onChange={(e) => handleUpdateItem(index, 'exercise_id', e.target.value)}
                              className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                              {availableExercises.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="mt-6 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer l'exercice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>



                        <div className="grid grid-cols-3 gap-3">
                          {item.data.tracking_type === 'duration' ? (
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Durée (secondes)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={item.data.duration_seconds || 0}
                                onChange={(e) => handleUpdateItem(index, 'duration_seconds', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                              />
                            </div>
                          ) : item.data.tracking_type === 'distance' ? (
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Distance (mètres)</label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={item.data.distance_meters || 0}
                                onChange={(e) => handleUpdateItem(index, 'distance_meters', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                              />
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Séries</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.data.sets}
                                  onChange={(e) => handleUpdateItem(index, 'sets', parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.data.reps}
                                  onChange={(e) => handleUpdateItem(index, 'reps', parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Repos (s)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="15"
                                  value={item.data.rest_time}
                                  onChange={(e) => handleUpdateItem(index, 'rest_time', parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Instructions (Optionnel)</label>
                          <input
                            type="text"
                            placeholder="Ex: Tempo lent, focus contraction..."
                            value={item.data.instructions || ''}
                            onChange={(e) => handleUpdateItem(index, 'instructions', e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      // Read-only view for groups in Edit Mode (simplification for now)
                      <div className="opacity-70">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-400" />
                            {item.data.name} (Circuit)
                          </h4>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Les circuits ne sont pas modifiables pour l'instant, seulement supprimables.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddExercise}
                disabled={availableExercises.length === 0}
                className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 border-dashed rounded-xl text-blue-400 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter un exercice
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 bg-white/5">
          <div className="flex justify-between items-center gap-3">
            {isEditing ? (
              <div className="flex gap-3 w-full justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-6 py-2 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 transition-all font-bold disabled:opacity-70"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
