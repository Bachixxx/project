import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Activity, Plus, X, Dumbbell, Search, TrendingUp, BarChart3, Flame, Trophy } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

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
  const [weightHistory, setWeightHistory] = useState<{ weight: number, date: string }[]>([]);

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
          const { logs, exercises: cachedExercises, weightHistory: cachedWeightHistory } = JSON.parse(cachedData);
          setWorkoutLogs(logs || []);
          setExercises(cachedExercises || []);
          if (cachedWeightHistory) setWeightHistory(cachedWeightHistory);
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

      // Fetch weight history for physical progress
      const { data: weightData, error: weightError } = await supabase
        .from('client_weight_history')
        .select('weight, date')
        .eq('client_id', clientData.id)
        .order('date', { ascending: true });

      if (weightError) console.error('Error fetching weight history', weightError);

      const formattedWeightData = (weightData || []).map(w => ({
        weight: Number(w.weight),
        date: w.date
      }));
      setWeightHistory(formattedWeightData);

      // 3. Update Cache
      localStorage.setItem(cacheKey, JSON.stringify({
        logs: formattedLogs,
        exercises: currentExercises,
        weightHistory: formattedWeightData,
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
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="loading loading-lg text-primary-500"></div>
      </div>
    );
  }

  // Calculate Global KPIs for Synthesis Tab
  const clientGoals = ((client as any)?.fitness_goals || []).slice(0, 3) as string[];

  const totalSessionsAllTime = new Set(workoutLogs.map(l => l.completed_at.split('T')[0])).size;
  const currentMonth = new Date().getMonth();
  const sessionsThisMonth = new Set(
    workoutLogs
      .filter(l => new Date(l.completed_at).getMonth() === currentMonth)
      .map(l => l.completed_at.split('T')[0])
  ).size;


  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden">

      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-emerald-900/20 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Massive Background Image (Native Hero Vibe) */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[30%] pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20 pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

        {/* Floating Title Container */}
        <div className="absolute top-24 left-0 right-0 px-6 z-10 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
              Analyses
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase text-shadow-lg mb-2">PROGRÈS</h1>
          <p className="text-slate-300 text-sm font-medium">Suivez l'évolution de vos perfs.</p>
        </div>
      </div>

      {/* The Native "Sheet" Content Container */}
      <div className="relative z-20 mt-[30vh] bg-slate-950 rounded-t-[3rem] px-4 pt-8 pb-32 min-h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 flex flex-col">

        {/* Segmented Control Tabs */}
        <div className="px-4 md:px-8 mb-6 max-w-3xl mx-auto flex justify-center w-full z-40">
          <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-full">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'summary'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'summary' ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Synthèse</span>
              <span className="sm:hidden">Synthèse</span>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'performance'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'performance' ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Performances</span>
              <span className="sm:hidden">Perfs</span>
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full px-2 mt-4 relative z-20 space-y-8">

          {activeTab === 'summary' && (
            <div className="space-y-8 animate-fade-in">
              {/* 1. Gamification Hero Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    {/* Level Badge */}
                    <div className="relative group cursor-default">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 p-[2px] relative z-10 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center border border-white/5 relative">
                          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>
                          <Trophy className="w-6 h-6 text-yellow-400 mb-1" />
                          <span className="text-2xl font-black text-white leading-none">{(client as any)?.level || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* XP & Identity */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">Niveau Actuel</h2>
                      <p className="text-sm text-slate-400 mb-3">Continue sur cette lancée !</p>
                      <div className="w-full bg-slate-950/50 rounded-full h-3 border border-white/5 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full relative shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (((client as any)?.xp || 0) % 1000) / 10)}%` }}
                        >
                          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1.5 px-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">XP</span>
                        <span className="text-[10px] font-bold text-blue-400 font-mono">{(client as any)?.xp || 0} / {(((client as any)?.level || 1) * 1000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* The Streak */}
                  <div className="w-full md:w-auto bg-slate-950/50 rounded-2xl p-4 border border-white/5 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 min-w-[140px]">
                    <div className="flex flex-col items-start md:items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assiduité</span>
                      <div className="flex items-center gap-2">
                        <Flame className={`w-8 h-8 ${((client as any)?.current_streak || 0) > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-600'}`} />
                        <span className="text-3xl font-black text-white">{(client as any)?.current_streak || 0}</span>
                      </div>
                    </div>
                    <div className="bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-orange-500/20">
                      Jours d'affilée
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2. Physical Transformation (Health Dashboard) */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Évolution Poids
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Comparaison dernier relevé</p>
                    </div>
                    {weightHistory.length >= 2 && weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight > 0 ? (
                      <div className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <span className="text-lg leading-none">-</span>
                        <span>{(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1)}kg</span>
                      </div>
                    ) : weightHistory.length >= 2 && weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight > 0 ? (
                      <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                        <span className="text-lg leading-none">+</span>
                        <span>{(weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)}kg</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between relative z-10 bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                    <div className="text-center flex-1">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Départ</span>
                      <span className="text-2xl font-black text-slate-300">
                        {weightHistory.length > 0 ? weightHistory[0].weight : '--'}
                        <span className="text-sm text-slate-500 ml-1 font-medium">kg</span>
                      </span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10 mx-2 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20"></div>
                    </div>
                    <div className="text-center flex-1">
                      <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Actuel</span>
                      <span className="text-3xl font-black text-white">
                        {weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : '--'}
                        <span className="text-base text-emerald-500 ml-1 font-medium">kg</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Activity & Consistency */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-purple-500/5 rounded-full blur-[60px] group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                  <div className="flex justify-between items-start relative z-10 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Activité du mois
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Séances complétées en {new Date().toLocaleDateString('fr-FR', { month: 'long' })}</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                      <Dumbbell className="w-6 h-6 text-purple-400/80" />
                    </div>
                  </div>
                  <div className="relative z-10 flex items-end justify-between">
                    <div>
                      <span className="text-5xl font-black text-white tracking-tighter">{sessionsThisMonth}</span>
                      <span className="text-lg text-purple-400 ml-2 font-medium">séances</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total à vie</span>
                      <span className="text-xl font-bold text-slate-300">{totalSessionsAllTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Goals Summary if any */}
              {clientGoals.length > 0 && (
                <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Mes Objectifs</h3>
                  </div>
                  <div className="space-y-3">
                    {clientGoals.map((goal: string, index: number) => (
                      <div key={index} className="bg-slate-950/50 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        <span className="text-sm text-slate-200 font-medium">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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