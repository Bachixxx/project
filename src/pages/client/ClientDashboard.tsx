import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Dumbbell,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  Play
} from 'lucide-react';
import { useClientDashboard } from '../../hooks/useClientDashboard';

export default function ClientDashboard() {
  const { data, isLoading } = useClientDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const {
    client,
    nextSession,
    activeProgram,
    weeklyWorkouts,
    // weightProgress, // unused
    programProgress,
    recentLogs,
    stats
  } = data || {};

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in pb-24 md:pb-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {client?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400">
            Prêt pour votre entraînement aujourd'hui ?
          </p>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-400">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.streakDays || 0} jours</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-400">Total Séances</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalWorkouts || 0}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-400">Volume Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{(stats?.totalVolume || 0).toLocaleString()} kg</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-400">Cette semaine</span>
          </div>
          <p className="text-2xl font-bold text-white">{weeklyWorkouts || 0} séances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Program */}
          {activeProgram ? (
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Programme Actif</h3>
                    <p className="text-2xl font-bold text-primary-400">{activeProgram.program?.name}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium border border-primary-500/20">
                    Semaine {Math.ceil(((programProgress || 0) / 100) * (activeProgram.program?.duration_weeks || 1))} / {activeProgram.program?.duration_weeks}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progression globale</span>
                      <span className="text-white font-medium">{programProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                        style={{ width: `${programProgress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to="/client/workouts"
                    className="primary-button w-full flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform"
                  >
                    <Play className="w-5 h-5" />
                    <span>Continuer le programme</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun programme actif</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Demandez à votre coach de vous assigner un programme ou explorez les programmes disponibles.
              </p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Activité Récente</h3>
              <Link to="/client/progress" className="text-sm text-primary-400 hover:text-primary-300">
                Voir tout
              </Link>
            </div>

            <div className="space-y-4">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Séance d'entraînement</p>
                      <p className="text-sm text-gray-400">
                        {new Date(log.created_at).toLocaleDateString()} • {log.sets} séries
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{log.weight} kg</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Aucune activité récente
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Next Session */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Prochaine Séance</h3>
            {nextSession ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex flex-col items-center justify-center border border-primary-500/20">
                    <span className="text-xs font-bold uppercase">{new Date(nextSession.start).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    <span className="text-lg font-bold">{new Date(nextSession.start).getDate()}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{nextSession.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <Clock className="w-4 h-4" />
                      {new Date(nextSession.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span>•</span>
                      <span>{nextSession.duration} min</span>
                    </div>
                  </div>
                </div>

                {nextSession.coach && (
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                      {nextSession.coach.avatar_url ? (
                        <img src={nextSession.coach.avatar_url} alt={nextSession.coach.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {nextSession.coach.full_name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-300">avec {nextSession.coach.full_name}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Aucune séance prévue</p>
                <Link to="/client/appointments" className="text-primary-400 text-sm mt-2 inline-block hover:underline">
                  Prendre rendez-vous
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}