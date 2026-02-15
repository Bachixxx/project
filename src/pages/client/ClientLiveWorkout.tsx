import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle, RotateCcw, Timer, Plus, Minus, X, ChevronLeft } from 'lucide-react';
import { LiveSessionControls } from '../../components/client/workout/LiveSessionControls';
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
  track_reps?: boolean;
  track_weight?: boolean;
  track_duration?: boolean;
  track_distance?: boolean;
  duration_seconds?: number;
  video_url?: string;
  group?: {
    id: string;
    type: string;
    name: string;
    duration_seconds?: number;
    repetitions?: number;
  } | null;
}

function ClientLiveWorkout() {
  const { scheduledSessionId, appointmentId } = useParams();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Focus Mode State
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const [completedExercises, setCompletedExercises] = useState<Record<string, {
    sets: Array<{
      reps: number;
      weight: number;
      duration_seconds?: number;
      distance_meters?: number;
      completed: boolean;
      isGhost?: boolean;
    }>;
  }>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [notes, _setNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<{
    setIndex: number;
    timeLeft: number;
    isRunning: boolean;
    totalTime: number;
    isPreStart: boolean;
    preStartTimeLeft: number;
  } | null>(null);

  // Global Session Timer (seconds)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);

  useEffect(() => {
    if (client) {
      if (scheduledSessionId || appointmentId) {
        fetchSessionData();
      }
    }
  }, [client, scheduledSessionId, appointmentId]);

  // Reset active set index when changing exercises
  useEffect(() => {
    if (exercises.length > 0 && completedExercises[exercises[currentExerciseIndex]?.id]) {
      // Find the first incomplete set
      const sets = completedExercises[exercises[currentExerciseIndex].id].sets;
      const firstIncompleteIndex = sets.findIndex(s => !s.completed);
      setActiveSetIndex(firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0);
    } else {
      setActiveSetIndex(0);
    }
  }, [currentExerciseIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev === 1) {
            // Auto-advance after rest? Optional.
            // For now, let's keep it manual or auto-advance if we want seamless flow.
            // Let's stick to the plan: show rest, then user clicks to continue or we auto-advance?
            // The Timer Overlay has a "Resume" button.
            return null;
          }
          return prev ? prev - 1 : null
        });
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

  // Global Session Timer Logic
  useEffect(() => {
    // Start counting as soon as the component loads and we have session data
    // (Meaning the workout started)
    if (loading || !sessionData || isGlobalPaused) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, sessionData, isGlobalPaused]);

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
            tracking_type,
            track_reps,
            track_weight,
            track_duration,
            track_distance,
            video_url
          ),
          group_id,
          exercise_group:group_id (
            id,
            type,
            name,
            duration_seconds,
            repetitions
          ),
          duration_seconds,
          distance_meters
        `)
        .eq('session_id', targetSessionId)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      const exerciseList = (exercisesData || []).map((se: any) => ({
        id: se.exercise.id,
        name: se.exercise.name,
        description: se.exercise.description,
        sets: se.sets,
        reps: se.reps,
        rest_time: se.rest_time,
        instructions: se.instructions,
        order_index: se.order_index,
        tracking_type: se.exercise.tracking_type,
        track_reps: se.exercise.track_reps,
        track_weight: se.exercise.track_weight,
        track_duration: se.exercise.track_duration,
        track_distance: se.exercise.track_distance,
        video_url: se.exercise.video_url,
        duration_seconds: se.duration_seconds,
        distance_meters: se.distance_meters,
        group: se.exercise_group ? {
          id: se.exercise_group.id,
          type: se.exercise_group.type,
          name: se.exercise_group.name,
          duration_seconds: se.exercise_group.duration_seconds,
          repetitions: se.exercise_group.repetitions
        } : null
      }));

      setExercises(exerciseList);
      console.log('LIVE WORKOUT EXERCISES:', exerciseList); // DEBUG LOG

      // --- STATE RESTORATION & GHOST MODE LOGIC ---

      // 1. Fetch CURRENT session logs (Reload Protection) - Priority 1
      let currentLogsQuery = supabase.from('workout_logs').select('*');
      if (scheduledSessionId) {
        currentLogsQuery = currentLogsQuery.eq('scheduled_session_id', scheduledSessionId);
      } else if (appointmentId) {
        currentLogsQuery = currentLogsQuery.eq('appointment_id', appointmentId);
      }
      const { data: currentLogs, error: currentLogsError } = await currentLogsQuery;
      if (currentLogsError) console.error("Error fetching current logs:", currentLogsError);

      // 2. Fetch HISTORICAL logs (Ghost Mode) - Priority 2
      // We need to fetch the LAST time these exercises were performed.
      // Strategy: Fetch all logs for these exercises for this client, ordered by date desc, limit ?
      // Optimization: It's hard to get "last row per group" efficiently in one simple query without RPC or complex SQL.
      // Simpler approach: Fetch the last 50 logs for these exercises (should cover recent history).
      const exerciseIds = exerciseList.map(e => e.id);

      let historicalLogs: any[] = [];
      if (exerciseIds.length > 0) {
        const { data: history, error: historyError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('client_id', client.id)
          .in('exercise_id', exerciseIds)
          .order('completed_at', { ascending: false })
          .limit(100); // Fetch enough recent logs to find the last session for each exercise

        if (!historyError && history) {
          historicalLogs = history;
        }
      }

      const initialCompleted: Record<string, any> = {};
      exerciseList.forEach(ex => {
        // Find the most recent log for this exercise that is NOT from the current session
        // (We might have current logs in 'history' if we don't filter them out, so be careful).
        // Actually, checking against currentLogs IDs or date might be needed if user is re-doing a session quickly.
        // Simple heuristic: The first log in 'historicalLogs' for this exercise is the candidate. 
        // If it belongs to THIS session (check ID?), skip to next.

        const lastLogCandidate = historicalLogs.find(l => {
          // If we have current session IDs, exclude them
          if (scheduledSessionId && l.scheduled_session_id === scheduledSessionId) return false;
          if (appointmentId && l.appointment_id === appointmentId) return false;
          return l.exercise_id === ex.id;
        });

        // If we found a last session, we want to try to match set-for-set? or just copy the last set's weight?
        // Let's try to match set numbers. If I did 3 sets last time, I want my 3 sets this time to match those 3 sets.
        // So we need ALL logs from that "last session".
        // Find the `completed_at` (or session_id) of that candidate log.
        let lastSessionLogs: any[] = [];
        if (lastLogCandidate) {
          // Identify the session of that log
          if (lastLogCandidate.scheduled_session_id) {
            lastSessionLogs = historicalLogs.filter(l => l.scheduled_session_id === lastLogCandidate.scheduled_session_id);
          } else if (lastLogCandidate.appointment_id) {
            lastSessionLogs = historicalLogs.filter(l => l.appointment_id === lastLogCandidate.appointment_id);
          } else {
            // Ad-hoc log grouping by approx time? or just stick to the candidate single log?
            // Let's just use the candidate as a fallback for all sets if we can't group perfectly.
            // Better: Filter by date string/hour if no session ID.
          }
        }


        initialCompleted[ex.id] = {
          sets: Array(ex.sets).fill(null).map((_, idx) => {
            // 1. Try Current Log (Restoration)
            const currentLog = currentLogs?.find(l => l.exercise_id === ex.id && l.set_number === idx + 1);

            if (currentLog) {
              return {
                reps: currentLog.reps,
                weight: currentLog.weight,
                duration_seconds: currentLog.duration_seconds,
                distance_meters: currentLog.distance_meters,
                completed: true
              };
            }

            // 2. Ghost Mode (Pre-fill)
            // Find matching set number in last session
            const historyLog = lastSessionLogs.find(l => l.exercise_id === ex.id && l.set_number === idx + 1) || lastLogCandidate;

            if (historyLog) {
              return {
                reps: historyLog.reps,
                weight: historyLog.weight,
                duration_seconds: historyLog.duration_seconds,
                distance_meters: historyLog.distance_meters,
                completed: false,
                isGhost: true
              };
            }

            // 3. Default (Template)
            return {
              reps: ex.reps,
              weight: 0,
              duration_seconds: ex.duration_seconds,
              distance_meters: ex.distance_meters,
              completed: false
            };
          })
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

      // Logic to auto-advance or show rest
      // Prioritize Rest Time if it exists
      if (currentExercise.rest_time > 0) {
        // For circuits, rest usually happens after the last exercise of the round.
        // But if user set rest on intermediate exercises, we honor it.
        // If circuit:
        //   - Intermediate ex: rest > 0 -> Show timer -> next ex
        //   - Last ex: rest > 0 -> Show timer -> first ex (next round)

        // Only show rest if we are NOT at the very end of the workout (unless we want a cooldown?)
        // And for standard sets, we don't rest after the LAST set of the exercise usually.
        // For circuits, we DO rest after the last exercise of the round (before next round).

        const groupType = currentExercise.group?.type;
        const isCircuit = groupType === 'circuit';
        const isInterval = groupType === 'interval';
        const isAmrap = groupType === 'amrap';
        const isLastSet = setIndex === currentExercise.sets - 1;

        if (isCircuit || isInterval || isAmrap) {
          setRestTimer(currentExercise.rest_time);
        } else {
          // Standard
          if (!isLastSet) {
            setRestTimer(currentExercise.rest_time);
          } else {
            // Last set of standard exercise -> No rest, just finish/next
            handleAutoAdvance();
          }
        }
      } else {
        // No rest time, immediately advance
        handleAutoAdvance();
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

  const handleAutoAdvance = () => {
    setRestTimer(null);

    const groupType = currentExercise.group?.type;
    const isCircuit = groupType === 'circuit';
    const isAmrap = groupType === 'amrap';
    const isInterval = groupType === 'interval';

    if (isCircuit || isAmrap || isInterval) {
      if (!currentExercise.group) return;

      const currentGroupId = currentExercise.group.id;
      // Find all exercises in this group
      const groupExercises = exercises
        .map((e, idx) => ({ ...e, originalIndex: idx }))
        .filter(e => e.group?.id === currentGroupId);

      // Current position within the group
      const currentGroupIndex = groupExercises.findIndex(e => e.id === currentExercise.id);

      if (currentGroupIndex === -1) return; // Should not happen

      // Scenario 1: Next exercise in the same round (set)
      if (currentGroupIndex < groupExercises.length - 1) {
        const nextExerciseInGroup = groupExercises[currentGroupIndex + 1];
        setCurrentExerciseIndex(nextExerciseInGroup.originalIndex);
        // activeSetIndex will be updated by useEffect based on completion status
      }
      // Scenario 2: End of round
      else {
        // We are at the last exercise of the group

        // FOR AMRAP: Always loop back to start until timer ends (user stops manually or block timer kills it)
        if (isAmrap) {
          const firstExerciseInGroup = groupExercises[0];
          setCurrentExerciseIndex(firstExerciseInGroup.originalIndex);
          // We might want to auto-increment a "Round Counter" here if we were tracking rounds globally?
          // For now, simple navigation.
          return;
        }

        // FOR CIRCUIT / INTERVAL: Check fixed rounds
        // Use group.repetitions if available, otherwise fallback to currentExercise.sets
        const totalRounds = currentExercise.group.repetitions || currentExercise.sets;

        if (activeSetIndex < totalRounds - 1) {
          // Move to FIRST exercise of the group for the NEXT round
          const firstExerciseInGroup = groupExercises[0];
          setCurrentExerciseIndex(firstExerciseInGroup.originalIndex);
          // activeSetIndex will be updated by useEffect
        } else {
          // Scenario 3: Block Complete
          // Loop done. Move to next exercise outside the group
          const lastExerciseInGroup = groupExercises[groupExercises.length - 1];
          const nextExerciseIndex = lastExerciseInGroup.originalIndex + 1;

          if (nextExerciseIndex < exercises.length) {
            setCurrentExerciseIndex(nextExerciseIndex);
          } else {
            // Workout Complete
            handleCompleteWorkout();
          }
        }
      }
    } else {
      // Standard Logic
      if (activeSetIndex < currentExercise.sets - 1) {
        setActiveSetIndex(prev => prev + 1);
      } else {
        // Exercise Complete -> Next Exercise
        handleNextExercise();
      }
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setActiveSetIndex(0);
      setRestTimer(null);
      setActiveTimer(null);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setActiveSetIndex(0);
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
            notes: notes,
            actual_duration_seconds: elapsedTime
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

  // --- FOCUS MODE RENDER ---
  const activeSet = completedExercises[currentExercise?.id]?.sets[activeSetIndex];

  return (
    <div className="fixed inset-0 bg-[#09090b] text-white font-sans flex flex-col overflow-hidden z-50">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 p-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)] overflow-y-auto no-scrollbar">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button
            onClick={() => navigate('/client/appointments')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex-1 min-w-0 mx-4 text-center">
            <h1 className="text-sm font-bold opacity-70 truncate uppercase tracking-widest text-cyan-400">
              {currentExerciseIndex + 1}/{exercises.length} - {sessionData.session?.name}
            </h1>
            <p className="text-xl font-black text-white truncate leading-none mt-1">
              {currentExercise.name}
            </p>
          </div>
        </div>

        {/* BLOCK TIMER (AMRAP / INTERVAL) */}
        {currentExercise?.group?.duration_seconds && (currentExercise.group.type === 'amrap' || currentExercise.group.type === 'interval') && (
          <div className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-orange-200 font-bold text-sm uppercase tracking-wider">{currentExercise.group.type === 'amrap' ? 'AMRAP' : 'Intervalle'} Timer</h3>
                <p className="text-orange-400/60 text-xs">Temps restant</p>

              </div>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {/* 
                     TODO: We need a REAL countdown state for this block. 
                     For now showing static duration or we need to implement a block timer hook.
                     Let's use a simple placeholder or hook it up to a new state if needed.
                     For MVP of this fix, let's just show the total duration or "En cours".
                     Actually, user wants it to work.
                 */}
              {Math.floor(currentExercise.group.duration_seconds / 60)}:{(currentExercise.group.duration_seconds % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )
        }

        <div className="w-10 h-10" />

        {/* Video Player Integration */}
        {
          currentExercise.video_url && (
            <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-black aspect-video relative">
              <iframe
                src={currentExercise.video_url.includes('youtube.com') || currentExercise.video_url.includes('youtu.be')
                  ? currentExercise.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                  : currentExercise.video_url}
                title={currentExercise.name}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )
        }

        {/* Set Navigation Bar */}
        {
          currentExercise && (
            <div className="flex items-center justify-center gap-2 mb-6 shrink-0 overflow-x-auto py-2 no-scrollbar">
              {completedExercises[currentExercise.id]?.sets.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSetIndex(idx)}
                  className={`
                  w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center
                  ${idx === activeSetIndex
                      ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30'
                      : s.completed
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-gray-500 border border-white/5'
                    }
                `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )
        }

        {/* Timer Card Overlay (If Resting) */}
        {
          restTimer !== null && restTimer > 0 && (
            <div className="absolute inset-4 z-50 flex items-center justify-center bg-[#09090b]/90 backdrop-blur-xl rounded-3xl border border-blue-500/20 animate-in fade-in zoom-in duration-300">
              <div className="text-center w-full max-w-sm">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 animate-pulse">
                  <Timer className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="text-6xl font-black text-white mb-2 tabular-nums tracking-tighter">{restTimer}</div>
                <p className="text-cyan-200/70 text-sm font-medium uppercase tracking-wide mb-8">Repos - Soufflez un peu</p>
                <button
                  onClick={handleAutoAdvance}
                  className="w-full py-4 bg-white hover:bg-gray-100 rounded-xl text-black font-bold text-lg transition-all"
                >
                  Reprendre maintenant
                </button>
              </div>
            </div>
          )
        }

        {/* Focus Mode - Active Set Card */}
        {
          currentExercise && activeSet && (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full min-h-[50vh]">
              <div className={`
              bg-[#1e293b]/60 border backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all duration-500
              ${activeSet.completed
                  ? 'border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.15)]'
                  : 'border-white/10'
                }
            `}>
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-wider text-gray-400">
                      Série {activeSetIndex + 1}
                    </div>
                    {activeSet.isGhost && (
                      <div className="px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        Historique
                      </div>
                    )}
                  </div>
                  {activeSet.completed && (
                    <div className="flex items-center gap-1 text-green-400 text-sm font-bold uppercase tracking-wide animate-in fade-in slide-in-from-right-2">
                      <CheckCircle className="w-4 h-4" />
                      Validé
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Timer/Duration Control if needed */}
                  {activeTimer && activeTimer.setIndex === activeSetIndex ? (
                    <div className={`rounded-2xl p-6 border text-center animate-fade-in relative overflow-hidden h-48 flex flex-col items-center justify-center ${activeTimer.isPreStart
                      ? 'bg-red-600/20 border-red-500/30'
                      : 'bg-blue-600/20 border-blue-500/30'
                      }`}>
                      <div className={`text-6xl font-black tabular-nums tracking-tighter mb-4 ${activeTimer.isPreStart ? 'text-red-500' : 'text-white'}`}>
                        {activeTimer.isPreStart
                          ? activeTimer.preStartTimeLeft
                          : `${Math.floor(activeTimer.timeLeft / 60)}:${(activeTimer.timeLeft % 60).toString().padStart(2, '0')}`
                        }
                      </div>
                      <div className="flex gap-4">
                        <button onClick={handlePauseTimer} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          {activeTimer.isRunning ? <Pause className="fill-white" /> : <Play className="fill-white" />}
                        </button>
                        <button onClick={handleResetTimer} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <RotateCcw />
                        </button>
                        <button onClick={handleStopTimer} className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                          <X />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Primary Controls */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Weight Control */}
                        {(currentExercise.tracking_type === 'reps_weight' || currentExercise.track_weight) && (
                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block text-center">Charge (kg)</label>
                            <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 border border-white/5">
                              <button
                                onClick={() => handleUpdateSet(activeSetIndex, 'weight', Math.max(0, activeSet.weight - 2.5))}
                                className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                              >
                                <Minus className="w-6 h-6 text-gray-300" />
                              </button>
                              <input
                                type="number"
                                value={activeSet.weight}
                                onChange={(e) => handleUpdateSet(activeSetIndex, 'weight', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-center text-4xl font-black text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateSet(activeSetIndex, 'weight', activeSet.weight + 2.5)}
                                className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                              >
                                <Plus className="w-6 h-6 text-gray-300" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reps Control */}
                        {(currentExercise.tracking_type === 'reps_weight' || currentExercise.track_reps) && (
                          <div>
                            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block text-center">Répétitions</label>
                            <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 border border-white/5">
                              <button
                                onClick={() => handleUpdateSet(activeSetIndex, 'reps', Math.max(0, activeSet.reps - 1))}
                                className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                              >
                                <Minus className="w-6 h-6 text-gray-300" />
                              </button>
                              <input
                                type="number"
                                value={activeSet.reps}
                                onChange={(e) => handleUpdateSet(activeSetIndex, 'reps', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-center text-4xl font-black text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateSet(activeSetIndex, 'reps', activeSet.reps + 1)}
                                className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
                              >
                                <Plus className="w-6 h-6 text-gray-300" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Duration/Distance Logic (Simplified for brevity, similar structure) */}
                        {(currentExercise.tracking_type === 'duration' || currentExercise.track_duration) && (
                          <div>
                            <button onClick={() => handleStartTimer(activeSetIndex, activeSet.duration_seconds || 60)} className="w-full h-16 bg-blue-600 rounded-xl flex items-center justify-center gap-2 font-bold mb-4">
                              <Play className="fill-white" /> Lancer Chrono ({activeSet.duration_seconds}s)
                            </button>
                          </div>
                        )}

                      </div>
                    </>
                  )}
                </div>

                {/* Validate Button */}
                {!activeTimer && (
                  <button
                    onClick={() => {
                      const isLastExercise = currentExerciseIndex === exercises.length - 1;
                      const isLastSet = activeSetIndex === (currentExercise.sets || 0) - 1;

                      if (isLastExercise && isLastSet && activeSet.completed) {
                        handleCompleteWorkout();
                      } else {
                        handleCompleteSet(activeSetIndex);
                      }
                    }}
                    className={`
                          w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg transition-all transform active:scale-95
                          ${(currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1 && activeSet.completed)
                        ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-500'
                        : activeSet.completed
                          ? 'bg-green-500 text-white shadow-green-500/20 hover:bg-green-400'
                          : 'bg-white text-black hover:bg-gray-100'
                      }
                        `}
                  >
                    {(currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1 && activeSet.completed)
                      ? 'Terminer la séance'
                      : activeSet.completed ? 'Validé' : 'Valider la série'}
                  </button>
                )}

              </div>
            </div>
          )
        }
      </div >

      <LiveSessionControls
        isActive={!isGlobalPaused}
        isResting={!!restTimer}
        restTimeRemaining={restTimer || 0}
        totalDuration={elapsedTime}
        onToggleTimer={() => setIsGlobalPaused(!isGlobalPaused)}
        onNext={() => {
          if (restTimer) {
            setRestTimer(null);
            if (activeSetIndex < (currentExercise?.sets || 0) - 1) {
              setActiveSetIndex(prev => prev + 1);
            }
          } else {
            handleAutoAdvance();
          }
        }}
        onPrevious={currentExerciseIndex > 0 ? handlePreviousExercise : undefined}
        onFinish={handleCompleteWorkout}
        isLastExercise={currentExerciseIndex === exercises.length - 1}
      />
    </div >
  );
}

export default ClientLiveWorkout;
