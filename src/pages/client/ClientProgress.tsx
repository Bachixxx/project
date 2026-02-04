import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Target, ArrowUpRight, Activity, Calendar, Plus, X, Dumbbell } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { TutorialCard } from '../../components/client/TutorialCard';

interface WorkoutLog {
  id: string;
  completed_at: string;
  weight: number;
  reps: number;
  duration_seconds: number;
  distance_meters: number;
  calories: number;
  exercise_id: string;
  scheduled_session: {
    scheduled_date: string;
  } | null;
}

interface Exercise {
  id: string;
  name: string;
  track_reps: boolean;
  track_weight: boolean;
  track_duration: boolean;
  track_distance: boolean;
  track_calories: boolean;
  tracking_type?: 'reps_weight' | 'duration' | 'distance';
}

function ClientProgress() {
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(true);

  // Data State
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // UI State
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    if (client) {
      fetchProgressData();
    }
  }, [client]);

  // When exercises are loaded, select the first one by default if none selected
  useEffect(() => {
    if (exercises.length > 0 && selectedExercises.length === 0) {
      setSelectedExercises([exercises[0].id]);
    }
  }, [exercises]);

  const fetchProgressData = async () => {
    try {
      // 1. Try cache first
      const clientData = client as any;
      if (!clientData?.id) return;

      const cacheKey = `progress_data_${clientData.id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const { logs, exercises: cachedExercises } = JSON.parse(cachedData);
          setWorkoutLogs(logs || []);
          setExercises(cachedExercises || []);
          // Note: selectedExercises effect will run when exercises updates
        } catch (e) {
          console.error("Error parsing progress cache", e);
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      // 2. Network Fetch
      // Fetch workout logs joined with scheduled_sessions to get the date
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select(`
          id,
          completed_at,
          weight,
          reps,
          duration_seconds,
          distance_meters,
          calories,
          exercise_id,
          scheduled_session:scheduled_sessions (
            scheduled_date
          )
        `)
        .eq('client_id', clientData.id)
        .order('completed_at', { ascending: true });

      if (logsError) throw logsError;

      const formattedLogs: WorkoutLog[] = (logs || []).map(log => ({
        id: log.id,
        completed_at: log.completed_at,
        weight: log.weight || 0,
        reps: log.reps || 0,
        duration_seconds: log.duration_seconds || 0,
        distance_meters: log.distance_meters || 0,
        calories: log.calories || 0,
        exercise_id: log.exercise_id,
        // Safe access to nested join
        scheduled_session: Array.isArray(log.scheduled_session)
          ? log.scheduled_session[0]
          : log.scheduled_session
      }));

      setWorkoutLogs(formattedLogs);

      // Get unique exercises (derived from current fetch + maybe historical?
      // actually, let's just use what we found in logs + maybe all exercises if we want?
      // The original code only fetching exercises present in logs.
      const exerciseIds = Array.from(new Set(formattedLogs.map(log => log.exercise_id)));
      let currentExercises: Exercise[] = [];

      if (exerciseIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('id, name, tracking_type, track_reps, track_weight, track_duration, track_distance, track_calories')
          .in('id', exerciseIds);

        if (exercisesError) throw exercisesError;
        currentExercises = exercisesData || [];
        setExercises(currentExercises);
      } else {
        setExercises([]);
      }

      // 3. Update Cache
      localStorage.setItem(cacheKey, JSON.stringify({
        logs: formattedLogs,
        exercises: currentExercises,
        timestamp: new Date().getTime()
      }));

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseData = (exerciseId: string) => {
    if (!exerciseId || workoutLogs.length === 0) return [];

    // Group logs by date (or session)
    const sessionGroups: Record<string, WorkoutLog[]> = {};

    workoutLogs
      .filter(log => log.exercise_id === exerciseId)
      .forEach(log => {
        // Use scheduled date as key if available, else completed_at
        let dateStr = log.completed_at;
        if (log.scheduled_session?.scheduled_date) {
          dateStr = log.scheduled_session.scheduled_date;
        }

        // Group by day (YYYY-MM-DD) to aggregate multiple sets/sessions in one day
        const dateKey = new Date(dateStr).toISOString().split('T')[0];

        if (!sessionGroups[dateKey]) {
          sessionGroups[dateKey] = [];
        }
        sessionGroups[dateKey].push(log);
      });

    return Object.entries(sessionGroups).map(([dateStr, logs]) => {
      const dateObj = new Date(dateStr);

      const maxWeight = Math.max(...logs.map(l => l.weight));
      const totalVolume = logs.reduce((sum, l) => sum + (l.weight * l.reps), 0);
      const totalReps = logs.reduce((sum, l) => sum + l.reps, 0); // New metric
      const maxDistance = Math.max(...logs.map(l => l.distance_meters));
      const maxDuration = Math.max(...logs.map(l => l.duration_seconds)) / 60;
      const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);

      return {
        date: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        rawDate: dateObj, // helper for sort
        weight: Number(maxWeight.toFixed(2)),
        volume: Number(totalVolume.toFixed(2)),
        total_reps: Number(totalReps),
        distance: Number(maxDistance.toFixed(2)),
        duration: Number(maxDuration.toFixed(2)),
        calories: Number(totalCalories.toFixed(0)),
      };
    })
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  };

  const calculateGoalProgress = () => {
    const clientData = client as any;
    if (!clientData?.fitness_goals || workoutLogs.length === 0) return [];

    return clientData.fitness_goals.slice(0, 3).map((goal: string, index: number) => {
      // Calculate active days this month
      const uniqueDaysThisMonth = new Set(
        workoutLogs
          .filter(log => {
            const logDate = new Date(log.completed_at);
            const now = new Date();
            return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
          })
          .map(log => new Date(log.completed_at).toDateString())
      ).size;

      // Simple progress calculation based on active days (mock logic for goals)
      const progress = Math.min(100, (uniqueDaysThisMonth * 10) + (index * 20) + 10);

      return {
        name: goal,
        target: "En cours",
        progress
      };
    });
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
    setIsSelectorOpen(false);
  };

  if (loading && !workoutLogs.length && !exercises.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const goals = calculateGoalProgress();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 pb-24 md:p-8">
      {/* Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mes Progrès</h1>
            <p className="text-gray-400">Suivez l'évolution de vos charges sur vos exercices favoris.</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Tous les temps</span>
          </div>
        </div>

        <TutorialCard
          tutorialId="progress_tracking_v2"
          title="Analysez vos performances 🏋️‍♂️"
          message="Visualisez votre progression sur chaque exercice : charge maximale, volume total et évolution. Ajoutez un graphique pour commencer."
          className="mb-8"
        />

        {workoutLogs.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-white/20 flex flex-col items-center justify-center animate-fade-in delay-100">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucune donnée disponible</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Commencez à enregistrer vos séances d'entraînement pour voir apparaître vos statistiques.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in delay-100">

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un graphique
                </button>

                {isSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSelectorOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {exercises.map(exercise => {
                          const isSelected = selectedExercises.includes(exercise.id);
                          return (
                            <button
                              key={exercise.id}
                              onClick={() => toggleExercise(exercise.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-gray-300 hover:bg-white/5'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{exercise.name}</span>
                                {isSelected && <Activity className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

              <div className="flex flex-wrap gap-2">
                {selectedExercises.map(id => {
                  const ex = exercises.find(e => e.id === id);
                  if (!ex) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                      <span>{ex.name}</span>
                      <button onClick={() => toggleExercise(id)} className="p-0.5 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Charts Grid */}
            {selectedExercises.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  const exercise = exercises.find(e => e.id === exerciseId);
                const data = getExerciseData(exerciseId);
                  // Local state for this chart's selected metric (would be better in a sub-component, but inline for now)
                  // We'll use a simple default based on tracking type, but allow override if we implement state.
                  // Since we are mapping inside the render, we can't use hooks here easily without extracting a component.
                  // LIMITATION: To add state per chart, we MUST extract a component.
                  // I will extract 'ExerciseChartCard' in a future refactor, but for now I will hardcode a way or use a shared state?
                  // Shared state 'chartMetrics' map: {[exerciseId]: 'weight' | 'reps' ... }

                return (
                <ExerciseChartCard
                  key={exerciseId}
                  exercise={exercise}
                  data={data}
                  onClose={() => toggleExercise(exerciseId)}
                />
                );
                })}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                <p className="text-gray-400">Aucun exercice sélectionné. Ajoutez-en un ci-dessus !</p>
              </div>
            )}

            {/* Objectifs Grid (Keep it at bottom) */}
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-yellow-500/20 rounded-xl">
                  <Target className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Objectifs Personnels</h2>
              </div>

              {goals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {goals.map((goal: any, index: number) => (
                    <div key={index} className="bg-gradient-to-br from-white/5 to-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-white/40" />
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-white font-bold truncate">{goal.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{goal.target}</p>
                        </div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${goal.progress >= 100 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                          <Award className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="relative pt-2">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className={goal.progress >= 100 ? 'text-yellow-400' : 'text-blue-400'}>
                            {goal.progress >= 100 ? 'Atteint !' : `${goal.progress}%`}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.progress >= 100 ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Aucun objectif défini. Contactez votre coach pour fixer des objectifs !
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for individual charts to handle metric state independently
function ExerciseChartCard({ exercise, data, onClose }: { exercise: Exercise, data: any[], onClose: () => void }) {
  // Determine default metric based on tracking type priority
  const getDefaultMetric = () => {
    if (exercise.track_weight) return 'weight';
    if (exercise.track_reps) return 'total_reps'; // Use total reps for bodyweight
    if (exercise.track_distance) return 'distance';
    if (exercise.track_duration) return 'duration';
    if (exercise.track_calories) return 'calories';
    return 'weight';
  };

  const [metric, setMetric] = useState<'weight' | 'total_reps' | 'volume' | 'distance' | 'duration' | 'calories'>(getDefaultMetric());

  if (!exercise) return null;

  // Configuration for the chart based on current metric
  const metricConfig = {
    weight: { label: "Charge Max (kg)", color: "#a855f7" },
    total_reps: { label: "Total Répétitions", color: "#3b82f6" },
    volume: { label: "Volume (kg × reps)", color: "#10b981" },
    distance: { label: "Distance (m)", color: "#f59e0b" },
    duration: { label: "Durée (min)", color: "#ef4444" },
    calories: { label: "Calories", color: "#ec4899" }
  };

  const config = metricConfig[metric];

  // Available tabs for this exercise
  const tabs = [];
  if (exercise.track_weight) tabs.push({ id: 'weight', label: 'Poids' });
  if (exercise.track_reps) tabs.push({ id: 'total_reps', label: 'Reps' });
  if (exercise.track_weight && exercise.track_reps) tabs.push({ id: 'volume', label: 'Volume' });
  if (exercise.track_distance) tabs.push({ id: 'distance', label: 'Distance' });
  if (exercise.track_duration) tabs.push({ id: 'duration', label: 'Temps' });
  if (exercise.track_calories) tabs.push({ id: 'calories', label: 'Kcal' });

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col h-[500px] animate-fade-in relative group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <Dumbbell className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{exercise.name}</h2>
            <p className="text-xs text-gray-400">{config.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs / Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMetric(tab.id as any)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${metric === tab.id
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  color: 'white',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.75rem' }}
                itemStyle={{ fontSize: '0.875rem', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={config.color}
                name={config.label}
                strokeWidth={3}
                dot={{ fill: config.color, strokeWidth: 2, stroke: '#0f172a', r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'white' }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm">Pas assez de données pour ce graphique</p>
        </div>
      )}
    </div>
  );
}

export default ClientProgress;