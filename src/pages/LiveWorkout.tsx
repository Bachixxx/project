import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle, RotateCcw, Timer, ChevronRight, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  rest_time: number;
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

function LiveWorkout() {
  const { clientProgramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user && clientProgramId) {
      fetchProgramData();
    }
  }, [user, clientProgramId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => (prev ? prev - 1 : null));
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
          program:programs (
            id,
            name,
            description,
            program_exercises (
              id,
              exercise:exercises (
                id,
                name,
                description
              ),
              sets,
              reps,
              rest_time,
              order_index
            )
          ),
          client:clients (
            id,
            full_name
          )
        `)
        .eq('id', clientProgramId)
        .single();

      if (programError) throw programError;

      setProgram(programData);
      setExercises(
        programData.program.program_exercises
          .sort((a, b) => a.order_index - b.order_index)
          .map(pe => ({
            id: pe.exercise.id,
            name: pe.exercise.name,
            description: pe.exercise.description,
            sets: pe.sets,
            reps: pe.reps,
            rest_time: pe.rest_time,
          }))
      );

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

      // Start rest timer if set is completed
      if (data.completed && currentExercise?.rest_time) {
        setRestTimer(currentExercise.rest_time);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {program.client.full_name}
            </h1>
            <p className="text-white/80">
              {program.program.name}
            </p>
          </div>
          <div className="text-white text-right">
            <div className="text-2xl font-bold">{calculateProgress()}%</div>
            <div className="text-white/80">Completed</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Exercise List */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Exercises</h2>
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => setCurrentExercise(exercise)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                    currentExercise?.id === exercise.id
                      ? 'bg-white/20'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{exercise.name}</h3>
                    <p className="text-sm text-white/60">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session?.completed_exercises[exercise.id] && (
                      <div className="px-2 py-1 text-sm bg-white/10 rounded">
                        {session.completed_exercises[exercise.id].sets.filter(s => s.completed).length}
                        /{exercise.sets} sets
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Exercise */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
            {currentExercise ? (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  {currentExercise.name}
                </h2>
                {restTimer ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 mb-4">
                      <Timer className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-white/60">Rest Time</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: currentExercise.sets }).map((_, setIndex) => {
                      const setData = session?.completed_exercises[currentExercise.id]?.sets[setIndex];
                      return (
                        <div
                          key={setIndex}
                          className={`p-4 rounded-lg ${
                            setData?.completed
                              ? 'bg-green-500/20'
                              : 'bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white font-medium">Set {setIndex + 1}</div>
                            {!setData?.completed && (
                              <button
                                onClick={() => updateExerciseProgress(currentExercise.id, setIndex, {
                                  completed: true,
                                })}
                                className="p-2 hover:bg-white/10 rounded-lg text-white"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-white/60 mb-1">Weight (kg)</label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateExerciseProgress(currentExercise.id, setIndex, {
                                    weight: (setData?.weight || 0) - 2.5,
                                  })}
                                  className="p-1 hover:bg-white/10 rounded"
                                  disabled={setData?.completed}
                                >
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                                <input
                                  type="number"
                                  value={setData?.weight || 0}
                                  onChange={(e) => updateExerciseProgress(currentExercise.id, setIndex, {
                                    weight: parseFloat(e.target.value),
                                  })}
                                  disabled={setData?.completed}
                                  className="w-20 px-3 py-1 bg-white/10 border border-white/10 rounded text-white text-center"
                                />
                                <button
                                  onClick={() => updateExerciseProgress(currentExercise.id, setIndex, {
                                    weight: (setData?.weight || 0) + 2.5,
                                  })}
                                  className="p-1 hover:bg-white/10 rounded"
                                  disabled={setData?.completed}
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-white/60 mb-1">Reps</label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateExerciseProgress(currentExercise.id, setIndex, {
                                    reps: Math.max(0, (setData?.reps || currentExercise.reps) - 1),
                                  })}
                                  className="p-1 hover:bg-white/10 rounded"
                                  disabled={setData?.completed}
                                >
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                                <input
                                  type="number"
                                  value={setData?.reps || currentExercise.reps}
                                  onChange={(e) => updateExerciseProgress(currentExercise.id, setIndex, {
                                    reps: parseInt(e.target.value),
                                  })}
                                  disabled={setData?.completed}
                                  className="w-20 px-3 py-1 bg-white/10 border border-white/10 rounded text-white text-center"
                                />
                                <button
                                  onClick={() => updateExerciseProgress(currentExercise.id, setIndex, {
                                    reps: (setData?.reps || currentExercise.reps) + 1,
                                  })}
                                  className="p-1 hover:bg-white/10 rounded"
                                  disabled={setData?.completed}
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-white/60">
                Select an exercise to start tracking
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Session Notes</h2>
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
            placeholder="Add notes about the session..."
            className="w-full h-32 px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default LiveWorkout;