import { useClientDashboard } from '../../hooks/useClientDashboard';
import { DashboardHero } from '../../components/client/dashboard/DashboardHero';
import { StatsRail } from '../../components/client/dashboard/StatsRail';
import { QuickActionsRail } from '../../components/client/dashboard/QuickActionsRail';
import { useTheme } from '../../contexts/ThemeContext';

export default function ClientDashboard() {
  const { data, isLoading: loading, error } = useClientDashboard();
  const { branding } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="loading loading-lg text-primary-500"></div>
      </div>
    );
  }

  // Handle error or empty data state more gracefully if needed
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <p>Erreur de chargement des données. Veuillez réessayer.</p>
      </div>
    );
  }

  const { client, nextSession, stats, weightHistory, weeklyWorkouts } = data;
  const currentWeight = weightHistory && weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight
    : undefined;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-32">

      {/* 1. Immersive Hero Section */}
      <DashboardHero
        clientName={client.full_name || 'Client'}
        nextSession={nextSession}
        notificationsCount={2} // Mocked for now, pending notification system
        heroImage={branding?.dashboardHeroImage}
        welcomeMessage={branding?.welcomeMessage}
      />

      <div className="flex flex-col gap-8 -mt-6 relative z-10">

        {/* 2. Stats Rail (Horizontal Scroll) */}
        <div className="px-0">
          <StatsRail
            level={stats?.level || 1}
            xp={stats?.xp || 0}
            streak={stats?.streakDays || 0}
            weight={currentWeight}
          />
        </div>

        {/* 3. Quick Actions Rail */}
        <div className="px-0">
          <QuickActionsRail />
        </div>

        {/* 4. Weekly Activity (Simplified) */}
        <div className="px-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Cette Semaine</h3>
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">{weeklyWorkouts}</span>
              <span className="text-sm text-gray-400">séances terminées</span>
            </div>
            {/* Simple visual indicator */}
            <div className="flex gap-1 h-12 items-end">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`w-2 rounded-full ${i < weeklyWorkouts ? 'bg-blue-500' : 'bg-white/10'}`} style={{ height: `${i < weeklyWorkouts ? '80%' : '30%'}` }}></div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}