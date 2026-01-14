import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calendar, TrendingUp, Clock, PlayCircle, Dumbbell, ChevronRight, Award, Flame, Info, X } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function ClientDashboard() {
  const { client: authClient, loading: authLoading } = useClientAuth();
  const client = authClient as any;
  const [loading, setLoading] = useState(false);
  const [clientPrograms, setClientPrograms] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    workoutsCount: 0,
    totalDuration: 0,
    streak: 0
  });

  useEffect(() => {
    if (client) {
      fetchClientData();
    }
  }, [client]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client programs
      const { data: programsData, error: programsError } = await supabase
        .from('client_programs')
        .select(`
          id,
          program:programs (
            id,
            name,
            description,
            program_sessions (
              id,
              order_index,
              session:sessions (
                id,
                name,
                duration_minutes
              )
            )
          ),
          start_date,
          status
        `)
        .eq('client_id', client?.id)
        .eq('status', 'active');

      if (programsError) throw programsError;
      setClientPrograms(programsData || []);

      // Fetch recent scheduled sessions (completed) for history and stats
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('scheduled_sessions')
        .select(`
          *,
          session:sessions (
            id,
            name,
            duration_minutes
          )
        `)
        .eq('client_id', client?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Map scheduled_sessions to the format expected by the dashboard
      const sessions = (sessionsData || []).map(s => ({
        id: s.id,
        date: s.completed_at || s.scheduled_date,
        duration_minutes: s.actual_duration || s.session?.duration_minutes || 0,
        actual_duration: s.actual_duration,
        session: s.session
      }));

      setWorkoutSessions(sessions.slice(0, 5)); // Keep only last 5 for display

      // Calculate simple stats
      const totalDuration = sessions.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

      // Calculate Weekly Activity (last 7 days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        return d;
      }).reverse(); // To get them in chronological order

      const activityData = last7Days.map(date => {
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        // Find sessions on this day
        const daySessions = sessions.filter((s: any) => {
          const sessionDate = new Date(s.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === date.getTime();
        });

        // Use mapped duration_minutes which already handles actual_duration vs planned
        const duration = daySessions.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);

        return {
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          minutes: duration,
          date: date.toISOString()
        };
      });
      setWeeklyActivity(activityData);

      // Calculate Real Streak
      let currentStreak = 0;
      if (sessions.length > 0) {
        // `today` is already defined above
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get unique dates of workouts
        const workoutDates = [...new Set(sessions.map(s => {
          const d = new Date(s.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }))].sort((a, b) => b - a); // Descending

        // Check if streak is alive (workout today or yesterday)
        const lastWorkoutTime = workoutDates[0];
        if (lastWorkoutTime === today.getTime() || lastWorkoutTime === yesterday.getTime()) {
          currentStreak = 1;
          let checkDate = new Date(lastWorkoutTime);

          for (let i = 1; i < workoutDates.length; i++) {
            checkDate.setDate(checkDate.getDate() - 1); // Expected previous day
            if (workoutDates[i] === checkDate.getTime()) {
              currentStreak++;
            } else {
              break; // Streak broken
            }
          }
        }
      }

      setStats({
        workoutsCount: sessions.length,
        totalDuration: Math.round(totalDuration / 60), // in hours
        streak: currentStreak
      });

      // Fetch upcoming scheduled sessions
      const { data: scheduledSessionsData, error: scheduledSessionsError } = await supabase
        .from('scheduled_sessions')
        .select(`
          id,
          scheduled_date,
          status,
          notes,
          session:sessions (
            id,
            name,
            duration_minutes
          )
        `)
        .eq('client_id', client?.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(3);

      if (scheduledSessionsError) throw scheduledSessionsError;
      setUpcomingSessions(scheduledSessionsData || []);

    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLevel = (count: number) => {
    if (count < 10) return { label: 'Débutant', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (count < 50) return { label: 'Intermédiaire', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'Expert', color: 'text-purple-500', bg: 'bg-purple-500/10' };
  };

  const level = getUserLevel(stats.workoutsCount);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (authLoading || loading && !clientPrograms.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine the primary action (Next Workout)
  const getNextAction = () => {
    try {
      // Priority 1: Scheduled Session today/soon
      if (upcomingSessions.length > 0) {
        const next = upcomingSessions[0];
        if (next && next.scheduled_date) {
          const sessionDate = new Date(next.scheduled_date);
          const isToday = new Date().toDateString() === sessionDate.toDateString();
          const isPast = new Date() > sessionDate;
          const isReadyCurrent = isToday || isPast;

          return {
            type: 'scheduled',
            data: next,
            title: next.session?.name || "Session planifiée",
            subtitle: sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
            link: isReadyCurrent ? `/client/live-workout/${next.id}` : `/client/appointments`
          };
        }
      }

      // Priority 2: Active Program - Smart Next Session
      if (clientPrograms.length > 0) {
        const prog = clientPrograms[0];

        // Safety check: ensure program relation exists
        if (prog && prog.program) {
          const programSessions = prog.program.program_sessions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

          if (programSessions.length > 0) {
            // Count how many sessions from this program have been completed
            // Logic: Count workout sessions that happened AFTER the program start date
            const programStartDate = new Date(prog.start_date || new Date());
            const sessionsCompletedCount = workoutSessions.filter((ws: any) =>
              ws.date && new Date(ws.date) >= programStartDate
            ).length;

            // The next session is the one at index 'sessionsCompletedCount' % totalSessions (cycling)
            // or just clamp to the last one if linear. Let's assume cycling for now or linear.
            // If linear:
            const nextSessionIndex = Math.min(sessionsCompletedCount, programSessions.length - 1);
            // Ensure index is valid
            const safeIndex = Math.max(0, nextSessionIndex);
            const nextSession = programSessions[safeIndex];

            if (nextSession) {
              return {
                type: 'program',
                data: prog,
                title: nextSession.session?.name || "Prochaine séance",
                subtitle: `${prog.program.name} • Séance ${safeIndex + 1}`,
                link: `/client/workout/${prog.id}` // Ideally deep link to session, but program view works
              };
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in getNextAction:", error);
    }

    // Fallback: No active content
    return {
      type: 'empty',
      title: "Aucun programme actif",
      subtitle: "Parcourez le catalogue pour commencer",
      link: "/marketplace"
    };
  };

  const nextAction = getNextAction();

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans p-4 pb-24 md:p-8">
      {/* ... (Background Gradients and Header) */}

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-in">
          <div>
            <p className="text-blue-400 font-medium tracking-wide text-sm uppercase mb-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{client?.full_name?.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${level.bg} ${level.color} border border-white/5 transition-colors text-sm font-medium`}>
              <Award className="w-4 h-4" />
              <span>Niveau {level.label}</span>
            </div>
            <button
              onClick={() => setShowLevelsModal(true)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
              title="Voir les niveaux"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ... (Rest of dashboard content) */}

        {/* ... (Existing Quick Actions link to profile can remain or be removed if redundant, keeping header one is cleaner) */}


        {/* Hero / Next Action Card */}
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in delay-100">
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-8 h-full flex flex-col justify-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
                  <PlayCircle className="w-3 h-3 fill-current" />
                  À faire ensuite
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">{nextAction.title}</h2>
                <p className="text-gray-400 text-lg mb-8">{nextAction.subtitle}</p>

                <Link
                  to={nextAction.link}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:translate-x-1"
                >
                  {nextAction.type === 'empty' ? 'Voir le catalogue' : 'Commencer la séance'}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Decorative Icon */}
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <Dumbbell className="w-64 h-64 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="glass-card p-4 lg:p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame className="w-5 h-5 lg:w-6 lg:h-6 fill-current" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm font-medium">Série</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{stats.streak} j</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 lg:p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm font-medium">Séances</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{stats.workoutsCount}</p>
                </div>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 glass-card p-4 lg:p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm font-medium">Temps total</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">{stats.totalDuration}h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="animate-fade-in delay-200">
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Activité de la semaine (min)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 4, 4]}>
                    {weeklyActivity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 animate-fade-in delay-200">

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Activité récente</h3>
              <Link to="/client/progress" className="text-sm text-blue-400 hover:text-blue-300 font-medium">Tout voir</Link>
            </div>

            <div className="space-y-3">
              {workoutSessions.length > 0 ? (
                workoutSessions.map((session: any) => (
                  <div key={session.id} className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{session.session?.name || "Séance libre"}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} • {session.duration_minutes || '?'} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Complété</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 glass-card rounded-xl border border-white/5">
                  Aucune activité récente
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Accès rapide</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link to="/marketplace" className="glass-card p-6 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/5 transition-all group text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <p className="font-bold text-white mb-1">Explorer</p>
                <p className="text-xs text-gray-500">Trouver un programme</p>
              </Link>

              <Link to="/client/progress" className="glass-card p-6 rounded-2xl border border-white/10 hover:border-green-500/50 hover:bg-white/5 transition-all group text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="font-bold text-white mb-1">Ma Progression</p>
                <p className="text-xs text-gray-500">Poids & Body stats</p>
              </Link>

              <Link to="/client/appointments" className="glass-card p-6 rounded-2xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all group text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="font-bold text-white mb-1">Calendrier</p>
                <p className="text-xs text-gray-500">Mes rendez-vous</p>
              </Link>

              <Link to="/client/profile" className="glass-card p-6 rounded-2xl border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all group text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <p className="font-bold text-white mb-1">Profil</p>
                <p className="text-xs text-gray-500">Mes infos</p>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Level Info Modal */}
      {showLevelsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full relative animate-slide-in">
            <button
              onClick={() => setShowLevelsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Niveaux d'entraînement</h3>
              <p className="text-gray-400 text-sm">
                Accumulez des séances pour monter en niveau et débloquer votre potentiel !
              </p>
            </div>

            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${stats.workoutsCount < 10 ? 'bg-yellow-500/10 border-yellow-500/30 ring-1 ring-yellow-500/50' : 'bg-white/5 border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${stats.workoutsCount < 10 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                    1
                  </div>
                  <div>
                    <p className={`font-bold ${stats.workoutsCount < 10 ? 'text-yellow-400' : 'text-gray-300'}`}>Débutant</p>
                    <p className="text-xs text-gray-500">0 - 9 séances</p>
                  </div>
                </div>
                {stats.workoutsCount < 10 && <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Actuel</span>}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${stats.workoutsCount >= 10 && stats.workoutsCount < 50 ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/50' : 'bg-white/5 border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${stats.workoutsCount >= 10 && stats.workoutsCount < 50 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    2
                  </div>
                  <div>
                    <p className={`font-bold ${stats.workoutsCount >= 10 && stats.workoutsCount < 50 ? 'text-blue-400' : 'text-gray-300'}`}>Intermédiaire</p>
                    <p className="text-xs text-gray-500">10 - 49 séances</p>
                  </div>
                </div>
                {stats.workoutsCount >= 10 && stats.workoutsCount < 50 && <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Actuel</span>}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${stats.workoutsCount >= 50 ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/50' : 'bg-white/5 border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${stats.workoutsCount >= 50 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    3
                  </div>
                  <div>
                    <p className={`font-bold ${stats.workoutsCount >= 50 ? 'text-purple-400' : 'text-gray-300'}`}>Expert</p>
                    <p className="text-xs text-gray-500">50+ séances</p>
                  </div>
                </div>
                {stats.workoutsCount >= 50 && <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Actuel</span>}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                Vous avez terminé <strong className="text-white">{stats.workoutsCount}</strong> séances au total.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;