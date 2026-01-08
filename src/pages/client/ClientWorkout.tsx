import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Play, Pause, CheckCircle, Timer, Dumbbell, Clock, Settings, Save, ArrowRight, RotateCcw, X } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  rest_time: number;
  order_index: number;
}

interface WorkoutSession {
  id: string;
  client_program_id: string;
  date: string;
  notes: string;
  completed_exercises: Record<string, {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }>;
}

function ClientWorkout() {
  const { clientProgramId } = useParams();
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [initialRestTime, setInitialRestTime] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sound effect ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (client && clientProgramId) {
      fetchProgramData();
    }
    // Preload timer sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2860/2860-preview.mp3');
  }, [client, clientProgramId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev === 1) {
            // Timer finished
            audioRef.current?.play().catch(() => { });
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const fetchProgramData = async () => {
    try {
      // Fetch program details and exercises
      const { data: programData, error: programError } = await supabase
        .from('client_programs')
        .select(`
          id,
          program:programs!inner (
            id,
            name,
            description,
            program_sessions!inner (
              id,
              order_index,
              session:sessions!inner (
                id,
                name,
                description,
                duration_minutes,
                session_exercises!inner (
                  id,
                  sets,
                  reps,
                  rest_time,
                  order_index,
                  exercise:exercises!inner (
                    id,
                    name,
                    description
                  )
                )
              )
            )
          )
        `)
        .eq('id', clientProgramId)
        .single();

      if (programError) throw programError;

      setProgram(programData);

      // Extract exercises from all sessions
      const allExercises: Exercise[] = [];
      programData.program.program_sessions
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .forEach((ps: any) => {
          ps.session.session_exercises
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .forEach((se: any) => {
              allExercises.push({
                id: se.exercise.id,
                name: se.exercise.name,
                description: se.exercise.description,
                sets: se.sets,
                reps: se.reps,
                rest_time: se.rest_time,
                order_index: se.order_index,
              });
            });
        });

      setExercises(allExercises);

      // Check for existing session today
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_program_id', clientProgramId)
        .eq('date', today);

      if (sessionError) throw sessionError;

      if (sessions && sessions.length > 0) {
        setSession(sessions[0]);
        setNotes(sessions[0].notes || '');
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('workout_sessions')
          .insert([{
            client_program_id: clientProgramId,
            date: today,
            completed_exercises: {},
          }])
          .select()
          .single();

        if (createError) throw createError;
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error fetching program data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseProgress = async (exerciseId: string, setIndex: number, data: any) => {
    if (!session) return;

    try {
      const currentExercise = exercises[currentExerciseIndex];
      const updatedExercises = {
        ...session.completed_exercises,
        [exerciseId]: {
          sets: [
            ...(session.completed_exercises[exerciseId]?.sets || Array(currentExercise?.sets || 0).fill({
              reps: currentExercise?.reps || 0,
              weight: 0,
              completed: false,
            })),
          ],
        },
      };

      updatedExercises[exerciseId].sets[setIndex] = {
        ...updatedExercises[exerciseId].sets[setIndex],
        ...data,
      };

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed_exercises: updatedExercises,
          notes,
        })
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? {
        ...prev,
        completed_exercises: updatedExercises,
      } : null);

      // Start rest timer if set is completed and not already running
      if (data.completed && currentExercise?.rest_time && !restTimer) {
        setInitialRestTime(currentExercise.rest_time);
        setRestTimer(currentExercise.rest_time);
      }

      // Check if workout is complete
      const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
      let completedSets = 0;
      Object.values(updatedExercises).forEach(ex => {
        ex.sets.forEach(s => { if (s.completed) completedSets++; });
      });

      if (completedSets === totalSets) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

    } catch (error) {
      console.error('Error updating exercise progress:', error);
    }
  };

  const calculateProgress = () => {
    if (!session || !exercises.length) return 0;

    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
    const completedSets = Object.values(session.completed_exercises).reduce(
      (acc, ex) => acc + ex.sets.filter(set => set.completed).length,
      0
    );

    return Math.round((completedSets / totalSets) * 100);
  };

  const currentExercise = exercises[currentExerciseIndex];
  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">

      {/* Top Navigation */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link
          to="/client/workouts"
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>

        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-white/90">{program?.program?.name}</span>
          <span className="text-xs text-blue-400 font-medium">
            Exercice {currentExerciseIndex + 1} / {exercises.length}
          </span>
        </div>

        <div className="w-8">
          {/* Placeholder for balance */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 max-w-2xl mx-auto w-full">

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progression globale</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Exercise Card */}
        {currentExercise && (
          <div className="space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{currentExercise.name}</h1>
              <p className="text-gray-400 text-sm leading-relaxed">{currentExercise.description || "Aucune description disponible."}</p>
            </div>

            {/* Timer Banner (if active) */}
            {restTimer && (
              <div className="sticky top-20 z-40 bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 animate-fade-in flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-xs font-bold uppercase">Repos</p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRestTimer(prev => (prev ? prev + 30 : 30))}
                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setRestTimer(null)}
                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Sets List */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider px-2">
                <div className="col-span-2 text-center">Série</div>
                <div className="col-span-3 text-center">kg</div>
                <div className="col-span-3 text-center">Reps</div>
                <div className="col-span-4 text-center">Action</div>
              </div>

              {Array.from({ length: currentExercise.sets }).map((_, setIndex) => {
                const setData = session?.completed_exercises[currentExercise.id]?.sets[setIndex];
                const isCompleted = setData?.completed;

                return (
                  <div
                    key={setIndex}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-all ${isCompleted
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/5'
                      }`}
                  >
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <span className={`text-lg font-bold ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>{setIndex + 1}</span>
                      <span className="text-[10px] text-gray-500 hidden sm:block">Série</span>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={setData?.weight || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            // Only update if changed visually? 
                            // In a real app we might want debounce, but for now let's update on completion or blur
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            updateExerciseProgress(currentExercise.id, setIndex, {
                              weight: val,
                              // Don't auto-complete on blur
                            });
                          }
                        }}
                        className={`w-full bg-black/20 text-center py-2 rounded-lg text-white font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none border border-transparent ${isCompleted ? 'text-green-400' : ''}`}
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder={currentExercise.reps.toString()}
                        defaultValue={setData?.reps || currentExercise.reps}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            updateExerciseProgress(currentExercise.id, setIndex, {
                              reps: val,
                              // Don't auto-complete on blur
                            });
                          }
                        }}
                        className={`w-full bg-black/20 text-center py-2 rounded-lg text-white font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none border border-transparent ${isCompleted ? 'text-green-400' : ''}`}
                      />
                    </div>

                    <div className="col-span-4 flex justify-center">
                      <button
                        onClick={() => {
                          const weightInput = document.querySelectorAll(`input`)[setIndex * 2] as HTMLInputElement;
                          const repsInput = document.querySelectorAll(`input`)[setIndex * 2 + 1] as HTMLInputElement;

                          updateExerciseProgress(currentExercise.id, setIndex, {
                            completed: !isCompleted,
                            weight: parseFloat(weightInput.value) || 0,
                            reps: parseFloat(repsInput.value) || currentExercise.reps
                          });
                        }}
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${isCompleted
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : 'Valider'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={async () => {
              if (session) {
                await supabase
                  .from('workout_sessions')
                  .update({ notes })
                  .eq('id', session.id);
              }
            }}
            placeholder="Notes sur la séance..."
            className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
          />
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
            disabled={currentExerciseIndex === 0}
            className="px-4 py-3 bg-white/5 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <span className="text-sm font-medium text-gray-400">
            {currentExercise?.name}
          </span>

          <button
            onClick={() => {
              if (currentExerciseIndex < exercises.length - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
              } else {
                // Finish workout
                setShowExitConfirm(true); // Re-use logic or just redirect
                // For now, since "Exit" button logic wasn't fully fleshed out in my mind, just link back
              }
            }}
            className={`px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg ${currentExerciseIndex === exercises.length - 1
                ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
              }`}
          >
            {currentExerciseIndex === exercises.length - 1 ? (
              <Link to="/client/workouts" className="flex items-center gap-2">Terminer <CheckCircle className="w-5 h-5" /></Link>
            ) : (
              <>Suivant <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

export default ClientWorkout;