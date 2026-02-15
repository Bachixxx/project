import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Defs, LinearGradient, Stop } from 'recharts';
import { Award, Target, ArrowUpRight, Activity, Calendar, Plus, X, Dumbbell, Search, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { TutorialCard } from '../../components/client/TutorialCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { PageHero } from '../../components/client/shared/PageHero';
import { NavRail } from '../../components/client/shared/NavRail';

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
  const [activeTab, setActiveTab] = useState<'summary' | 'performance'>('summary');

  // Data State
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // UI State
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Calculate Global KPIs for Synthesis Tab
  const totalVolumeAllTime = workoutLogs.reduce((acc, log) => acc + (log.weight * log.reps), 0);
  const totalSessionsAllTime = new Set(workoutLogs.map(l => l.completed_at.split('T')[0])).size;
  const currentMonth = new Date().getMonth();
  const sessionsThisMonth = new Set(
    workoutLogs
      .filter(l => new Date(l.completed_at).getMonth() === currentMonth)
      .map(l => l.completed_at.split('T')[0])
  ).size;


  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24">
      <PageHero
        title="Mes Progrès"
        subtitle="Suivez l'évolution de vos performances."
        backgroundImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
        className="pb-0"
        headerContent={
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-1 border border-white/10 text-xs font-medium text-white/80">
            {activeTab === 'summary' ? 'Vue d\'ensemble' : 'Analyse détaillée'}
          </div>
        }
      >
        <NavRail
          tabs={[
            { id: 'summary', label: 'Synthèse', icon: BarChart3 },
            { id: 'performance', label: 'Performances', icon: TrendingUp }
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          className="!sticky-none !top-auto !bg-transparent !border-none !p-0 !m-0 !mb-0"
        />
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 space-y-8">

        {activeTab === 'summary' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* KPI 1 */}
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex flex-col justify-between aspect-square md:aspect-auto md:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Volume total</span>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{(totalVolumeAllTime / 1000).toFixed(1)}k</span>
                  <span className="text-sm text-blue-200 ml-1">kg</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between aspect-square md:aspect-auto md:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Séances (Total)</span>
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{totalSessionsAllTime}</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 flex flex-col justify-between col-span-2 lg:col-span-1 md:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-purple-200 text-xs font-bold uppercase tracking-wider">Ce mois-ci</span>
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{sessionsThisMonth}</span>
                  <span className="text-sm text-purple-200 ml-1">entraînements</span>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Objectifs</h2>
              </div>

              {goals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((goal: any, index: number) => (
                    <div key={index} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <h4 className="font-bold text-lg text-white">{goal.name}</h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${goal.progress >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {goal.progress >= 100 ? 'Complété' : 'En cours'}
                        </span>
                      </div>

                      <div className="space-y-1 relative z-10">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Progression</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-gray-500">
                  Aucun objectif défini
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Évolution
              </h2>
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg text-sm transition-colors border border-white/10"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {selectedExercises.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedExercises.map(exerciseId => {
                  const exercise = exercises.find(e => e.id === exerciseId);
                  const data = getExerciseData(exerciseId);

                  if (!exercise) return null;

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
              <div onClick={() => setIsSelectorOpen(true)} className="cursor-pointer border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center hover:bg-white/5 transition-colors group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white font-medium">Créer votre premier graphique</p>
                <p className="text-sm text-gray-500 mt-1">Sélectionnez un exercice pour voir votre progression</p>
              </div>
            )}
          </div>
        )}

        {/* Exercise Selector Drawer (Shared) */}
        <Drawer.Root open={isSelectorOpen} onOpenChange={setIsSelectorOpen} shouldScaleBackground>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <Drawer.Content className="bg-[#1e293b] flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 outline-none">
              <div className="p-4 bg-[#1e293b] rounded-t-[10px] flex-1">
                <div aria-hidden className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-600 mb-8" />
                <div className="max-w-md mx-auto h-full flex flex-col">
                  <Drawer.Title className="text-2xl font-bold text-white mb-4">Sélectionner un exercice</Drawer.Title>

                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice..."
                      className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredExercises.map(exercise => {
                      const isSelected = selectedExercises.includes(exercise.id);
                      return (
                        <button
                          key={exercise.id}
                          onClick={() => toggleExercise(exercise.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${isSelected
                            ? 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                          <div>
                            <h4 className={`font-bold ${isSelected ? 'text-blue-400' : 'text-white'}`}>{exercise.name}</h4>
                            <span className="text-xs text-gray-500">
                              {exercise.track_weight && "Poids • "}{exercise.track_reps && "Reps • "}{exercise.track_distance && "Distance"}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-500 text-transparent group-hover:border-gray-400'
                            }`}>
                            <Activity className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                    {filteredExercises.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Aucun exercice trouvé.</p>
                    )}
                  </div>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

      </div>
    </div>
  );
}

// Sub-component for individual charts to handle metric state independently
function ExerciseChartCard({ exercise, data, onClose }: { exercise: Exercise, data: any[], onClose: () => void }) {
  const getDefaultMetric = () => {
    if (exercise.track_weight) return 'weight';
    if (exercise.track_reps) return 'total_reps';
    if (exercise.track_distance) return 'distance';
    if (exercise.track_duration) return 'duration';
    if (exercise.track_calories) return 'calories';
    return 'weight';
  };

  const [metric, setMetric] = useState<'weight' | 'total_reps' | 'volume' | 'distance' | 'duration' | 'calories'>(getDefaultMetric());

  if (!exercise) return null;

  const metricConfig = {
    weight: { label: "Charge Max (kg)", color: "#a855f7", gradient: ['#a855f7', '#7e22ce'] },
    total_reps: { label: "Total Répétitions", color: "#3b82f6", gradient: ['#3b82f6', '#1d4ed8'] },
    volume: { label: "Volume (kg × reps)", color: "#10b981", gradient: ['#10b981', '#047857'] },
    distance: { label: "Distance (m)", color: "#f59e0b", gradient: ['#f59e0b', '#b45309'] },
    duration: { label: "Durée (min)", color: "#ef4444", gradient: ['#ef4444', '#b91c1c'] },
    calories: { label: "Calories", color: "#ec4899", gradient: ['#ec4899', '#be185d'] }
  };

  const config = metricConfig[metric];

  const tabs = [
    { id: 'weight', label: 'Poids' },
    { id: 'total_reps', label: 'Reps' }
  ];

  if (exercise.track_weight && exercise.track_reps) {
    tabs.push({ id: 'volume', label: 'Volume' });
  }

  if (exercise.track_distance) tabs.push({ id: 'distance', label: 'Distance' });
  if (exercise.track_duration) tabs.push({ id: 'duration', label: 'Temps' });
  if (exercise.track_calories) tabs.push({ id: 'calories', label: 'Kcal' });

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col h-[400px] animate-fade-in relative group overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: config.color }} />

      <div className="flex items-start justify-between mb-6 relative z-10">
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

      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px] z-10 relative">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMetric(tab.id as any)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${metric === tab.id
              ? 'bg-white/10 text-white border-white/20 shadow-lg'
              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            style={metric === tab.id ? { borderColor: config.color, color: config.color, backgroundColor: `${config.color}20` } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="flex-1 w-full min-h-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${exercise.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.gradient[0]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={config.gradient[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey={metric}
                stroke={config.color}
                strokeWidth={3}
                fill={`url(#gradient-${exercise.id})`}
                name={config.label}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'white' }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm">Pas assez de données</p>
        </div>
      )}
    </div>
  );
}

export default ClientProgress;