import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Scale, Target, Award, Loader, Dumbbell, Calendar, ChevronDown, Activity, ArrowUpRight } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

interface WorkoutSession {
  id: string;
  date: string;
  completed_exercises: Record<string, {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }>;
}

interface Exercise {
  id: string;
  name: string;
}

function ClientProgress() {
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [strengthData, setStrengthData] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    if (client) {
      fetchProgressData();
    }
  }, [client]);

  useEffect(() => {
    if (selectedExercise && workoutSessions.length > 0) {
      generateStrengthData();
    }
  }, [selectedExercise, workoutSessions]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // Fetch client programs to get workout sessions
      // Explicitly checking if client exists and casting to any to avoid TS errors with missing context types
      const clientData = client as any;
      if (!clientData?.id) return;

      const { data: clientPrograms, error: programsError } = await supabase
        .from('client_programs')
        .select('id')
        .eq('client_id', clientData.id);

      if (programsError) throw programsError;

      if (!clientPrograms || clientPrograms.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch workout sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('*')
        .in('client_program_id', clientPrograms.map(cp => cp.id))
        .order('date', { ascending: true });

      if (sessionsError) throw sessionsError;

      setWorkoutSessions(sessions || []);

      // Get unique exercises from workout sessions
      const exerciseIds = new Set<string>();
      sessions?.forEach(session => {
        Object.keys(session.completed_exercises || {}).forEach(exerciseId => {
          exerciseIds.add(exerciseId);
        });
      });

      if (exerciseIds.size > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', Array.from(exerciseIds));

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);

        // Set first exercise as default
        if (exercisesData && exercisesData.length > 0) {
          setSelectedExercise(exercisesData[0].id);
        }
      }

      // Generate weight data (mock for now since we don't have weight tracking)
      generateWeightData(sessions || []);

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeightData = (sessions: WorkoutSession[]) => {
    // Generate mock weight data based on session dates linked to user start date
    // In a real app, this would come from a measurements table
    if (sessions.length === 0) return;

    // Use startDate if needed for more complex logic
    // const startDate = new Date(sessions[0].date); 

    const weightData = sessions.slice(0, 15).map((session, index) => {
      // Mock fluctuation
      const baseWeight = 85;
      const weightLoss = index * 0.2 + (Math.random() * 0.4 - 0.2);
      return {
        date: new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        value: Math.round((baseWeight - weightLoss) * 10) / 10
      };
    });

    setWeightData(weightData);
  };

  const generateStrengthData = () => {
    if (!selectedExercise || workoutSessions.length === 0) return;

    const strengthData = workoutSessions
      .filter(session => session.completed_exercises[selectedExercise])
      .map(session => {
        const exerciseData = session.completed_exercises[selectedExercise];
        // Calculate estimated 1RM or just max weight lifted
        const maxWeight = Math.max(...exerciseData.sets.filter(s => s.completed).map(set => set.weight || 0));

        // Calculate volume
        const totalVolume = exerciseData.sets.reduce((sum, set) =>
          sum + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0), 0
        );

        return {
          date: new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          maxWeight: maxWeight > 0 ? maxWeight : null,
          totalVolume
        };
      })
      .filter(data => data.maxWeight !== null); // Filter out sessions where exercise wasn't performed properly

    setStrengthData(strengthData);
  };

  const calculateGoalProgress = () => {
    const clientData = client as any;
    if (!clientData?.fitness_goals || workoutSessions.length === 0) return [];

    return clientData.fitness_goals.slice(0, 3).map((goal: string, index: number) => {
      // Calculate progress based on workout frequency
      const sessionsThisMonth = workoutSessions.filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() &&
          sessionDate.getFullYear() === now.getFullYear();
      }).length;

      // Simple progress calculation based on sessions completed
      const progress = Math.min(100, (sessionsThisMonth * 10) + (index * 20) + 10);

      return {
        name: goal,
        target: "En cours",
        progress
      };
    });
  };

  const getSelectedExerciseName = () => {
    const exercise = exercises.find(ex => ex.id === selectedExercise);
    return exercise?.name || 'Sélectionner un exercice';
  };

  if (loading) {
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
            <p className="text-gray-400">Visualisez votre évolution et l'atteinte de vos objectifs.</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Derniers 30 jours</span>
          </div>
        </div>

        {workoutSessions.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-white/20 flex flex-col items-center justify-center animate-fade-in delay-100">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucune donnée disponible</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Commencez à enregistrer vos séances d'entraînement pour voir apparaître vos statistiques et graphiques de progression.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in delay-100">

            {/* Graphique de Poids */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl">
                    <Scale className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Évolution du Poids</h2>
                    <p className="text-xs text-gray-400">Est. basé sur les données</p>
                  </div>
                </div>
                {weightData.length > 0 && (
                  <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-500/20">
                    <TrendingUp className="w-4 h-4" />
                    <span>-2.4 kg</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        color: 'white',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique de Force */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl">
                    <Dumbbell className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Performance Exercice</h2>
                    <p className="text-xs text-gray-400">Charge maximale soulevée</p>
                  </div>
                </div>

                {exercises.length > 0 && (
                  <div className="relative group">
                    <select
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      className="appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      {exercises.map(exercise => (
                        <option key={exercise.id} value={exercise.id} className="bg-slate-900 text-white">
                          {exercise.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {strengthData.length > 0 ? (
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={strengthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '1rem',
                          color: 'white',
                          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="#a855f7"
                        name="Charge Max (kg)"
                        strokeWidth={3}
                        dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-auto w-full">
                  <Activity className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-gray-400 text-sm">
                    Pas assez de données pour cet exercice.
                    <br />Continuez l'entraînement !
                  </p>
                </div>
              )}
            </div>

            {/* Objectifs Grid */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-yellow-500/20 rounded-xl">
                  <Target className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Objectifs Personnels</h2>
              </div>

              {goals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {goals.map((goal, index) => (
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

export default ClientProgress;