import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle, RotateCcw, Timer, ChevronRight, Plus, Minus, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  rest_time: number;
  instructions: string;
  order_index: number;
}

function ClientLiveWorkout() {
  const { scheduledSessionId } = useParams();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Record<string, {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (client && scheduledSessionId) {
      fetchSessionData();
    }
  }, [client, scheduledSessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => (prev ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);

      // First, fetch the scheduled session with basic session info
      const { data: scheduledSession, error } = await supabase
        .from('scheduled_sessions')
        .select(`
          *,
          session:sessions!inner (
            id,
            name,
            description,
            duration_minutes,
            difficulty_level
          )
        `)
        .eq('id', scheduledSessionId)
        .eq('client_id', client.id)
        .single();

      if (error) {
        console.error('Error fetching scheduled session:', error);
        throw error;
      }

      if (!scheduledSession) {
        throw new Error('Session not found');
      }

      setSessionData(scheduledSession);

      // Now fetch the session exercises separately
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .select(`
          id,
          sets,
          reps,
          rest_time,
          instructions,
          order_index,
          exercise:exercises!inner (
            id,
            name,
            description,
            category,
            equipment
          )
        `)
        .eq('session_id', scheduledSession.session.id)
        .order('order_index', { ascending: true });

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        throw exercisesError;
      }

      const exerciseList = (exercisesData || []).map(se => ({
        id: se.exercise.id,
        name: se.exercise.name,
        description: se.exercise.description,
        sets: se.sets,
        reps: se.reps,
        rest_time: se.rest_time,
        instructions: se.instructions,
        order_index: se.order_index
      }));

      setExercises(exerciseList);

      const initialCompleted = {};
      exerciseList.forEach(ex => {
        initialCompleted[ex.id] = {
          sets: Array(ex.sets).fill(null).map(() => ({
            reps: ex.reps,
            weight: 0,
            completed: false
          }))
        };
      });
      setCompletedExercises(initialCompleted);

    } catch (error) {
      console.error('Error fetching session:', error);
      alert('Erreur lors du chargement de la séance');
      navigate('/client/appointments');
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentExerciseIndex];

  const handleCompleteSet = (setIndex: number) => {
    if (!currentExercise) return;

    setCompletedExercises(prev => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        sets: prev[currentExercise.id].sets.map((set, idx) =>
          idx === setIndex ? { ...set, completed: !set.completed } : set
        )
      }
    }));

    if (currentExercise.rest_time > 0 && setIndex < currentExercise.sets - 1) {
      setRestTimer(currentExercise.rest_time);
    }
  };

  const handleUpdateSet = (setIndex: number, field: 'reps' | 'weight', value: number) => {
    if (!currentExercise) return;

    setCompletedExercises(prev => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        sets: prev[currentExercise.id].sets.map((set, idx) =>
          idx === setIndex ? { ...set, [field]: value } : set
        )
      }
    }));
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setRestTimer(null);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setRestTimer(null);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', scheduledSessionId);

      if (error) throw error;

      alert('Entraînement terminé avec succès!');
      navigate('/client/appointments');
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Erreur lors de la sauvegarde de l\'entraînement');
    }
  };

  const allExercisesCompleted = exercises.every(ex =>
    completedExercises[ex.id]?.sets.every(set => set.completed)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!sessionData || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-white text-xl mb-4">Aucun exercice trouvé pour cette séance</div>
        <button
          onClick={() => navigate('/client/appointments')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Retour aux rendez-vous
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/client/appointments')}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">{sessionData.session?.name}</h1>
            <p className="text-white/60 text-sm">
              Exercice {currentExerciseIndex + 1} sur {exercises.length}
            </p>
          </div>
        </div>

        {restTimer !== null && restTimer > 0 && (
          <div className="glass-card p-6 text-center animate-pulse">
            <Timer className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <div className="text-4xl font-bold text-white mb-2">{restTimer}s</div>
            <p className="text-white/80">Temps de repos</p>
            <button
              onClick={() => setRestTimer(null)}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
            >
              Passer
            </button>
          </div>
        )}

        {currentExercise && (
          <div className="glass-card p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{currentExercise.name}</h2>
            {currentExercise.description && (
              <p className="text-white/80 mb-4">{currentExercise.description}</p>
            )}
            {currentExercise.instructions && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <p className="text-blue-200 text-sm">{currentExercise.instructions}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Séries</div>
                <div className="text-white text-2xl font-bold">{currentExercise.sets}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Répétitions</div>
                <div className="text-white text-2xl font-bold">{currentExercise.reps}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Repos</div>
                <div className="text-white text-2xl font-bold">{currentExercise.rest_time}s</div>
              </div>
            </div>

            <div className="space-y-3">
              {completedExercises[currentExercise.id]?.sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    set.completed
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Série {idx + 1}</span>
                    <button
                      onClick={() => handleCompleteSet(idx)}
                      className={`p-2 rounded-lg transition-colors ${
                        set.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-sm mb-1 block">Répétitions</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSet(idx, 'reps', Math.max(1, set.reps - 1))}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                          className="flex-1 bg-white/10 text-white text-center rounded px-2 py-1"
                        />
                        <button
                          onClick={() => handleUpdateSet(idx, 'reps', set.reps + 1)}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm mb-1 block">Poids (kg)</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSet(idx, 'weight', Math.max(0, set.weight - 2.5))}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(idx, 'weight', parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-white/10 text-white text-center rounded px-2 py-1"
                        />
                        <button
                          onClick={() => handleUpdateSet(idx, 'weight', set.weight + 2.5)}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            Précédent
          </button>
          {currentExerciseIndex < exercises.length - 1 ? (
            <button
              onClick={handleNextExercise}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteWorkout}
              disabled={!allExercisesCompleted}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Terminer l'entraînement
            </button>
          )}
        </div>

        <div className="glass-card p-6">
          <label className="block text-white font-medium mb-2">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajoutez des notes sur votre séance..."
            className="w-full bg-white/10 text-white rounded-lg p-3 min-h-[100px] placeholder-white/40"
          />
        </div>
      </div>
    </div>
  );
}

export default ClientLiveWorkout;
