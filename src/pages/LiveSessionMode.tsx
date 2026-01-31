import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveSession } from '../contexts/LiveSessionContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Play, Pause, Plus, Trash2, Save, Check, Dumbbell } from 'lucide-react';
import { ExerciseSelector } from '../components/library/ExerciseSelector';

interface WorkoutSet {
  id: string; // unique temp id
  reps: number;
  weight: number;
  completed: boolean;
}

interface ActiveExercise {
  id: string; // session_exercise_id
  exercise_id: string;
  name: string;
  order_index: number;
  rest_time: number;
  sets: WorkoutSet[];
}

export default function LiveSessionMode() {
  const { sessionId } = useParams();
  const { sessionState, endSession } = useLiveSession();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exercise Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: any;
    if (sessionState.isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState.isActive, isPaused]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_exercises(
            *,
            exercise: exercises(*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (data) {
        setSession(data);
        initializeActiveExercises(data.session_exercises);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExercises = async () => {
    if (availableExercises.length > 0) return;
    try {
      setLoadingExercises(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, difficulty_level, coach_id')
        .order('name');

      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddExercises = (selected: any[]) => {
    const newActiveExercises = [...activeExercises];
    let nextOrderIndex = newActiveExercises.length > 0
      ? Math.max(...newActiveExercises.map(e => e.order_index)) + 1
      : 0;

    selected.forEach(ex => {
      newActiveExercises.push({
        id: `temp-ex-${Date.now()}-${ex.id}`, // Temporary ID
        exercise_id: ex.id,
        name: ex.name,
        order_index: nextOrderIndex++,
        rest_time: 60,
        sets: [
          { id: `set-new-${Date.now()}-1`, reps: 10, weight: 0, completed: false },
          { id: `set-new-${Date.now()}-2`, reps: 10, weight: 0, completed: false },
          { id: `set-new-${Date.now()}-3`, reps: 10, weight: 0, completed: false }
        ]
      });
    });

    setActiveExercises(newActiveExercises);
    setIsPickerOpen(false);
  };

  const initializeActiveExercises = (exercises: any[]) => {
    const sorted = exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || [];
    const mapped: ActiveExercise[] = sorted.map((ex: any) => ({
      id: ex.id,
      exercise_id: ex.exercise.id,
      name: ex.exercise.name,
      order_index: ex.order_index,
      rest_time: ex.rest_time,
      sets: Array.from({ length: ex.sets }).map((_, idx) => ({
        id: `set-${ex.id}-${idx}`,
        reps: ex.reps,
        weight: 0, // Default weight
        completed: false
      }))
    }));
    setActiveExercises(mapped);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetUpdate = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: any) => {
    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets[setIndex] = {
      ...newExercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    setActiveExercises(newExercises);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const currentcomp = activeExercises[exerciseIndex].sets[setIndex].completed;
    handleSetUpdate(exerciseIndex, setIndex, 'completed', !currentcomp);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...activeExercises];
    const previousSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      id: `set-${Date.now()}`,
      reps: previousSet ? previousSet.reps : 10,
      weight: previousSet ? previousSet.weight : 0,
      completed: false
    });
    setActiveExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...activeExercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    setActiveExercises(newExercises);
  };

  const handleFinish = async () => {
    const confirmEnd = window.confirm("Terminer la séance ? Cela la marquera comme complétée.");
    if (!confirmEnd) return;

    try {
      setLoading(true);
      // 1. Log all completed sets
      const logsToInsert = [];
      const completedAt = new Date().toISOString();

      for (const ex of activeExercises) {
        for (let i = 0; i < ex.sets.length; i++) {
          const s = ex.sets[i];
          if (s.completed) {
            logsToInsert.push({
              client_id: sessionState.clientId,
              exercise_id: ex.exercise_id,
              set_number: i + 1,
              reps: s.reps,
              weight: s.weight,
              completed_at: completedAt,
              // context links
              scheduled_session_id: sessionState.scheduledSessionId || null,
              // program_session_id: sessionState.programSessionId || null // If table supports it
            });
          }
        }
      }

      if (logsToInsert.length > 0) {
        const { error } = await supabase.from('workout_logs').insert(logsToInsert);
        if (error) throw error;
      }

      // 2. Mark Scheduled Session as Completed (if applicable)
      if (sessionState.scheduledSessionId) {
        const { error: schedError } = await supabase
          .from('scheduled_sessions')
          .update({ status: 'completed', completed_at: completedAt })
          .eq('id', sessionState.scheduledSessionId);
        if (schedError) throw schedError;
      }

      // 3. Update Program Progress (if applicable)
      // For MVP, if linked to program, we might just assume it triggers next?
      // Let's stick to session completion for now.

      endSession();
      navigate(`/clients/${sessionState.clientId}`);

    } catch (error) {
      console.error("Error saving session:", error);
      alert("Erreur lors de la sauvegarde de la séance. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  if (!session) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">Séance introuvable</div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#0f172a] sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-mono text-2xl font-bold text-blue-400 tracking-wider bg-blue-500/10 px-4 py-1 rounded-lg border border-blue-500/20">
          {formatTime(elapsedTime)}
        </div>
        <button
          onClick={handleFinish}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          TERMINER
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-40">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 text-white">{session.name}</h1>
            <p className="text-gray-400 text-sm">{session.description}</p>
            <button
              onClick={() => {
                setIsPickerOpen(true);
                fetchAvailableExercises();
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Ajouter un exercice
            </button>
          </div>

          <div className="space-y-6">
            {activeExercises.map((ex, exIdx) => (
              <div key={ex.id} className="bg-[#1e293b]/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                {/* Exercise Header */}
                <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
                      {exIdx + 1}
                    </span>
                    <h3 className="font-bold text-lg text-white">{ex.name}</h3>
                  </div>
                  <div className="text-xs text-gray-400 font-mono bg-black/30 px-2 py-1 rounded">
                    Rest: {ex.rest_time}s
                  </div>
                </div>

                {/* Sets Table */}
                <div className="p-2">
                  <div className="grid grid-cols-10 gap-2 mb-2 px-2 text-xs uppercase text-gray-500 font-bold tracking-wider text-center">
                    <div className="col-span-1">Set</div>
                    <div className="col-span-3">kg</div>
                    <div className="col-span-3">Reps</div>
                    <div className="col-span-3">Valider</div>
                  </div>

                  <div className="space-y-2">
                    {ex.sets.map((set, setIdx) => (
                      <div key={set.id} className={`grid grid-cols-10 gap-2 items-center p-2 rounded-xl transition-all ${set.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-black/20 border border-transparent'}`}>
                        <div className="col-span-1 text-center font-bold text-gray-400">
                          {setIdx + 1}
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleSetUpdate(exIdx, setIdx, 'weight', parseFloat(e.target.value))}
                            className={`w-full bg-black/40 border border-white/10 rounded-lg py-2 px-1 text-center font-bold text-white focus:outline-none focus:border-blue-500 ${set.completed ? 'text-green-400' : ''}`}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleSetUpdate(exIdx, setIdx, 'reps', parseFloat(e.target.value))}
                            className={`w-full bg-black/40 border border-white/10 rounded-lg py-2 px-1 text-center font-bold text-white focus:outline-none focus:border-blue-500 ${set.completed ? 'text-green-400' : ''}`}
                          />
                        </div>
                        <div className="col-span-3 flex justify-center gap-2">
                          <button
                            onClick={() => toggleSetComplete(exIdx, setIdx)}
                            className={`w-full h-full min-h-[36px] rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Set Button */}
                  <button
                    onClick={() => addSet(exIdx)}
                    className="w-full mt-3 py-3 rounded-xl border border-dashed border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 flex items-center justify-center gap-2 text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une série
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-xl px-6 flex items-center justify-center gap-6 fixed bottom-0 w-full z-40">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl ${isPaused ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-white text-black shadow-white/20'}`}
        >
          {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
        </button>
      </div>

      {isPickerOpen && (
        <ExerciseSelector
          exercises={availableExercises}
          onSelect={handleAddExercises}
          onClose={() => setIsPickerOpen(false)}
          loading={loadingExercises}
        />
      )}
    </div>
  );
}
