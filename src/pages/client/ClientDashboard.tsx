import { useClientDashboardData } from '../../hooks/useClientDashboardData';
import { DashboardHero } from '../../components/client/dashboard/DashboardHero';
import { StatsRail } from '../../components/client/dashboard/StatsRail';
import { QuickActionsRail } from '../../components/client/dashboard/QuickActionsRail';
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
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-32">

      {/* 1. Immersive Hero Section */}
      <DashboardHero
        clientName={data.clientName}
        nextSession={data.nextSession}
        notificationsCount={2}
      />

      <div className="flex flex-col gap-8 -mt-6 relative z-10">

        {/* 2. Stats Rail (Horizontal Scroll) */}
        <div className="px-0">
          <StatsRail
            level={data.stats.level}
            xp={data.stats.xp}
            streak={data.stats.streak}
            weight={data.stats.weight}
          />
        </div>

        {/* 3. Quick Actions Rail */}
        <div className="px-0">
          <QuickActionsRail />
        </div>

        {/* 4. Weekly Activity (Existing Widget) */}
        <div className="px-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Cette Semaine</h3>
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
            <div className="h-32 flex items-end justify-between px-2">
              {data.weeklyActivity.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group w-full">
                  <div
                    className="w-full max-w-[1.5rem] rounded-t-sm bg-blue-500/20 group-hover:bg-blue-500/50 transition-all"
                    style={{ height: `${day.count > 0 ? (day.count * 30) + 10 : 5}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-500 uppercase">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'narrow' })}</span>
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