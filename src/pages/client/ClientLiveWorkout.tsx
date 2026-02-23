import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle, Timer, Plus, Minus, X, ChevronLeft, ArrowRight } from 'lucide-react';
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
  distance_meters?: number;
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
          if (prev !== null && prev > 0) {
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    if (restTimer === 0) {
      handleAutoAdvance();
      // handleAutoAdvance will also setRestTimer(null), but just to be sure:
      setRestTimer(null);
    }
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

  const startRestPhase = (duration: number) => {
    // We respect the configured rest time, even in Flow Mode,
    // so coaches can insert transitions for circuits if desired.
    if (duration > 0) {
      setRestTimer(duration);
    } else {
      handleAutoAdvance();
    }
  };

  const handlePauseTimer = () => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: false } : null);
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

      // Use RPC for safe data fetching
      const { data: exercisesData, error: exercisesError } = await supabase
        .rpc('get_client_session_exercises', {
          p_session_id: targetSessionId
        });

      if (exercisesError) throw exercisesError;

      const exerciseList = (exercisesData || []).map((se: any) => ({
        id: se.exercise_id,
        name: se.exercise_name,
        description: se.exercise_description,
        sets: se.sets,
        reps: se.reps,
        rest_time: se.rest_time,
        instructions: se.instructions,
        order_index: se.order_index,
        tracking_type: se.tracking_type,
        track_reps: se.track_reps,
        track_weight: se.track_weight,
        track_duration: se.track_duration,
        track_distance: se.track_distance,
        video_url: se.video_url,
        duration_seconds: se.duration_seconds,
        distance_meters: se.distance_meters,
        group: se.group_id ? {
          id: se.group_id,
          type: se.group_type,
          name: se.group_name,
          duration_seconds: se.group_duration,
          repetitions: se.group_repetitions
        } : null
      }));

      setExercises(exerciseList);
      console.log('LIVE WORKOUT EXERCISES DETAILS:', JSON.stringify(exerciseList, null, 2)); // FULL DEBUG LOG

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
      const exerciseIds = exerciseList.map((e: Exercise) => e.id);

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
      exerciseList.forEach((ex: Exercise) => {
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


        const isFlowGroup = ex.group?.type === 'circuit' || ex.group?.type === 'interval';
        const numSets = isFlowGroup && ex.group?.repetitions ? ex.group.repetitions : (ex.group?.type === 'amrap' ? 50 : ex.sets);

        initialCompleted[ex.id] = {
          sets: Array(numSets).fill(null).map((_, idx) => {
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
          startRestPhase(currentExercise.rest_time);
        } else {
          // Standard
          if (!isLastSet) {
            startRestPhase(currentExercise.rest_time);
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

  const isFlowMode = currentExercise?.group?.type === 'circuit' || currentExercise?.group?.type === 'amrap';
  const isCircuit = currentExercise?.group?.type === 'circuit';
  const isAmrap = currentExercise?.group?.type === 'amrap';
  const isInterval = currentExercise?.group?.type === 'interval';

  // Match the Session Builder's "Mode" logic:
  // If the coach programmed a duration, they selected "Temps" mode, which hides Reps/Weight in the builder.
  const hasProgrammedDuration = (currentExercise?.duration_seconds || 0) > 0;
  const hasProgrammedDistance = (currentExercise?.distance_meters || 0) > 0;

  let showWeightInput = false;
  let showRepsInput = false;
  let showDurationInput = false;

  if (hasProgrammedDuration) {
    showDurationInput = true;
    // Hide reps/weight by default if it's a duration drill, unless explicitly configured to track both
    showWeightInput = currentExercise?.track_weight === true;
    showRepsInput = currentExercise?.track_reps === true;
  } else if (hasProgrammedDistance) {
    showWeightInput = currentExercise?.track_weight === true;
    showRepsInput = currentExercise?.track_reps === true;
  } else {
    showWeightInput = currentExercise?.tracking_type === 'reps_weight' || currentExercise?.track_weight === true;
    showRepsInput = currentExercise?.tracking_type === 'reps_weight' || currentExercise?.track_reps === true;
    showDurationInput = currentExercise?.track_duration === true;
  }

  // Fallback to duration if nothing is explicitly configured
  if (!showWeightInput && !showRepsInput && !showDurationInput && !hasProgrammedDistance) {
    showDurationInput = true;
  }

  return (
    <div className="fixed inset-0 bg-[#09090b] text-white font-sans flex flex-col overflow-hidden z-50 selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {!isFlowMode ? (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_50%_-20%,rgba(79,68,233,0.15),transparent_70%)]" />
            <div className="absolute bottom-0 left-0 w-2/3 h-1/3 bg-[radial-gradient(circle_at_0%_100%,rgba(79,68,233,0.1),transparent_50%)]" />
          </>
        ) : (
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,rgba(9,9,11,0)_70%)]" />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 p-0 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)] overflow-y-auto no-scrollbar">
        {/* Header - Compact */}
        <header className="flex items-center justify-between px-6 pt-4 pb-4 shrink-0">
          <button
            onClick={() => navigate('/client/appointments')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#18181b]/50 text-white hover:bg-[#18181b] transition-colors border border-white/5"
          >
            <ChevronLeft className="w-6 h-6 text-gray-300" />
          </button>

          <div className="flex flex-col items-center">
            {isFlowMode ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[10px] font-bold tracking-wider uppercase border border-orange-500/20">
                    {currentExercise.group?.name || currentExercise.group?.type}
                  </span>
                </div>
                {(isCircuit || isInterval) && (
                  <span className="text-sm font-medium text-slate-400">
                    Tour {activeSetIndex + 1}/{currentExercise.group?.repetitions || currentExercise.sets}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1">
                  Exercice {currentExerciseIndex + 1}/{exercises.length}
                </span>
                <div className="h-1 w-16 rounded-full bg-[#18181b] overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>

          <div className="w-10 h-10" /> {/* Spacer for centering */}
        </header>

        {/* Exercise Title & Meta */}
        <div className="px-6 py-2 text-center shrink-0">
          {!isFlowMode && (
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">SÉRIE EN COURS</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight mb-1">{currentExercise.name}</h1>
          <p className="text-sm text-white/50 font-medium truncate max-w-[300px] mx-auto opacity-70">
            {sessionData.session?.name}
          </p>
        </div>

        {/* Video Player Section */}
        {currentExercise.video_url && (
          <div className="px-6 mb-6 mt-4 shrink-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#18181b] shadow-2xl ring-1 ring-white/10">
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
          </div>
        )}

        {/* Block Timer (AMRAP / INTERVAL) */}
        {currentExercise?.group?.duration_seconds && (isAmrap || isInterval) && (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="text-6xl font-black text-orange-500 tabular-nums tracking-tight drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              {Math.floor(currentExercise.group.duration_seconds / 60)}:{(currentExercise.group.duration_seconds % 60).toString().padStart(2, '0')}
            </div>
            <span className="text-xs font-medium text-orange-500/60 uppercase tracking-widest mt-1">Temps Restant</span>
          </div>
        )}

        {/* Set Navigation Bar (Hidden for flow mode) */}
        {!isFlowMode && completedExercises[currentExercise.id]?.sets && (
          <div className="px-6 mb-6 flex justify-center w-full shrink-0 overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center">
              {completedExercises[currentExercise.id].sets.map((s, idx) => {
                const isActive = idx === activeSetIndex;
                const isCompleted = s.completed;

                return (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveSetIndex(idx)}>
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 border border-green-500/30 flex items-center justify-center transition-transform active:scale-95">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : isActive ? (
                        <div className="relative w-12 h-12 rounded-full bg-indigo-500/10 border-2 border-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] z-10">
                          <span className="text-sm font-bold">{idx + 1}</span>
                          <div className="absolute inset-0 rounded-full border border-indigo-500 animate-ping opacity-20"></div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/10 text-white/40 flex items-center justify-center opacity-50 transition-transform active:scale-95 hover:opacity-100 hover:bg-[#27272a]">
                          <span className="text-xs font-medium">{idx + 1}</span>
                        </div>
                      )}
                      <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-indigo-400' : isCompleted ? 'text-green-500/80' : 'text-white/30'}`}>
                        {isActive ? 'Courante' : isCompleted ? 'Validé' : 'À venir'}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {idx < completedExercises[currentExercise.id].sets.length - 1 && (
                      <div className={`w-4 h-[2px] rounded-full mx-2 ${isCompleted ? 'bg-green-500/30' : 'bg-white/10 opacity-50'}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timer Card Overlay (If Resting) */}
        {restTimer !== null && restTimer > 0 && (
          <div className="absolute inset-4 z-50 flex items-center justify-center bg-[#09090b]/90 backdrop-blur-xl rounded-3xl border border-indigo-500/20 animate-in fade-in zoom-in duration-300">
            <div className="text-center w-full max-w-sm">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 animate-pulse">
                <Timer className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="text-6xl font-black text-white mb-2 tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">{restTimer}</div>
              <p className="text-indigo-200/70 text-sm font-medium uppercase tracking-wide mb-8">Repos - Soufflez un peu</p>
              <button
                onClick={handleAutoAdvance}
                className="w-full py-4 bg-white hover:bg-gray-100 rounded-xl text-black font-bold text-lg transition-all active:scale-95 shadow-lg"
              >
                Reprendre maintenant
              </button>
            </div>
          </div>
        )}

        {/* Active Data Card (Glassmorphic) */}
        {activeSet && (
          <div className="px-6 flex-1 flex flex-col justify-end pb-8">
            <div className="bg-[#18181b]/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/5">
              {/* Decorative gradient inside card */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${isFlowMode ? 'bg-orange-500/20' : 'bg-indigo-500/20'} rounded-full blur-3xl pointer-events-none`}></div>

              {activeSet.isGhost && (
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-white/5">
                    Historique Pré-rempli
                  </span>
                </div>
              )}

              {/* Status Header for mobile if needed, or omit to keep clean */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 mt-4 mb-6 relative z-10">
                {/* Weight Input */}
                {showWeightInput && (
                  <div className="flex-1 flex flex-col items-center">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Poids (kg)</label>
                    <div className="flex items-center justify-between w-full bg-[#27272a] rounded-2xl p-1 h-16 ring-1 ring-white/5 focus-within:ring-white/20 transition-all">
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'weight', Math.max(0, activeSet.weight - 2.5))}
                        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white rounded-xl active:bg-white/5 transition-colors"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          value={activeSet.weight || ''}
                          onChange={(e) => handleUpdateSet(activeSetIndex, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-transparent text-center text-4xl font-bold text-white border-none focus:ring-0 p-0 font-display [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'weight', activeSet.weight + 2.5)}
                        className={`w-12 h-12 flex items-center justify-center text-${isFlowMode ? 'orange' : 'indigo'}-500 hover:text-${isFlowMode ? 'orange' : 'indigo'}-400 rounded-xl active:bg-white/5 transition-colors`}
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                {showWeightInput && showRepsInput && (
                  <div className="hidden sm:block w-[1px] h-12 bg-white/10 mx-2 self-center"></div>
                )}

                {/* Reps Input */}
                {showRepsInput && (
                  <div className="flex-1 flex flex-col items-center">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Reps</label>
                    <div className="flex items-center justify-between w-full bg-[#27272a] rounded-2xl p-1 h-16 ring-1 ring-white/5 focus-within:ring-white/20 transition-all">
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'reps', Math.max(0, activeSet.reps - 1))}
                        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white rounded-xl active:bg-white/5 transition-colors"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={activeSet.reps || ''}
                        onChange={(e) => handleUpdateSet(activeSetIndex, 'reps', parseFloat(e.target.value) || 0)}
                        className="w-16 bg-transparent text-center text-4xl font-bold text-white border-none focus:ring-0 p-0 font-display [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        placeholder="0"
                      />
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'reps', activeSet.reps + 1)}
                        className={`w-12 h-12 flex items-center justify-center text-${isFlowMode ? 'orange' : 'indigo'}-500 hover:text-${isFlowMode ? 'orange' : 'indigo'}-400 rounded-xl active:bg-white/5 transition-colors`}
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                {showRepsInput && showDurationInput && (
                  <div className="hidden sm:block w-[1px] h-12 bg-white/10 mx-2 self-center"></div>
                )}

                {/* Duration Logic  */}
                {showDurationInput && (
                  <div className="flex-1 flex flex-col items-center">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Durée (s)</label>
                    <div className="flex items-center justify-between w-full bg-[#27272a] rounded-2xl p-1 h-16 ring-1 ring-white/5 focus-within:ring-white/20 transition-all mb-2">
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'duration_seconds', Math.max(5, (activeSet.duration_seconds || 60) - 10))}
                        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white rounded-xl active:bg-white/5 transition-colors"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={activeSet.duration_seconds || 60}
                        onChange={(e) => handleUpdateSet(activeSetIndex, 'duration_seconds', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent text-center text-3xl font-bold text-white border-none focus:ring-0 p-0 font-display [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        placeholder="60"
                      />
                      <button
                        onClick={() => handleUpdateSet(activeSetIndex, 'duration_seconds', (activeSet.duration_seconds || 60) + 10)}
                        className={`w-12 h-12 flex items-center justify-center text-${isFlowMode ? 'orange' : 'indigo'}-500 hover:text-${isFlowMode ? 'orange' : 'indigo'}-400 rounded-xl active:bg-white/5 transition-colors`}
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                    <button onClick={() => handleStartTimer(activeSetIndex, activeSet.duration_seconds || 60)} className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-${isFlowMode ? 'orange' : 'indigo'}-500/20 text-${isFlowMode ? 'orange' : 'indigo'}-400 border border-${isFlowMode ? 'orange' : 'indigo'}-500/30 transition-active active:scale-95`}>
                      <Play className="fill-current w-4 h-4" /> Lancer Chrono
                    </button>
                  </div>
                )}
              </div>

              {/* In-Card Timer Override (If Active Timer) */}
              {activeTimer && activeTimer.setIndex === activeSetIndex && (
                <div className={`mt-2 mb-6 rounded-2xl p-6 border text-center relative overflow-hidden h-32 flex flex-col items-center justify-center ${activeTimer.isPreStart ? 'bg-red-600/20 border-red-500/30' : 'bg-indigo-600/20 border-indigo-500/30'}`}>
                  <div className={`text-5xl font-black tabular-nums tracking-tighter mb-2 ${activeTimer.isPreStart ? 'text-red-500' : 'text-white'}`}>
                    {activeTimer.isPreStart
                      ? activeTimer.preStartTimeLeft
                      : `${Math.floor(activeTimer.timeLeft / 60)}:${(activeTimer.timeLeft % 60).toString().padStart(2, '0')}`
                    }
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handlePauseTimer} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      {activeTimer.isRunning ? <Pause className="fill-white w-4 h-4" /> : <Play className="fill-white w-4 h-4 ml-1" />}
                    </button>
                    <button onClick={handleStopTimer} className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const isLastExercise = currentExerciseIndex === exercises.length - 1;
                        const isLastSet = activeSetIndex === (currentExercise.sets || 0) - 1;

                        if (isLastExercise && isLastSet && !isAmrap && activeSet.completed) {
                          handleCompleteWorkout();
                        } else {
                          handleCompleteSet(activeSetIndex);
                        }
                        setActiveTimer(null);
                      }}
                      className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"
                      title="Valider la série"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Next Up Preview for Flow Mode */}
              {isFlowMode && (
                <div className="flex items-center gap-3 pt-4 pb-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">À Suivre</span>
                    <span className="text-sm text-slate-200 font-semibold truncate max-w-[200px]">
                      {(() => {
                        const groupExercises = exercises.filter(e => e.group?.id === currentExercise.group?.id);
                        const currentGroupIndex = groupExercises.findIndex(e => e.id === currentExercise.id);
                        if (currentGroupIndex < groupExercises.length - 1) return groupExercises[currentGroupIndex + 1].name;
                        return groupExercises[0].name;
                      })()}
                    </span>
                  </div>
                  <div className="ml-auto text-slate-500">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              {!activeTimer && (
                <button
                  onClick={() => {
                    const isLastExercise = currentExerciseIndex === exercises.length - 1;
                    const isLastSet = activeSetIndex === (currentExercise.sets || 0) - 1;

                    if (isLastExercise && isLastSet && !isAmrap && activeSet.completed) {
                      handleCompleteWorkout();
                    } else {
                      handleCompleteSet(activeSetIndex);
                    }
                  }}
                  className={`
                      relative w-full group overflow-hidden rounded-xl p-4 transition-all active:scale-[0.98]
                      ${(currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1 && activeSet.completed && !isAmrap && !isCircuit)
                      ? 'bg-indigo-600 shadow-[0_0_20px_-5px_rgba(79,68,233,0.5)]'
                      : isFlowMode
                        ? 'bg-orange-500 shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]'
                        : activeSet.completed
                          ? 'bg-[#27272a] border border-white/10 text-white' // Subtle completed state
                          : 'bg-indigo-600 shadow-[0_0_20px_-5px_rgba(79,68,233,0.5)]'
                    }
                    `}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <div className="relative flex items-center justify-center gap-2 z-10">
                    <span className={`font-bold text-lg tracking-wide ${activeSet.completed && !isFlowMode && !(currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1) ? 'text-white' : 'text-white'}`}>
                      {(currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1 && activeSet.completed && !isAmrap && !isCircuit)
                        ? 'Terminer la séance'
                        : isFlowMode
                          ? 'Valider & Suivant'
                          : activeSet.completed ? 'Modifier la série' : 'Valider la série'
                      }
                    </span>
                    {(!activeSet.completed || isFlowMode || (currentExerciseIndex === exercises.length - 1 && activeSetIndex === (currentExercise.sets || 0) - 1)) && (
                      <CheckCircle className={`w-5 h-5 ${isFlowMode ? 'text-white' : 'text-white'} group-hover:translate-x-1 transition-transform`} />
                    )}
                  </div>
                </button>
              )}

            </div>
          </div>
        )}
      </div>

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
        isLastExercise={
          currentExerciseIndex === exercises.length - 1 &&
          (currentExercise?.group?.type === 'amrap'
            ? false
            : activeSetIndex >= ((currentExercise?.group?.type === 'circuit' || currentExercise?.group?.type === 'interval')
              ? (currentExercise.group?.repetitions || 1)
              : (currentExercise?.sets || 1)) - 1
          )
        }
      />

    </div >
  );
}

export default ClientLiveWorkout;
