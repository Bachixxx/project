import { useState, useEffect } from 'react';
import { Clock, Dumbbell, Target, ChevronRight, PlayCircle, Trophy, Activity, Search, CalendarDays, History } from 'lucide-react';
import { TutorialCard } from '../../components/client/TutorialCard';
import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function ClientWorkouts() {
  const { client: authClient } = useClientAuth();
  const navigate = useNavigate();
  const client = authClient as any;
  const [loading, setLoading] = useState(true);
  const [clientPrograms, setClientPrograms] = useState<any[]>([]);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [nextSession, setNextSession] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (client) {
      fetchTrainingData();
    }
  }, [client]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Client Programs (Existing Logic)
      const { data: clientProgramsData } = await supabase
        .from('client_programs')
        .select(`
          id,
          start_date,
          status,
          progress,
          program:programs (
            id,
            name,
            description,
            duration_weeks,
            difficulty_level,
            coach_id,
            coach:coaches (
              full_name,
              specialization
            ),
            program_sessions (
              id,
              order_index,
              session:sessions (
                id,
                name,
                duration_minutes,
                session_exercises (
                  id,
                  sets,
                  reps,
                  exercise:exercises (
                    name
                  )
                )
              )
            )
          )
        `)
        .eq('client_id', client?.id)
        .order('created_at', { ascending: false });

      // Format Programs
      const formattedPrograms = (clientProgramsData || []).map(cp => {
        const program = cp.program as any;
        if (!program) return null;
        const allExercises = program.program_sessions?.flatMap((s: any) =>
          s.session?.session_exercises?.map((se: any) => se.exercise?.name) || []
        ) || [];
        const uniqueExercises = [...new Set(allExercises)].slice(0, 5);
        return {
          id: cp.id,
          name: program.name,
          coachName: program.coach?.full_name || 'Coach',
          description: program.description,
          duration: program.duration_weeks,
          difficulty: program.difficulty_level,
          startDate: cp.start_date,
          status: cp.status,
          progress: cp.progress || 0,
          totalSessions: program.program_sessions?.length || 0,
          previewExercises: uniqueExercises
        };
      }).filter(Boolean);
      setClientPrograms(formattedPrograms);

      // 2. Fetch Recent History (Completed Sessions)
      const { data: historyData } = await supabase
        .from('scheduled_sessions')
        .select(`
          id,
          completed_at,
          session:sessions (name, duration_minutes)
        `)
        .eq('client_id', client?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(3);

      setRecentHistory(historyData || []);

      // 3. Fetch Next Session (Pending Scheduled Sessions OR Appointments)
      // A. Scheduled Sessions (Program)
      const { data: pendingSessions } = await supabase
        .from('scheduled_sessions')
        .select(`
          id,
          scheduled_date,
          session:sessions (name, duration_minutes)
        `)
        .eq('client_id', client?.id)
        .neq('status', 'completed')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(1);

      // B. Appointments
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          title
        `)
        .eq('client_id', client?.id)
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

      // Determine which is sooner
      let nextItem = null;
      const progSession = pendingSessions?.[0];
      const appt = upcomingAppointments?.[0];

      if (progSession && appt) {
        // Compare dates
        if (new Date(progSession.scheduled_date) < new Date(appt.start_time)) {
          nextItem = { type: 'program_session', data: progSession, date: progSession.scheduled_date };
        } else {
          nextItem = { type: 'appointment', data: appt, date: appt.start_time };
        }
      } else if (progSession) {
        nextItem = { type: 'program_session', data: progSession, date: progSession.scheduled_date };
      } else if (appt) {
        nextItem = { type: 'appointment', data: appt, date: appt.start_time };
      }

      setNextSession(nextItem);

    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = clientPrograms.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.coachName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return "Aujourd'hui";
      if (isTomorrow(date)) return "Demain";
      return format(date, 'd MMMM', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  if (loading && clientPrograms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 pb-24 md:p-8">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Entraînement</h1>
            <p className="text-gray-400">Votre hub central pour toutes vos activités sportives.</p>
          </div>

          <Link to="/marketplace" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all text-sm font-medium">
            <span>Explorer le catalogue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 1. NEXT SESSION (Prochaine Séance) */}
        <div className="animate-fade-in delay-100">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            Prochaine Séance
          </h2>

          {nextSession ? (
            <div
              onClick={() => {
                if (nextSession.type === 'appointment') {
                  navigate(`/client/live-workout/appointment/${nextSession.data.id}`);
                } else {
                  navigate(`/client/live-workout/${nextSession.data.id}`);
                }
              }}
              className="glass-card p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-transparent cursor-pointer hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-xs font-bold uppercase tracking-wider">
                      {formatDate(nextSession.date)}
                    </span>
                    {nextSession.type === 'appointment' && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                        Rendez-vous
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {nextSession.type === 'appointment' ? nextSession.data.title : nextSession.data.session?.name}
                  </h3>
                  <p className="text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {nextSession.type === 'appointment' ? '60 min' : `${nextSession.data.session?.duration_minutes || '?'} min`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Aucune séance prévue</h3>
                <p className="text-gray-400 text-sm">Profitez du repos ou découvrez un nouveau programme.</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. RECENT HISTORY (Historique Récent) */}
        {recentHistory.length > 0 && (
          <div className="animate-fade-in delay-200">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Historique Récent
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentHistory.map((item) => (
                <div key={item.id} className="glass-card p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{formatDate(item.completed_at || '')}</p>
                    <p className="font-semibold text-white">{item.session?.name}</p>
                  </div>
                  <div className="text-green-400">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MY PROGRAMS (Mes Programmes) */}
        <div className="space-y-6 animate-fade-in delay-300">
          <TutorialCard
            tutorialId="workouts_intro"
            title="Hub Entraînement 🏋️‍♂️"
            message="Retrouvez ici vos prochaines séances, votre historique et tous vos programmes."
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-400" />
              Mes Programmes
            </h2>

            {/* Search Bar Inline */}
            <div className="glass-card px-3 py-1.5 rounded-lg border border-white/10 flex items-center w-full max-w-xs">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-sm w-full p-0"
              />
            </div>
          </div>


          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <div key={program.id} className="glass-card rounded-3xl border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all group">
                <div className="grid lg:grid-cols-12 gap-6">

                  {/* Visual / Cover */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-gray-800 to-gray-900 relative min-h-[200px] lg:min-h-full">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Dumbbell className="w-24 h-24 text-white" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(program.difficulty)}`}>
                        {getDifficultyLabel(program.difficulty)}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{program.duration} semaines</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-cyan-400" />
                          <span>{program.totalSessions} séances</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info / Progress */}
                  <div className="lg:col-span-8 p-6 lg:pl-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                        <div>
                          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                            {program.coachName}
                          </p>
                          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {program.name}
                          </h3>
                        </div>
                        {program.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20 self-start md:self-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Actif
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                        {program.description}
                      </p>

                      {/* Preview Exercises */}
                      <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Exercices inclus</p>
                        <div className="flex flex-wrap gap-2">
                          {program.previewExercises.map((ex: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-xs text-gray-300 border border-white/5">
                              {ex}
                            </span>
                          ))}
                          {program.previewExercises.length === 0 && (
                            <span className="text-gray-500 text-xs italic">Aucun aperçu disponible</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & CTA */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progression globale</span>
                          <span className="text-white font-bold">{program.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${program.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <Link
                          to={`/client/workout/${program.id}`}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-center border border-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-5 h-5 text-gray-400" />
                          <span>Détails</span>
                        </Link>
                        <Link
                          to={`/client/appointments`}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-bold text-center shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-5 h-5" />
                          <span>Reprendre</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-white/20 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Dumbbell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {searchTerm ? 'Aucun résultat' : 'Votre espace est vide'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                {searchTerm
                  ? "Aucun programme ne correspond à votre recherche."
                  : "Vous n'avez pas encore rejoint de programme d'entraînement. Explorez le catalogue pour trouver votre prochain défi !"
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/marketplace"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
                >
                  Découvrir les programmes
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientWorkouts;