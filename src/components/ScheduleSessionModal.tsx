import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, ChevronRight, ChevronLeft, Layers, GripVertical, CreditCard, Banknote, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ScheduleSessionModalProps {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
  selectedSlot?: {
    start: Date;
    end: Date;
  } | null;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  // New Tracking Booleans
  track_reps: boolean;
  track_weight: boolean;
  track_duration: boolean;
  track_distance: boolean;
  track_calories: boolean;
  // Legacy
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
}

interface SelectedExercise {
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number;
  rest_time: number;
  group_id?: string;
  // Legacy
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
  // New metrics
  duration_seconds: number;
  distance_meters: number;
  calories: number;
}

interface ExerciseGroup {
  id: string;
  name: string;
  repetitions: number;
  exercises: SelectedExercise[];
}

type WorkoutItem =
  | { type: 'exercise'; data: SelectedExercise }
  | { type: 'group'; data: ExerciseGroup };

interface ExistingSession {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
}

export function ScheduleSessionModal({ clientId, onClose, onSuccess, selectedSlot }: ScheduleSessionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [existingSessions, setExistingSessions] = useState<ExistingSession[]>([]);
  const [activeProgramSessions, setActiveProgramSessions] = useState<any[]>([]);
  const [sessionMode, setSessionMode] = useState<'new' | 'existing' | 'program' | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [step, setStep] = useState(0);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedGroupExerciseIndex, setDraggedGroupExerciseIndex] = useState<number | null>(null);
  const [draggedInGroupIndex, setDraggedInGroupIndex] = useState<number | null>(null);

  const getInitialDate = () => {
    if (selectedSlot?.start) {
      return selectedSlot.start.toISOString().split('T')[0];
    }
    return '';
  };

  const getInitialTime = () => {
    if (selectedSlot?.start) {
      return selectedSlot.start.toTimeString().slice(0, 5);
    }
    return '';
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    scheduled_date: getInitialDate(),
    scheduled_time: getInitialTime(),
    notes: '',
    payment_method: 'in_person' as 'online' | 'in_person'
  });

  useEffect(() => {
    fetchExercises();
    fetchExistingSessions();
    if (clientId) {
      fetchActiveProgramSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSlot?.start) {
      setFormData(prev => ({
        ...prev,
        scheduled_date: selectedSlot.start.toISOString().split('T')[0],
        scheduled_time: selectedSlot.start.toTimeString().slice(0, 5)
      }));
    }
  }, [selectedSlot]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, tracking_type, track_reps, track_weight, track_duration, track_distance, track_calories')
        .or(`coach_id.eq.${user?.id},coach_id.is.null`)
        .order('name');

      if (error) throw error;
      console.log('Fetched exercises:', data);
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchExistingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, name, description, duration_minutes')
        .eq('coach_id', user?.id)
        .eq('session_type', 'private')
        .order('name');

      if (error) throw error;
      setExistingSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchActiveProgramSessions = async () => {
    try {
      // 1. Get active program for client
      const { data: programData, error: programError } = await supabase
        .from('client_programs')
        .select(`
          program:programs (
            id,
            name,
            program_sessions (
              id,
              order_index,
              session:sessions (
                id,
                name,
                description,
                duration_minutes
              )
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();

      if (programError && programError.code !== 'PGRST116') { // Ignore no rows found
        console.error('Error fetching active program:', programError);
      }

      const program = Array.isArray(programData?.program) ? programData.program[0] : programData?.program;

      if (program?.program_sessions) {
        // Sort by order_index
        const sessions = program.program_sessions.sort((a: any, b: any) => a.order_index - b.order_index);
        setActiveProgramSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching program sessions:', error);
    }
  };

  const handleSelectProgramSession = async (programSession: any) => {
    try {
      setLoading(true);
      const sessionId = programSession.session.id;

      // Fetch full session details including exercises
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          name,
          description,
          duration_minutes,
          session_exercises (
            id,
            exercise_id,
            sets,
            reps,
            weight,
            rest_time,
            order_index,
            group_id,
            tracking_type,
            duration_seconds,
            distance_meters,
            calories,
            exercise:exercises (
              id,
              name,
              category,
              tracking_type,
               track_reps,
               track_weight,
               track_duration,
               track_distance,
               track_calories
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Populate form data
      setFormData(prev => ({
        ...prev,
        name: sessionData.name, // Use original name or maybe "Copy of..."? User can edit.
        description: sessionData.description || '',
        duration_minutes: sessionData.duration_minutes || 60
      }));

      // Populate workout items
      const newWorkoutItems: WorkoutItem[] = [];
      const sessionExercises = sessionData.session_exercises || [];

      // Sort by order_index
      sessionExercises.sort((a: any, b: any) => a.order_index - b.order_index);

      // We need to handle groups vs standalone exercises if existing logic supports it.
      // For simplicity, let's treat them as flat or grouped if group_id exists.
      // NOTE: Current logic in this file supports groups via `ExerciseGroup`.
      // We need to reconstruct groups.

      const groupMap = new Map<string, ExerciseGroup>();
      // Helper to convert DB exercise to SelectedExercise
      const toSelectedExercise = (se: any): SelectedExercise => ({
        exercise_id: se.exercise_id,
        sets: se.sets,
        reps: se.reps,
        weight: se.weight,
        rest_time: se.rest_time,
        tracking_type: se.exercise?.tracking_type || se.tracking_type, // Fallback
        duration_seconds: se.duration_seconds,
        distance_meters: se.distance_meters,
        calories: se.calories
      });

      for (const se of sessionExercises) {
        if (se.group_id) {
          // It's part of a group. 
          // We need to fetch group details? OR we can just create a group on the fly.
          // Ideally we should have fetched `exercise_groups` too if we want group names/reps.
          // However, let's look at `session_exercises` query above. We didn't join `exercise_groups`.

          // Fetch group details if not already fetched? Or just group primarily by ID.
          let group = groupMap.get(se.group_id);
          if (!group) {
            // We need to fetch the group info. 
            // To avoid N+1, let's do a separate fetch for groups of this session before this loop?
            // Or lazily fetch.
            // Given complexity, let's fetch groups first.
          }
        }
      }

      // RE-PLAN: Let's fetch groups for the session first to get names/repetitions.
      const { data: groupsData } = await supabase
        .from('exercise_groups')
        .select('*')
        .eq('session_id', sessionId);

      const groupsById = new Map(groupsData?.map(g => [g.id, g]));

      sessionExercises.forEach((se: any) => {
        if (se.group_id && groupsById.has(se.group_id)) {
          const groupInfo = groupsById.get(se.group_id);
          let groupItem = newWorkoutItems.find(item => item.type === 'group' && item.data.id === se.group_id);

          if (!groupItem) {
            // Create group item
            groupItem = {
              type: 'group',
              data: {
                id: se.group_id, // Keep ID for grouping, but maybe change for new session?
                // Actually, we should probably generate a NEW temp ID to detach from DB group
                // But wait, we are iterating. If we use DB ID, we can group.
                // We will replace ID with temp ID at the end to ensure it's treated as new.
                name: groupInfo.name,
                repetitions: groupInfo.repetitions,
                exercises: []
              }
            };
            newWorkoutItems.push(groupItem);
          }

          (groupItem.data as ExerciseGroup).exercises.push(toSelectedExercise(se));

        } else {
          // Standalone
          newWorkoutItems.push({
            type: 'exercise',
            data: toSelectedExercise(se)
          });
        }
      });

      // Clean up Group IDs to be temp IDs
      newWorkoutItems.forEach(item => {
        if (item.type === 'group') {
          item.data.id = `temp-${Date.now()}-${Math.random()}`;
          // Also clear group_id in exercises inside just in case
          item.data.exercises.forEach(ex => delete ex.group_id);
        }
      });

      setWorkoutItems(newWorkoutItems);

      // Use 'new' mode logic for editing/saving, but prefilled
      // Actually, if we use 'new' mode, the "Step 0" logic checks for mode.
      // We added 'program' mode.
      // If we keep 'program' mode, we need to handle it in rendering Steps 2 & 3.
      // OR we just switch mode to 'new' after selection?
      // If we switch to 'new', the UI will think we are creating a fresh one.
      // That's actually perfect. We are creating a NEW session based on a template.
      setSessionMode('new');
      setStep(1); // Go to Details step (Step 1 for 'new' mode is Details)
      // Wait, 'new' Step 1 is Details. 'existing' Step 1 is Selection.
      // If I set 'new', I go to Step 1 (Details). Perfect.

    } catch (error) {
      console.error('Error loading program session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    if (exercises.length > 0) {
      setWorkoutItems([
        ...workoutItems,
        {
          type: 'exercise',
          data: {
            exercise_id: exercises[0].id,
            sets: exercises[0].track_reps ? 3 : 0,
            reps: exercises[0].track_reps ? 12 : 0,
            weight: 0,
            rest_time: 60,
            tracking_type: exercises[0].tracking_type,
            duration_seconds: exercises[0].track_duration ? 60 : 0,
            distance_meters: exercises[0].track_distance ? 1000 : 0,
            calories: 0,

          }
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setWorkoutItems(workoutItems.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    const updated = [...workoutItems];
    if (updated[index].type === 'exercise') {
      const newData = { ...updated[index].data, [field]: value };

      if (field === 'exercise_id') {
        console.log('Changing exercise to ID:', value);
        const selectedEx = exercises.find(e => e.id === value);
        console.log('Found exercise:', selectedEx);

        if (selectedEx) {
          console.log('Setting tracking_type to:', selectedEx.tracking_type);
          newData.tracking_type = selectedEx.tracking_type;
        } else {
          console.warn('Exercise not found in list!');
        }
      }

      updated[index] = {
        ...updated[index],
        data: newData
      };
      setWorkoutItems(updated);
    }
  };

  const handleAddGroup = () => {
    const newGroup: ExerciseGroup = {
      id: `temp-${Date.now()}`,
      name: `Circuit ${workoutItems.filter(item => item.type === 'group').length + 1}`,
      repetitions: 3,
      exercises: exercises.length > 0 ? [{
        exercise_id: exercises[0].id,
        sets: 1,
        reps: 12,
        weight: 0,
        rest_time: 30,
        tracking_type: exercises[0].tracking_type || 'reps_weight',
        duration_seconds: 60,
        distance_meters: 1000,
        calories: 0,
      }] : []
    };
    setWorkoutItems([...workoutItems, { type: 'group', data: newGroup }]);
  };



  const handleGroupChange = (index: number, field: string, value: string | number) => {
    const updated = [...workoutItems];
    if (updated[index].type === 'group') {
      updated[index] = {
        ...updated[index],
        data: { ...updated[index].data, [field]: value }
      };
      setWorkoutItems(updated);
    }
  };

  const handleAddExerciseToGroup = (itemIndex: number) => {
    if (exercises.length > 0) {
      const updated = [...workoutItems];
      if (updated[itemIndex].type === 'group') {
        const groupData = updated[itemIndex].data as ExerciseGroup;
        groupData.exercises.push({
          exercise_id: exercises[0].id,
          sets: 1,
          reps: 12,
          weight: 0,
          rest_time: 30,
          tracking_type: exercises[0].tracking_type || 'reps_weight',
          duration_seconds: 60,
          distance_meters: 1000,
          calories: 0,
        });
        setWorkoutItems(updated);
      }
    }
  };

  const handleRemoveExerciseFromGroup = (itemIndex: number, exerciseIndex: number) => {
    const updated = [...workoutItems];
    if (updated[itemIndex].type === 'group') {
      const groupData = updated[itemIndex].data as ExerciseGroup;
      groupData.exercises = groupData.exercises.filter((_, i) => i !== exerciseIndex);
      setWorkoutItems(updated);
    }
  };

  const handleGroupExerciseChange = (itemIndex: number, exerciseIndex: number, field: string, value: string | number) => {
    const updated = [...workoutItems];
    if (updated[itemIndex].type === 'group') {
      const groupData = updated[itemIndex].data as ExerciseGroup;

      const newData = {
        ...groupData.exercises[exerciseIndex],
        [field]: value
      };

      if (field === 'exercise_id') {
        const selectedEx = exercises.find(e => e.id === value);
        if (selectedEx) {
          newData.tracking_type = selectedEx.tracking_type;
        }
      }

      groupData.exercises[exerciseIndex] = newData;
      setWorkoutItems(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called, step:', step);

    const finalStep = sessionMode === 'existing' ? 1 : 3;
    if (step !== finalStep) {
      console.log('Not on final step, returning');
      return;
    }

    if (sessionMode === 'existing' && !selectedSessionId) {
      alert('Veuillez sélectionner une séance');
      return;
    }

    if (sessionMode === 'new' && !formData.name) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.scheduled_date || !formData.scheduled_time) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      let sessionIdToSchedule: string;

      if (sessionMode === 'existing') {
        sessionIdToSchedule = selectedSessionId;
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            coach_id: user?.id,
            name: formData.name,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            session_type: 'private'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionIdToSchedule = sessionData.id;

        for (let i = 0; i < workoutItems.length; i++) {
          const item = workoutItems[i];

          if (item.type === 'exercise') {
            const ex = item.data;
            const { error: exerciseError } = await supabase
              .from('session_exercises')
              .insert({
                session_id: sessionData.id,
                exercise_id: ex.exercise_id,
                sets: ex.sets,
                reps: ex.reps,
                rest_time: ex.rest_time,
                order_index: i,
                group_id: null,
                duration_seconds: ex.duration_seconds,
                distance_meters: ex.distance_meters,
              });

            if (exerciseError) throw exerciseError;
          } else if (item.type === 'group') {
            const group = item.data;

            const { data: groupData, error: groupError } = await supabase
              .from('exercise_groups')
              .insert({
                session_id: sessionData.id,
                name: group.name,
                repetitions: group.repetitions,
                order_index: i
              })
              .select()
              .single();

            if (groupError) throw groupError;

            if (group.exercises.length > 0) {
              const groupExercisesToInsert = group.exercises.map((ex, index) => ({
                session_id: sessionData.id,
                exercise_id: ex.exercise_id,
                sets: ex.sets,
                reps: ex.reps,
                rest_time: ex.rest_time,
                order_index: index,
                group_id: groupData.id,
                duration_seconds: ex.duration_seconds,
                distance_meters: ex.distance_meters,
              }));

              const { error: groupExercisesError } = await supabase
                .from('session_exercises')
                .insert(groupExercisesToInsert);

              if (groupExercisesError) throw groupExercisesError;
            }
          }
        }
      }

      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

      const { error: scheduleError } = await supabase
        .from('scheduled_sessions')
        .insert({
          coach_id: user?.id,
          client_id: clientId,
          session_id: sessionIdToSchedule,
          scheduled_date: scheduledDateTime.toISOString(),
          notes: formData.notes || null,
          status: 'scheduled',
          payment_method: formData.payment_method,
          payment_status: 'pending'
        });

      if (scheduleError) throw scheduleError;

      // Also create an appointment for the calendar/dashboard
      const endDateTime = new Date(scheduledDateTime.getTime() + formData.duration_minutes * 60000);

      let appointmentTitle = formData.name;
      if (sessionMode === 'existing') {
        const selectedSession = existingSessions.find(s => s.id === selectedSessionId);
        if (selectedSession) appointmentTitle = selectedSession.name;
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          coach_id: user?.id,
          client_id: clientId,
          title: appointmentTitle,
          start: scheduledDateTime.toISOString(),
          end: endDateTime.toISOString(),
          duration: formData.duration_minutes,
          status: 'scheduled',
          type: 'private', // Assuming private for direct client scheduling
          notes: formData.notes || null,
          payment_method: formData.payment_method,
          payment_status: 'pending',
          session_id: sessionIdToSchedule,
          price: 0 // Default or needs to be handled if pricing exists
        });

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        // We don't throw here to avoid failing the whole operation if just the calendar sync fails, 
        // but arguably we should. reliable sync is better.
        // throw appointmentError; 
      }



      // Send Confirmation Email
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('email, full_name')
          .eq('id', clientId)
          .single();

        if (clientData?.email) {
          const dateStr = scheduledDateTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
          const timeStr = scheduledDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          await supabase.functions.invoke('send-email', {
            body: {
              to: clientData.email,
              template_name: 'session.confirm',
              data: {
                date: dateStr,
                time: timeStr,
                type: appointmentTitle,
                dashboard_url: `${window.location.origin}/client/appointments`
              }
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send session confirmation email:', emailError);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling session:', error);
      alert('Erreur lors de la planification de la séance');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const canGoNext = () => {
    if (step === 0) return sessionMode !== null;
    if (sessionMode === 'existing' && step === 1) return selectedSessionId !== '';
    if (sessionMode === 'new' && step === 1) return formData.name.trim() !== '';
    if (step === 2) return true;
    return true;
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const items = [...workoutItems];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);

    setWorkoutItems(items);
    setDraggedItemIndex(null);
  };

  const handleDragStartGroupExercise = (itemIndex: number, exerciseIndex: number) => {
    setDraggedInGroupIndex(itemIndex);
    setDraggedGroupExerciseIndex(exerciseIndex);
  };

  const handleDropGroupExercise = (itemIndex: number, exerciseIndex: number) => {
    if (draggedGroupExerciseIndex === null || draggedInGroupIndex === null) return;
    if (draggedInGroupIndex !== itemIndex) return;

    const updated = [...workoutItems];
    if (updated[itemIndex].type === 'group') {
      const groupData = updated[itemIndex].data as ExerciseGroup;
      const exercises = [...groupData.exercises];
      const draggedItem = exercises[draggedGroupExerciseIndex];
      exercises.splice(draggedGroupExerciseIndex, 1);
      exercises.splice(exerciseIndex, 0, draggedItem);
      groupData.exercises = exercises;
      setWorkoutItems(updated);
    }

    setDraggedGroupExerciseIndex(null);
    setDraggedInGroupIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              {step === 0 ? 'Planifier une séance' : sessionMode === 'existing' ? 'Utiliser une séance existante' : sessionMode === 'program' ? 'Choisir une séance du programme' : 'Créer et planifier une séance'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step > 0 && sessionMode === 'new' && (
            <div className="flex items-center justify-center gap-2">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-white/10'}`}>
                  1
                </div>
                <span className="text-sm font-medium hidden sm:inline">Détails</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-white/10'}`}>
                  2
                </div>
                <span className="text-sm font-medium hidden sm:inline">Exercices</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-white/10'}`}>
                  3
                </div>
                <span className="text-sm font-medium hidden sm:inline">Planning</span>
              </div>
            </div>
          )}

          {step > 0 && sessionMode === 'existing' && (
            <div className="flex items-center justify-center gap-2">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-white/10'}`}>
                  1
                </div>
                <span className="text-sm font-medium hidden sm:inline">Planning</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            const finalStep = sessionMode === 'existing' ? 1 : 3;
            // If program mode (Step 1 is selection), we don't have a "Next" per se, we click items.
            if (e.key === 'Enter' && step !== finalStep && sessionMode !== 'program') {
              e.preventDefault();
              if (canGoNext()) {
                setStep(step + 1);
              }
            }
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {step === 0 && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-center text-gray-400 mb-6">
                  Choisissez comment vous souhaitez créer cette séance
                </p>
                <div className={`grid grid-cols-1 ${activeProgramSessions.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                  {activeProgramSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessionMode('program');
                        setStep(1);
                      }}
                      className="p-6 rounded-2xl border-2 border-white/10 hover:border-purple-500 hover:bg-purple-500/10 transition-all group bg-white/5"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center transition-colors">
                          <Layers className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Programme Actif</h3>
                        <p className="text-sm text-gray-400 text-center">
                          Utiliser une séance du programme en cours ({activeProgramSessions.length} disp.)
                        </p>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSessionMode('new');
                      setStep(1);
                    }}
                    className="p-6 rounded-2xl border-2 border-white/10 hover:border-blue-500 hover:bg-blue-500/10 transition-all group bg-white/5"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                        <Plus className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Créer une nouvelle séance</h3>
                      <p className="text-sm text-gray-400 text-center">
                        Composez une séance personnalisée avec des exercices et circuits
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSessionMode('existing');
                      setStep(1);
                    }}
                    disabled={existingSessions.length === 0}
                    className="p-6 rounded-2xl border-2 border-white/10 hover:border-green-500 hover:bg-green-500/10 transition-all group bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/5"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 group-hover:bg-green-500/30 flex items-center justify-center transition-colors">
                        <BookOpen className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Utiliser une séance existante</h3>
                      <p className="text-sm text-gray-400 text-center">
                        {existingSessions.length > 0
                          ? `Choisir parmi vos ${existingSessions.length} séance${existingSessions.length > 1 ? 's' : ''}`
                          : 'Aucune séance disponible'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}



            {step === 1 && sessionMode === 'program' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white">Sélectionner une séance du programme</h3>
                  <p className="text-gray-400">Ces séances servent de modèles et resteront disponibles.</p>
                </div>
                <div className="space-y-3">
                  {activeProgramSessions.map((ps) => (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => handleSelectProgramSession(ps)}
                      className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 block">
                          Séance {ps.order_index + 1}
                        </span>
                        <h4 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                          {ps.session?.name || 'Sans titre'}
                        </h4>
                        {ps.session?.description && (
                          <p className="text-sm text-gray-400 mt-1">{ps.session.description}</p>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{ps.session?.duration_minutes || 60} min</span>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setSessionMode(null);
                  }}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors mt-4"
                >
                  Retour
                </button>
              </div>
            )}

            {step === 1 && sessionMode === 'existing' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Sélectionner une séance existante *
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {existingSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setFormData(prev => ({ ...prev, duration_minutes: session.duration_minutes }));
                        }}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${selectedSessionId === session.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-white/10'
                          }`}
                      >
                        <h4 className="font-bold text-white mb-1">{session.name}</h4>
                        {session.description && (
                          <p className="text-sm text-gray-400 mb-2">{session.description}</p>
                        )}
                        <p className="text-xs text-gray-500">{session.duration_minutes} minutes</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Heure *
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Mode de paiement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'online' })}
                      className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'online'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className={`w-6 h-6 ${formData.payment_method === 'online' ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                        <span className={`text-sm font-medium ${formData.payment_method === 'online' ? 'text-blue-300' : 'text-gray-300'
                          }`}>
                          En ligne
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Payé lors de la réservation
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'in_person' })}
                      className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'in_person'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className={`w-6 h-6 ${formData.payment_method === 'in_person' ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                        <span className={`text-sm font-medium ${formData.payment_method === 'in_person' ? 'text-blue-300' : 'text-gray-300'
                          }`}>
                          Sur place
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Payé à la séance
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes pour le client (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                      }
                    }}
                    rows={4}
                    placeholder="Instructions spéciales pour le client..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {step === 1 && sessionMode === 'new' && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nom de la séance *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Entraînement du haut du corps"
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Description de la séance..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    required
                    min="15"
                    max="240"
                    step="15"
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Composition de la séance</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddExercise}
                        disabled={exercises.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter exercice
                      </button>
                      <button
                        type="button"
                        onClick={handleAddGroup}
                        disabled={exercises.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 transition-colors text-sm"
                      >
                        <Layers className="w-4 h-4" />
                        Ajouter circuit
                      </button>
                    </div>
                  </div>

                  {exercises.length === 0 && (
                    <p className="text-sm text-yellow-300 mb-4 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                      Vous n'avez pas encore d'exercices. Créez-en d'abord dans la section Exercices.
                    </p>
                  )}

                  <div className="space-y-3">
                    {workoutItems.map((item, index) => (
                      item.type === 'exercise' ? (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e)}
                          onDrop={() => handleDrop(index)}
                          className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/20 cursor-move hover:bg-blue-500/10 transition-colors"
                        >
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              className="cursor-grab active:cursor-grabbing text-blue-400 hover:text-blue-300"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <select
                              value={item.data.exercise_id}
                              onChange={(e) => handleExerciseChange(index, 'exercise_id', e.target.value)}
                              className="flex-1 rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              {exercises.map((exercise) => (
                                <option key={exercise.id} value={exercise.id} className="bg-[#1e293b]">
                                  {exercise.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(() => {
                              const exerciseDef = exercises.find(e => e.id === item.data.exercise_id);
                              if (!exerciseDef) return null;

                              return (
                                <>
                                  {exerciseDef.track_duration && (
                                    <div className="col-span-1">
                                      <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Durée (s)
                                      </label>
                                      <input
                                        type="number"
                                        value={item.data.duration_seconds || 0}
                                        onChange={(e) => handleExerciseChange(index, 'duration_seconds', parseInt(e.target.value))}
                                        min="0"
                                        step="10"
                                        className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  )}

                                  {exerciseDef.track_distance && (
                                    <div className="col-span-1">
                                      <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Distance (m)
                                      </label>
                                      <input
                                        type="number"
                                        value={item.data.distance_meters || 0}
                                        onChange={(e) => handleExerciseChange(index, 'distance_meters', parseInt(e.target.value))}
                                        min="0"
                                        step="100"
                                        className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  )}

                                  {exerciseDef.track_reps && (
                                    <>
                                      <div className="col-span-1">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                          Séries
                                        </label>
                                        <input
                                          type="number"
                                          value={item.data.sets || 0}
                                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                                          min="0"
                                          max="20"
                                          className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div className="col-span-1">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                          Reps
                                        </label>
                                        <input
                                          type="number"
                                          value={item.data.reps || 0}
                                          onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                                          min="0"
                                          max="100"
                                          className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {exerciseDef.track_weight && (
                                    <div className="col-span-1">
                                      <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Poids (kg)
                                      </label>
                                      <input
                                        type="number"
                                        value={item.data.weight || 0}
                                        onChange={(e) => handleExerciseChange(index, 'weight', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.5"
                                        className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  )}

                                  {exerciseDef.track_calories && (
                                    <div className="col-span-1">
                                      <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Calories
                                      </label>
                                      <input
                                        type="number"
                                        value={item.data.calories || 0}
                                        onChange={(e) => handleExerciseChange(index, 'calories', parseInt(e.target.value))}
                                        min="0"
                                        step="1"
                                        className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Repos (s)
                              </label>
                              <input
                                type="number"
                                value={item.data.rest_time}
                                onChange={(e) => handleExerciseChange(index, 'rest_time', parseInt(e.target.value))}
                                min="0"
                                step="10"
                                className="w-full rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e)}
                          onDrop={() => handleDrop(index)}
                          className="bg-green-500/5 rounded-xl p-4 border border-green-500/20 cursor-move hover:bg-green-500/10 transition-colors"
                        >
                          <div className="flex gap-2 mb-3">
                            <button
                              type="button"
                              className="cursor-grab active:cursor-grabbing text-green-400 hover:text-green-300"
                            >
                              <GripVertical className="w-5 h-5" />
                            </button>
                            <input
                              type="text"
                              value={item.data.name}
                              onChange={(e) => handleGroupChange(index, 'name', e.target.value)}
                              placeholder="Nom du circuit"
                              className="flex-1 rounded-lg bg-white/5 border-white/10 text-white font-medium focus:border-green-500 focus:ring-green-500"
                            />
                            <input
                              type="number"
                              value={item.data.repetitions}
                              onChange={(e) => handleGroupChange(index, 'repetitions', parseInt(e.target.value))}
                              min="1"
                              max="10"
                              className="w-20 rounded-lg bg-white/5 border-white/10 text-white focus:border-green-500 focus:ring-green-500"
                              title="Nombre de tours"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 mb-2">
                            {item.data.exercises.map((ex, exIndex) => (
                              <div
                                key={exIndex}
                                draggable
                                onDragStart={() => handleDragStartGroupExercise(index, exIndex)}
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={() => handleDropGroupExercise(index, exIndex)}
                                className="bg-white/5 rounded-lg p-2 border border-white/10 cursor-move hover:bg-white/10 transition-colors"
                              >
                                <div className="flex gap-2 mb-2">
                                  <button
                                    type="button"
                                    className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </button>
                                  <select
                                    value={ex.exercise_id}
                                    onChange={(e) => handleGroupExerciseChange(index, exIndex, 'exercise_id', e.target.value)}
                                    className="flex-1 rounded-lg bg-white/5 border-white/10 text-white text-sm focus:border-green-500 focus:ring-green-500"
                                  >
                                    {exercises.map((exercise) => (
                                      <option key={exercise.id} value={exercise.id} className="bg-[#1e293b]">
                                        {exercise.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExerciseFromGroup(index, exIndex)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {ex.tracking_type === 'duration' ? (
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={ex.duration_seconds || 60}
                                        onChange={(e) => handleGroupExerciseChange(index, exIndex, 'duration_seconds', parseInt(e.target.value))}
                                        min="0"
                                        step="10"
                                        placeholder="Durée (s)"
                                        className="w-full rounded bg-white/5 border-white/10 text-white text-xs focus:border-green-500 focus:ring-green-500"
                                      />
                                    </div>
                                  ) : ex.tracking_type === 'distance' ? (
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={ex.distance_meters || 1000}
                                        onChange={(e) => handleGroupExerciseChange(index, exIndex, 'distance_meters', parseInt(e.target.value))}
                                        min="0"
                                        step="100"
                                        placeholder="Distance (m)"
                                        className="w-full rounded bg-white/5 border-white/10 text-white text-xs focus:border-green-500 focus:ring-green-500"
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div>
                                        <input
                                          type="number"
                                          value={ex.sets}
                                          onChange={(e) => handleGroupExerciseChange(index, exIndex, 'sets', parseInt(e.target.value))}
                                          min="1"
                                          max="10"
                                          placeholder="Séries"
                                          className="w-full rounded bg-white/5 border-white/10 text-white text-xs focus:border-green-500 focus:ring-green-500"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="number"
                                          value={ex.reps}
                                          onChange={(e) => handleGroupExerciseChange(index, exIndex, 'reps', parseInt(e.target.value))}
                                          min="1"
                                          max="100"
                                          placeholder="Reps"
                                          className="w-full rounded bg-white/5 border-white/10 text-white text-xs focus:border-green-500 focus:ring-green-500"
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <input
                                      type="number"
                                      value={ex.rest_time}
                                      onChange={(e) => handleGroupExerciseChange(index, exIndex, 'rest_time', parseInt(e.target.value))}
                                      min="0"
                                      max="600"
                                      step="15"
                                      placeholder="Repos"
                                      className="w-full rounded bg-white/5 border-white/10 text-white text-xs focus:border-green-500 focus:ring-green-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddExerciseToGroup(index)}
                            className="w-full py-2 text-sm text-green-400 hover:bg-green-500/10 rounded-lg transition-colors border border-green-500/30 border-dashed"
                          >
                            + Ajouter un exercice
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Heure *
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Mode de paiement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'online' })}
                      className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'online'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className={`w-6 h-6 ${formData.payment_method === 'online' ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                        <span className={`text-sm font-medium ${formData.payment_method === 'online' ? 'text-blue-300' : 'text-gray-300'
                          }`}>
                          En ligne
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Payé lors de la réservation
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'in_person' })}
                      className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'in_person'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className={`w-6 h-6 ${formData.payment_method === 'in_person' ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                        <span className={`text-sm font-medium ${formData.payment_method === 'in_person' ? 'text-blue-300' : 'text-gray-300'
                          }`}>
                          Sur place
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Payé à la séance
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes pour le client (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                      }
                    }}
                    rows={4}
                    placeholder="Instructions spéciales pour le client..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-6 bg-white/5">
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else if (step === 1) {
                    setStep(0);
                    setSessionMode(null);
                    setSelectedSessionId('');
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              >
                {step > 0 ? (
                  <>
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </>
                ) : (
                  'Annuler'
                )}
              </button>

              {((sessionMode === 'new' && step < 3) || (sessionMode === 'existing' && step < 1) || step === 0) ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (step === 0 && sessionMode !== null) {
                      setStep(1);
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  disabled={!canGoNext()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-bold"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-bold"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? (sessionMode === 'existing' ? 'Planification...' : 'Création...') : 'Planifier'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
