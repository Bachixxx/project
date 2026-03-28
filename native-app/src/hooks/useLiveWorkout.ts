import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

export interface Exercise {
    id: string; // This is now session_exercise.id to guarantee uniqueness
    exercise_id: string; // The catalog exercise ID for logging to supabase
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
    track_calories?: boolean;
    duration_seconds?: number;
    distance_meters?: number;
    calories?: number;
    video_url?: string;
    group?: {
        id: string;
        type: string;
        name: string;
        duration_seconds?: number;
        repetitions?: number;
    } | null;
}

export interface SetData {
    reps: number;
    weight: number;
    duration_seconds?: number;
    distance_meters?: number;
    calories?: number;
    completed: boolean;
    isGhost?: boolean;
}

export interface ActiveTimer {
    setIndex: number;
    timeLeft: number;
    isRunning: boolean;
    totalTime: number;
    isPreStart: boolean;
    preStartTimeLeft: number;
}

export function useLiveWorkout(scheduledSessionId?: string, appointmentId?: string) {
    const { client } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [activeSetIndex, setActiveSetIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState<Record<string, { sets: SetData[] }>>({});
    const [elapsedTime, setElapsedTime] = useState(0);
    const [groupTimer, setGroupTimer] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [restTimer, setRestTimer] = useState<number | null>(null);
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

    // Active Timer (Intra-set countdown)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTimer && activeTimer.isRunning) {
            interval = setInterval(() => {
                setActiveTimer(prev => {
                    if (!prev) return null;

                    if (prev.isPreStart) {
                        if (prev.preStartTimeLeft <= 1) {
                            return { ...prev, isPreStart: false, preStartTimeLeft: 0 };
                        }
                        return { ...prev, preStartTimeLeft: prev.preStartTimeLeft - 1 };
                    }

                    if (prev.timeLeft <= 1) {
                        return { ...prev, timeLeft: 0, isRunning: false };
                    }
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer?.isRunning, activeTimer?.timeLeft, activeTimer?.isPreStart, activeTimer?.preStartTimeLeft]);

    // Global Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isLoading && !isPaused) {
            interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isLoading, isPaused]);

    // Group/AMRAP Timer Trigger
    useEffect(() => {
        const currentEx = exercises[currentExerciseIndex];
        if (currentEx?.group?.type === 'amrap' && currentEx.group.duration_seconds) {
            if (groupTimer === null) {
                setGroupTimer(currentEx.group.duration_seconds);
            }
        } else {
            setGroupTimer(null);
        }
    }, [currentExerciseIndex, exercises]);

    // Group/AMRAP Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (groupTimer !== null && groupTimer > 0 && !isPaused) {
            interval = setInterval(() => setGroupTimer(prev => (prev !== null ? prev - 1 : null)), 1000);
        }
        return () => clearInterval(interval);
    }, [groupTimer, isPaused]);

    // Rest Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (restTimer !== null && restTimer > 0) {
            interval = setInterval(() => setRestTimer(prev => (prev !== null ? prev - 1 : null)), 1000);
        } else if (restTimer === 0) {
            handleAutoAdvance();
            setRestTimer(null);
        }
        return () => clearInterval(interval);
    }, [restTimer]);

    useEffect(() => {
        if (client?.id && (scheduledSessionId || appointmentId)) {
            fetchSessionData();
        }
    }, [client?.id, scheduledSessionId, appointmentId]);

    useEffect(() => {
        if (exercises.length > 0) {
            const sets = completedExercises[exercises[currentExerciseIndex]?.id]?.sets || [];
            const firstIncomplete = sets.findIndex(s => !s.completed);
            setActiveSetIndex(firstIncomplete !== -1 ? firstIncomplete : 0);
        }
    }, [currentExerciseIndex]);

    async function fetchSessionData() {
        try {
            setIsLoading(true);
            let sessionData, targetSessionId;

            if (scheduledSessionId) {
                const { data, error } = await supabase
                    .from('scheduled_sessions')
                    .select(`*, session:sessions!inner (*)`)
                    .eq('id', scheduledSessionId)
                    .single();
                if (error) throw error;
                sessionData = data;
                targetSessionId = data.session.id;
            } else if (appointmentId) {
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`*, session:sessions!inner (*)`)
                    .eq('id', appointmentId)
                    .single();
                if (error) throw error;
                sessionData = data;
                targetSessionId = data.session.id;
            }

            setSession(sessionData);

            const { data: exercisesResponse, error: exError } = await supabase
                .rpc('get_client_session_exercises', { p_session_id: targetSessionId });

            if (exError) throw exError;

            const mappedExercises: Exercise[] = exercisesResponse.map((se: any) => ({
                id: se.id,
                exercise_id: se.exercise_id,
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
                track_calories: se.track_calories,
                video_url: se.video_url,
                duration_seconds: se.duration_seconds,
                distance_meters: se.distance_meters,
                calories: se.calories,
                group: se.group_id ? {
                    id: se.group_id,
                    type: se.group_type,
                    name: se.group_name,
                    duration_seconds: se.group_duration,
                    repetitions: se.group_repetitions
                } : null
            }));

            setExercises(mappedExercises);

            const exerciseIds = mappedExercises.map(e => e.exercise_id);
            const { data: currentLogs } = await supabase
                .from('workout_logs')
                .select('*')
                .match(scheduledSessionId ? { scheduled_session_id: scheduledSessionId } : { appointment_id: appointmentId });

            const { data: historyLogs } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('client_id', client?.id)
                .in('exercise_id', exerciseIds)
                .neq(scheduledSessionId ? 'scheduled_session_id' : 'appointment_id', scheduledSessionId || appointmentId)
                .order('completed_at', { ascending: false })
                .limit(100);

            const initialCompleted: Record<string, { sets: SetData[] }> = {};
            mappedExercises.forEach(ex => {
                const isFlow = ex.group?.type === 'circuit' || ex.group?.type === 'interval' || ex.group?.type === 'amrap';
                const numSets = isFlow && ex.group?.repetitions ? ex.group.repetitions : (ex.group?.type === 'amrap' ? 50 : ex.sets);

                const lastLogCandidate = historyLogs?.find(l => l.exercise_id === ex.exercise_id);
                const lastSessionLogs = lastLogCandidate
                    ? historyLogs?.filter(l => l.scheduled_session_id === lastLogCandidate.scheduled_session_id || l.appointment_id === lastLogCandidate.appointment_id) || []
                    : [];

                initialCompleted[ex.id] = {
                    sets: Array(numSets).fill(null).map((_, idx) => {
                        const current = currentLogs?.find(l => l.exercise_id === ex.exercise_id && l.set_number === idx + 1);
                        if (current) return { ...current, completed: true };

                        const ghost = lastSessionLogs.find(l => l.exercise_id === ex.exercise_id && l.set_number === idx + 1) || lastLogCandidate;
                        if (ghost) return { reps: ghost.reps, weight: ghost.weight, duration_seconds: ghost.duration_seconds, distance_meters: ghost.distance_meters, calories: ghost.calories, completed: false, isGhost: true };

                        return { reps: ex.reps, weight: 0, duration_seconds: ex.duration_seconds, distance_meters: ex.distance_meters, calories: ex.calories, completed: false };
                    })
                };
            });

            setCompletedExercises(initialCompleted);
        } catch (err: any) {
            console.error('Error fetching live session:', err);
            Alert.alert('Erreur', err.message || 'Impossible de charger la séance');
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdateSet = (exId: string, setIndex: number, data: Partial<SetData>) => {
        setCompletedExercises(prev => ({
            ...prev,
            [exId]: {
                ...prev[exId],
                sets: prev[exId].sets.map((s, i) => i === setIndex ? { ...s, ...data, isGhost: false } : s)
            }
        }));
    };

    const toggleSetCompletion = async (exId: string, setIndex: number) => {
        const currentEx = exercises.find(e => e.id === exId);
        if (!currentEx) return;

        const currentSet = completedExercises[exId].sets[setIndex];
        const newState = !currentSet.completed;

        handleUpdateSet(exId, setIndex, { completed: newState });

        if (newState) {
            const logData: any = {
                client_id: client?.id,
                exercise_id: currentEx.exercise_id,
                set_number: setIndex + 1,
                reps: currentSet.reps,
                weight: currentSet.weight,
                duration_seconds: currentSet.duration_seconds,
                distance_meters: currentSet.distance_meters,
                calories: currentSet.calories,
                completed_at: new Date().toISOString()
            };

            let onConflict = '';
            if (scheduledSessionId) {
                logData.scheduled_session_id = scheduledSessionId;
                onConflict = 'scheduled_session_id,exercise_id,set_number';
            } else if (appointmentId) {
                logData.appointment_id = appointmentId;
                onConflict = 'appointment_id,exercise_id,set_number';
            }

            await supabase.from('workout_logs').upsert(logData, { onConflict });

            if (currentEx.rest_time > 0) {
                setRestTimer(currentEx.rest_time);
            } else {
                handleAutoAdvance();
            }
        } else {
            const matchCriteria: any = {
                exercise_id: currentEx.exercise_id,
                set_number: setIndex + 1
            };
            if (scheduledSessionId) {
                matchCriteria.scheduled_session_id = scheduledSessionId;
            } else if (appointmentId) {
                matchCriteria.appointment_id = appointmentId;
            }

            await supabase.from('workout_logs').delete().match(matchCriteria);
        }
    };

    const handleAutoAdvance = () => {
        const currentEx = exercises[currentExerciseIndex];
        if (!currentEx) return;

        const isGroup = !!currentEx.group;
        if (isGroup) {
            const groupExs = exercises
                .map((e, idx) => ({ ...e, originalIndex: idx }))
                .filter(e => e.group?.id === currentEx.group?.id);

            const groupPos = groupExs.findIndex(e => e.id === currentEx.id);

            if (groupPos < groupExs.length - 1) {
                const nextEx = groupExs[groupPos + 1];
                setCurrentExerciseIndex(nextEx.originalIndex);
            } else {
                const rounds = currentEx.group?.repetitions || currentEx.sets;
                if (activeSetIndex < rounds - 1) {
                    const firstEx = groupExs[0];
                    setCurrentExerciseIndex(firstEx.originalIndex);
                } else {
                    const lastEx = groupExs[groupExs.length - 1];
                    const nextIdx = lastEx.originalIndex + 1;
                    if (nextIdx < exercises.length) setCurrentExerciseIndex(nextIdx);
                }
            }
        } else {
            if (activeSetIndex < currentEx.sets - 1) {
                setActiveSetIndex(prev => prev + 1);
            } else {
                if (currentExerciseIndex < exercises.length - 1) setCurrentExerciseIndex(prev => prev + 1);
            }
        }
    };

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

    const handleStopTimer = () => {
        setActiveTimer(null);
    };

    return {
        isLoading,
        session,
        exercises,
        currentExerciseIndex,
        setCurrentExerciseIndex,
        activeSetIndex,
        completedExercises,
        groupTimer,
        setGroupTimer,
        elapsedTime,
        isPaused,
        setIsPaused,
        restTimer,
        setRestTimer,
        activeTimer,
        handleUpdateSet,
        toggleSetCompletion,
        handleAutoAdvance,
        handleStartTimer,
        handlePauseTimer,
        handleStopTimer
    };
}
