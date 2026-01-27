import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle, RotateCcw, Timer, ChevronRight, Plus, Minus, ChevronLeft, Dumbbell, Activity, X } from 'lucide-react';
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
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
  duration_seconds?: number;
  distance_meters?: number;
}

function ClientLiveWorkout() {
  const { scheduledSessionId, appointmentId } = useParams();
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
      duration_seconds?: number;
      distance_meters?: number;
      completed: boolean;
    }>;
  }>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<{
    setIndex: number;
    timeLeft: number;
    isRunning: boolean;
    totalTime: number;
    isPreStart: boolean;
    preStartTimeLeft: number;
  } | null>(null);

  useEffect(() => {
    if (client) {
      if (scheduledSessionId || appointmentId) {
        fetchSessionData();
      }
    }
  }, [client, scheduledSessionId, appointmentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => (prev ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && activeTimer.isRunning) {
      interval = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;

          if (prev.isPreStart) {
            if (prev.preStartTimeLeft <= 1) {
              if (navigator.vibrate) navigator.vibrate(200);
              return { ...prev, isPreStart: false, preStartTimeLeft: 0 };
            }
            return { ...prev, preStartTimeLeft: prev.preStartTimeLeft - 1 };
          }

          if (prev.timeLeft <= 1) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return { ...prev, timeLeft: 0, isRunning: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning, activeTimer?.timeLeft, activeTimer?.isPreStart, activeTimer?.preStartTimeLeft]);

  const handleStartTimer = (setIndex: number, duration: number) => {
    if (activeTimer && activeTimer.setIndex === setIndex) {
      setActiveTimer(prev => prev ? { ...prev, isRunning: true } : null);
    } else {
      setActiveTimer({
        setIndex,
        timeLeft: duration,
        totalTime: duration,
        isRunning: true,
        isPreStart: true,
        preStartTimeLeft: 5
      });
    }
  };

  const handlePauseTimer = () => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: false } : null);
  };

  const handleResetTimer = () => {
    if (activeTimer) {
      setActiveTimer({
        ...activeTimer,
        timeLeft: activeTimer.totalTime,
        isRunning: false,
        isPreStart: true,
        preStartTimeLeft: 5
      });
    }
  };

  const handleStopTimer = () => {
    setActiveTimer(null);
  };

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      let targetSessionId;

      if (scheduledSessionId) {
        const { data: scheduledSessionsData, error } = await supabase
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
          .limit(1);

        if (error) throw error;
        const scheduledSession = scheduledSessionsData?.[0];

        if (!scheduledSession) throw new Error('Séance introuvable');

        setSessionData(scheduledSession);
        targetSessionId = scheduledSession.session.id;

      } else if (appointmentId) {
        console.log('Fetching appointment flow for ID:', appointmentId);

        // 1. Verify Registration
        const { data: registration, error: regError } = await supabase
          .from('appointment_registrations')
          .select('*')
          .eq('appointment_id', appointmentId)
          .eq('client_id', client.id)
          .limit(1)
          .maybeSingle();

        if (regError) {
          console.error('Registration fetch error:', regError);
          throw regError;
        }
        if (!registration) {
          console.error('Registration not found for client:', client.id, 'appointment:', appointmentId);
          throw new Error('Vous n\'êtes pas inscrit à cette séance');
        }

        // 2. Fetch Appointment (Simple)
        const { data: appointment, error: appError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .limit(1)
          .maybeSingle();

        if (appError) {
          console.error('Appointment fetch error:', appError);
          throw appError;
        }
        if (!appointment) {
          console.error('Appointment NOT found (possibly RLS blocking):', appointmentId);
          throw new Error('Séance introuvable (Accès refusé au rendez-vous)');
        }

        console.log('Appointment found:', appointment);

        // 3. Fetch Session content
        if (!appointment.session_id) {
          throw new Error('Cette séance n\'a pas de contenu associé (session_id manquant)');
        }

        const { data: sessionDataObj, error: sessionError } = await supabase
          .from('sessions')
          .select('id, name, description, duration_minutes, difficulty_level')
          .eq('id', appointment.session_id)
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          console.error('Session fetch error:', sessionError);
          throw sessionError;
        }
        if (!sessionDataObj) throw new Error('Contenu de la séance introuvable (Session deleted?)');

        // 10-minute window check
        const now = new Date();
        const start = new Date(appointment.start);
        const diffMs = start.getTime() - now.getTime();
        const tenMinutesMs = 10 * 60 * 1000;

        if (diffMs > tenMinutesMs) {
          setLoading(false);
          setSessionData({
            isTooEarly: true,
            start: appointment.start,
            title: appointment.title
          });
          return;
        }

        setSessionData({
          session: sessionDataObj,
          scheduled_date: appointment.start,
          notes: null
        });
        targetSessionId = sessionDataObj.id;
      }

      if (!targetSessionId) throw new Error('Session ID not found');

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
            equipment,
            tracking_type
          ),
          duration_seconds,
          distance_meters
        `)
        .eq('session_id', targetSessionId)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      const exerciseList = (exercisesData || []).map(se => ({
        id: se.exercise.id,
        name: se.exercise.name,
        description: se.exercise.description,
        sets: se.sets,
        reps: se.reps,
        rest_time: se.rest_time,
        instructions: se.instructions,
        order_index: se.order_index,
        tracking_type: se.exercise.tracking_type,
        duration_seconds: se.duration_seconds,
        distance_meters: se.distance_meters
      }));

      setExercises(exerciseList);

      const initialCompleted = {};
      exerciseList.forEach(ex => {
        initialCompleted[ex.id] = {
          sets: Array(ex.sets).fill(null).map(() => ({
            reps: ex.reps,
            weight: 0,
            duration_seconds: ex.duration_seconds,
            distance_meters: ex.distance_meters,
            completed: false
          }))
        };
      });
      setCompletedExercises(initialCompleted);

    } catch (error: any) {
      console.error('Error fetching session:', error);
      alert(`Erreur: ${error.message || 'Erreur lors du chargement de la séance'}`);
      // navigate('/client/appointments'); // Stay on page to see error, or redirect? Redirect acts as a "hard crash" for user.
      navigate('/client/appointments');
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentExerciseIndex];

  const handleCompleteSet = async (setIndex: number) => {
    if (!currentExercise) return;

    const currentSet = completedExercises[currentExercise.id]?.sets[setIndex];
    if (!currentSet) return;

    const newCompletedState = !currentSet.completed;

    // Optimistic UI update
    setCompletedExercises(prev => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        sets: prev[currentExercise.id].sets.map((set, idx) =>
          idx === setIndex ? { ...set, completed: newCompletedState } : set
        )
      }
    }));

    if (newCompletedState) {
      try {
        const logData: any = {
          client_id: client.id,
          exercise_id: currentExercise.id,
          set_number: setIndex + 1,
          reps: currentSet.reps,
          weight: currentSet.weight,
          duration_seconds: currentSet.duration_seconds,
          distance_meters: currentSet.distance_meters,
          completed_at: new Date().toISOString()
        };

        let conflictTarget = '';
        if (scheduledSessionId) {
          logData.scheduled_session_id = scheduledSessionId;
          conflictTarget = 'scheduled_session_id,exercise_id,set_number';
        } else if (appointmentId) {
          logData.appointment_id = appointmentId;
          // We created a constraint for this: idx_workout_logs_appointment_unique
          // BUT supbase-js onConflict expects column names.
          // The constraint is on (appointment_id, exercise_id, set_number).
          conflictTarget = 'appointment_id,exercise_id,set_number';
        }

        const { error } = await supabase
          .from('workout_logs')
          .upsert(logData, {
            onConflict: conflictTarget
          });

        if (error) console.error('Error logging workout:', error);
      } catch (err) {
        console.error('Error logging workout:', err);
      }

      if (currentExercise.rest_time > 0 && setIndex < currentExercise.sets - 1) {
        setRestTimer(currentExercise.rest_time);
      }
    } else {
      try {
        const matchQuery: any = {
          exercise_id: currentExercise.id,
          set_number: setIndex + 1
        };
        if (scheduledSessionId) matchQuery.scheduled_session_id = scheduledSessionId;
        else if (appointmentId) matchQuery.appointment_id = appointmentId;

        await supabase
          .from('workout_logs')
          .delete()
          .match(matchQuery);
      } catch (err) {
        console.error('Error removing workout log:', err);
      }
    }
  };

  const handleUpdateSet = (setIndex: number, field: 'reps' | 'weight' | 'duration_seconds' | 'distance_meters', value: number) => {
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
      setActiveTimer(null);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setRestTimer(null);
      setActiveTimer(null);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      if (scheduledSessionId) {
        const { error } = await supabase
          .from('scheduled_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: notes
          })
          .eq('id', scheduledSessionId);
        if (error) throw error;
      }
      // For appointments, we don't have a specific 'completed' status per client on the appointment itself.
      // We rely on logs. Maybe update registration?
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sessionData?.isTooEarly) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />

        <div className="relative z-10 max-w-md w-full bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <Timer className="w-10 h-10 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{sessionData.title}</h1>
          <p className="text-gray-400 mb-8">
            La séance n'a pas encore commencé. L'accès sera débloqué 10 minutes avant le début du cours.
          </p>

          <div className="bg-black/40 rounded-xl p-4 mb-8 border border-white/5">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Début du cours</p>
            <p className="text-3xl font-black text-white tabular-nums">
              {new Date(sessionData.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(sessionData.start).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <button
            onClick={() => navigate('/client/appointments')}
            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors border border-white/5"
          >
            Retour au planning
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="text-white text-xl mb-4">Aucun exercice trouvé</div>
        <button
          onClick={() => navigate('/client/appointments')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 font-sans pb-24">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/client/appointments')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {sessionData.session?.name}
            </h1>
            <p className="text-sm text-cyan-400 font-medium">
              Exercice {currentExerciseIndex + 1}/{exercises.length}
            </p>
          </div>
        </div>

        {/* Timer Card */}
        {restTimer !== null && restTimer > 0 && (
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/20 rounded-2xl p-6 text-center animate-pulse backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 z-0"></div>
            <div className="relative z-10">
              <Timer className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
              <div className="text-4xl font-black text-white mb-1 tabular-nums tracking-tighter">{restTimer}s</div>
              <p className="text-cyan-200/70 text-sm font-medium uppercase tracking-wide">Temps de repos</p>
              <button
                onClick={() => setRestTimer(null)}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm font-medium transition-all"
              >
                Passer le repos
              </button>
            </div>
          </div>
        )}

        {/* Main Exercise Card */}
        {currentExercise && (
          <div className="bg-[#1e293b]/60 border border-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{currentExercise.name}</h2>
                {currentExercise.description && (
                  <p className="text-gray-400 text-sm">{currentExercise.description}</p>
                )}
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <Dumbbell className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            {currentExercise.instructions && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6 flex gap-3">
                <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-200/80 text-sm leading-relaxed">{currentExercise.instructions}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Séries</div>
                <div className="text-white text-2xl font-black">{currentExercise.sets}</div>
              </div>
              {currentExercise.tracking_type === 'duration' ? (
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Durée</div>
                  <div className="text-white text-2xl font-black">{Math.floor((currentExercise.duration_seconds || 0) / 60)}:{(currentExercise.duration_seconds || 0) % 60 < 10 ? '0' : ''}{(currentExercise.duration_seconds || 0) % 60}</div>
                </div>
              ) : currentExercise.tracking_type === 'distance' ? (
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Distance</div>
                  <div className="text-white text-2xl font-black">{currentExercise.distance_meters}m</div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Reps</div>
                  <div className="text-white text-2xl font-black">{currentExercise.reps}</div>
                </div>
              )}
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Repos</div>
                <div className="text-white text-2xl font-black">{currentExercise.rest_time}s</div>
              </div>
            </div>

            {/* Sets List */}
            <div className="space-y-3">
              {completedExercises[currentExercise.id]?.sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${set.completed
                    ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : 'bg-[#0f172a]/50 border-white/5'
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold uppercase tracking-wider ${set.completed ? 'text-green-400' : 'text-gray-400'}`}>
                      Série {idx + 1}
                    </span>
                    <button
                      onClick={() => handleCompleteSet(idx)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${set.completed
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                      <CheckCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {activeTimer && activeTimer.setIndex === idx ? (
                    /* Active Timer View */
                    <div className={`rounded-xl p-4 border text-center animate-fade-in relative overflow-hidden ${activeTimer.isPreStart
                      ? 'bg-red-600/20 border-red-500/30'
                      : 'bg-blue-600/20 border-blue-500/30'
                      }`}>
                      <div className={`absolute inset-0 animate-pulse z-0 ${activeTimer.isPreStart ? 'bg-red-500/5' : 'bg-blue-500/5'
                        }`}></div>
                      <div className="relative z-10">
                        <div className={`text-5xl font-black tabular-nums tracking-tighter mb-2 ${activeTimer.isPreStart ? 'text-red-500' : 'text-white'
                          }`}>
                          {activeTimer.isPreStart
                            ? activeTimer.preStartTimeLeft
                            : `${Math.floor(activeTimer.timeLeft / 60)}:${(activeTimer.timeLeft % 60).toString().padStart(2, '0')}`
                          }
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${activeTimer.isPreStart ? 'text-red-400' : 'text-blue-300'
                          }`}>
                          {activeTimer.isPreStart ? 'Préparez-vous' : 'Temps restant'}
                        </div>

                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={handlePauseTimer}
                            className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            {activeTimer.isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                          </button>
                          <button
                            onClick={handleResetTimer}
                            className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleStopTimer}
                            className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {currentExercise.tracking_type === 'duration' ? (
                        <div className="col-span-2">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Durée (secondes)</label>
                              <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                                <button
                                  onClick={() => handleUpdateSet(idx, 'duration_seconds', Math.max(0, (set.duration_seconds || 0) - 5))}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  value={set.duration_seconds || 0}
                                  onChange={(e) => handleUpdateSet(idx, 'duration_seconds', parseInt(e.target.value) || 0)}
                                  className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                                />
                                <button
                                  onClick={() => handleUpdateSet(idx, 'duration_seconds', (set.duration_seconds || 0) + 5)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartTimer(idx, set.duration_seconds || 60)}
                              className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                              <Play className="w-6 h-6 text-white fill-current ml-1" />
                            </button>
                          </div>
                        </div>
                      ) : currentExercise.tracking_type === 'distance' ? (
                        <div className="col-span-2">
                          <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Distance (m)</label>
                          <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                            <button
                              onClick={() => handleUpdateSet(idx, 'distance_meters', Math.max(0, (set.distance_meters || 0) - 50))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={set.distance_meters || 0}
                              onChange={(e) => handleUpdateSet(idx, 'distance_meters', parseInt(e.target.value) || 0)}
                              className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateSet(idx, 'distance_meters', (set.distance_meters || 0) + 50)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Répétitions</label>
                            <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                              <button
                                onClick={() => handleUpdateSet(idx, 'reps', Math.max(1, set.reps - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => handleUpdateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                                className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateSet(idx, 'reps', set.reps + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Poids (kg)</label>
                            <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                              <button
                                onClick={() => handleUpdateSet(idx, 'weight', Math.max(0, set.weight - 2.5))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                step="0.5"
                                value={set.weight}
                                onChange={(e) => handleUpdateSet(idx, 'weight', parseFloat(e.target.value) || 0)}
                                className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateSet(idx, 'weight', set.weight + 2.5)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1 px-6 py-4 bg-[#1e293b] border border-white/5 hover:bg-[#283548] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold transition-all"
          >
            Précédent
          </button>

          {currentExerciseIndex < exercises.length - 1 ? (
            <button
              onClick={handleNextExercise}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteWorkout}
              disabled={!allExercisesCompleted}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Terminer
            </button>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-[#1e293b]/60 border border-white/5 backdrop-blur-xl rounded-2xl p-6">
          <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">Notes de séance</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sensations, difficultés, points à améliorer..."
            className="w-full bg-black/20 text-white border border-white/10 rounded-xl p-4 min-h-[100px] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export default ClientLiveWorkout;
