import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Scale, Calendar, Dumbbell, Activity, Target, Award, ArrowUpRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BiometricsDashboard } from '../components/client/biometrics/BiometricsDashboard';

interface WorkoutLog {
  id: string;
  completed_at: string;
  weight: number;
  reps: number;
  exercise_id: string;
  scheduled_session: {
    scheduled_date: string;
  } | null;
}

interface Exercise {
  id: string;
  name: string;
}

interface ClientData {
  id: string;
  full_name: string;
  fitness_goals: string[];
}

function ClientAnalytics() {
  const { clientId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);

  // Analytics State
  const [weightData, setWeightData] = useState<any[]>([]);
  const [strengthData, setStrengthData] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    if (clientId && user) {
      fetchClientAndData();
    }
  }, [clientId, user]);

  useEffect(() => {
    if (selectedExercise && workoutLogs.length > 0) {
      generateStrengthData();
    }
  }, [selectedExercise, workoutLogs]);

  const fetchClientAndData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Client Details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // 2. Fetch Workout Logs
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select(`
          id,
          completed_at,
          weight,
          reps,
          exercise_id,
          scheduled_session:scheduled_sessions (
            scheduled_date
          )
        `)
        .eq('client_id', clientId)
        .order('completed_at', { ascending: true });

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      const formattedLogs: WorkoutLog[] = (logs || []).map(log => ({
        id: log.id,
        completed_at: log.completed_at,
        weight: log.weight,
        reps: log.reps,
        exercise_id: log.exercise_id,
        scheduled_session: Array.isArray(log.scheduled_session)
          ? log.scheduled_session[0]
          : log.scheduled_session
      }));

      setWorkoutLogs(formattedLogs);

      // 3. Fetch Exercises used in logs
      const exerciseIds = Array.from(new Set(formattedLogs.map(log => log.exercise_id)));

      if (exerciseIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', exerciseIds);

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);

        if (exercisesData && exercisesData.length > 0) {
          setSelectedExercise(exercisesData[0].id);
        }
      }

      // 4. Fetch Weight History
      const { data: weightHistoryData, error: weightError } = await supabase
        .from('client_weight_history')
        .select('weight, date')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      if (weightError) throw weightError;

      if (weightHistoryData && weightHistoryData.length > 0) {
        const historyData = weightHistoryData.map(entry => ({
          date: new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          value: entry.weight
        }));
        setWeightData(historyData);
      } else {
        setWeightData([]);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (typeof error === 'object' && error !== null) {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  const generateStrengthData = () => {
    if (!selectedExercise || workoutLogs.length === 0) return;

    const sessionGroups: Record<string, WorkoutLog[]> = {};

    workoutLogs
      .filter(log => log.exercise_id === selectedExercise)
      .forEach(log => {
        let dateStr = log.completed_at;
        if (log.scheduled_session?.scheduled_date) {
          dateStr = log.scheduled_session.scheduled_date;
        }
        const dateKey = new Date(dateStr).toISOString().split('T')[0];

        if (!sessionGroups[dateKey]) {
          sessionGroups[dateKey] = [];
        }
        sessionGroups[dateKey].push(log);
      });

    const strengthData = Object.entries(sessionGroups).map(([dateStr, logs]) => {
      const maxWeight = Math.max(...logs.map(l => l.weight));
      const totalVolume = logs.reduce((sum, l) => sum + (l.weight * l.reps), 0);
      const dateObj = new Date(dateStr);

      return {
        date: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        rawDate: dateObj,
        maxWeight: maxWeight > 0 ? maxWeight : 0,
        totalVolume
      };
    }).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    setStrengthData(strengthData);
  };

  const calculateGoalProgress = () => {
    if (!client?.fitness_goals || workoutLogs.length === 0) return [];

    return client.fitness_goals.slice(0, 3).map((goal: string, index: number) => {
      const uniqueDaysThisMonth = new Set(
        workoutLogs
          .filter(log => {
            const logDate = new Date(log.completed_at);
            const now = new Date();
            return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
          })
          .map(log => new Date(log.completed_at).toDateString())
      ).size;

      const progress = Math.min(100, (uniqueDaysThisMonth * 10) + (index * 20) + 10);

      return {
        name: goal,
        target: "En cours",
        progress
      };
    });
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
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-6 md:p-8">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            to={`/clients/${clientId}`}
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au profil de {client?.full_name}
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Analyse des Performances</h1>
              <p className="text-gray-400">Progression détaillée de {client?.full_name}</p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Derniers 30 jours</span>
            </div>
          </div>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucune donnée disponible</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Ce client n'a pas encore enregistré de séances. Les statistiques apparaîtront ici une fois qu'il aura commencé l'entraînement.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* NEW: Biometrics Section */}
            <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl p-6 rounded-3xl">
              <BiometricsDashboard clientId={clientId!} readOnly={true} />
            </div>



            {/* Strength Progress Chart */}
            <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl p-6 rounded-3xl flex flex-col h-[450px]">
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
                  </p>
                </div>
              )}
            </div>

            {/* Goals Progress */}
            <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl p-6 rounded-3xl">
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
                  Aucun objectif défini pour ce client.
                </div>
              )}
            </div>


          </div>
        )}
      </div>
    </div>
  );
}

export default ClientAnalytics;