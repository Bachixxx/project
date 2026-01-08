import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calendar, TrendingUp, Clock, PlayCircle, Dumbbell, ChevronRight, Award, Flame } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

function ClientDashboard() {
  const { client, loading: authLoading } = useClientAuth();
  const [loading, setLoading] = useState(false);
  const [clientPrograms, setClientPrograms] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
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

      // Fetch recent workout sessions for history and stats
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          session:sessions(name)
        `)
        .eq('client_id', client?.id)
        .order('date', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessions = sessionsData || [];
      setWorkoutSessions(sessions.slice(0, 5)); // Keep only last 5 for display

      // Calculate simple stats
      const totalDuration = sessions.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

      // Mock streak calculation (would need more complex logic in real app)
      setStats({
        workoutsCount: sessions.length,
        totalDuration: Math.round(totalDuration / 60), // in hours
        streak: sessions.length > 0 ? 3 : 0 // Mock streak
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
    // Priority 1: Scheduled Session today/soon
    if (upcomingSessions.length > 0) {
      const next = upcomingSessions[0];
      return {
        type: 'scheduled',
        data: next,
        title: next.session?.name || "Session planifiée",
        subtitle: new Date(next.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
        link: `/client/appointments`
      };
    }

    // Priority 2: Active Program
    if (clientPrograms.length > 0) {
      const prog = clientPrograms[0];
      return {
        type: 'program',
        data: prog,
        title: prog.program?.name || "Programme en cours",
        subtitle: "Continuer votre progression",
        link: `/client/workouts`
      };
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
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-in">
          <div>
            <p className="text-blue-400 font-medium tracking-wide text-sm uppercase mb-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{client?.full_name?.split(' ')[0]}</span>
            </h1>
          </div>
          <Link to="/client/profile" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-sm font-medium">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>Niveau Débutant</span>
          </Link>
        </div>

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
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Série en cours</p>
                  <p className="text-2xl font-bold text-white">{stats.streak} jours</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Séances terminées</p>
                  <p className="text-2xl font-bold text-white">{stats.workoutsCount}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Temps total</p>
                  <p className="text-2xl font-bold text-white">{stats.totalDuration}h</p>
                </div>
              </div>
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
    </div>
  );
}

export default ClientDashboard;