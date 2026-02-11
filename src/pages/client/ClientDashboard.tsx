import { useClientDashboardData } from '../../hooks/useClientDashboardData';
import { DashboardHeader } from '../../components/client/dashboard/DashboardHeader';
import { StatsOverview } from '../../components/client/dashboard/StatsOverview';
import { NextSessionCard } from '../../components/client/dashboard/NextSessionCard';
import { QuickActionsGrid } from '../../components/client/dashboard/QuickActionsGrid';

import { DashboardSkeleton } from '../../components/client/skeletons/DashboardSkeleton';

function ClientDashboard() {
  const { data, loading, error } = useClientDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <p>Une erreur est survenue : {error || "Impossible de charger les données"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 pb-24 md:p-8 font-sans overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto lg:max-w-4xl">
        <DashboardHeader
          clientName={data.clientName}
          notifications={2} // Mock for now
        // avatarUrl={client.avatar_url} // If available in hook data
        />

        <StatsOverview
          level={data.stats.level}
          xp={data.stats.xp}
          streak={data.stats.streak}
          workoutsThisWeek={3}
        />

        <NextSessionCard session={data.nextSession} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActionsGrid />

          {/* Placeholder for future widgets like Weekly Graph */}
          <div className="hidden lg:block bg-white/5 border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Activité Hebdomadaire</h3>
            <div className="h-40 flex items-end justify-between px-2">
              {/* Simple Bar Chart Visualization */}
              {data.weeklyActivity.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div
                    className="w-8 rounded-t-lg bg-blue-500/20 group-hover:bg-blue-500/50 transition-all"
                    style={{ height: `${day.count > 0 ? (day.count * 40) + 10 : 10}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 uppercase">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'narrow' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;