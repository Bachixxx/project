import { useNavigate } from 'react-router-dom';
import { useClientDashboard } from '../../hooks/useClientDashboard';
import { DashboardHero } from '../../components/client/dashboard/DashboardHero';
import { StatsRail } from '../../components/client/dashboard/StatsRail';
import { QuickActionsRail } from '../../components/client/dashboard/QuickActionsRail';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ClientDashboard() {
  const navigate = useNavigate();
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
  if (error || !data || !data.client) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-4 text-center">
        <div>
          <p className="text-xl font-bold mb-2">Profil introuvable</p>
          <p className="text-gray-400 mb-6">Votre compte client n'est pas encore complètement configuré.</p>

          <button
            onClick={async () => {
              try {
                // Try to self-repair by creating a client profile
                const { error: createError } = await supabase
                  .from('clients')
                  .insert([{
                    auth_id: (await supabase.auth.getUser()).data.user?.id,
                    email: (await supabase.auth.getUser()).data.user?.email,
                    full_name: (await supabase.auth.getUser()).data.user?.user_metadata?.full_name || 'Nouveau Client',
                    status: 'active'
                  }]);

                if (createError) throw createError;

                // Force reload to pick up new profile
                window.location.reload();
              } catch (err) {
                console.error("Failed to create profile:", err);
                alert("Impossible de créer le profil automatiquement. Veuillez contacter le support.");
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
          >
            Créer mon profil maintenant
          </button>
        </div>
      </div>
    );
  }

  const { client, nextSession, stats, weeklyWorkouts, currentWeight, weeklyWorkoutsData } = data;

  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Create a Set of days with workouts (0 = Sunday, 1 = Monday, etc.)
  const daysWithWorkouts = new Set(
    (weeklyWorkoutsData || []).map((w: any) => new Date(w.completed_at || w.date).getDay())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-32 w-full relative overflow-x-hidden">

      {/* 1. Immersive Hero Section */}
      <DashboardHero
        clientName={client.full_name || 'Client'}
        nextSession={nextSession}
        notificationsCount={2} // Mocked for now, pending notification system
        heroImage={branding?.dashboardHeroImage}
        welcomeMessage={branding?.welcomeMessage}
      />

      <div className="flex flex-col -mt-4 relative z-10 w-full max-w-5xl mx-auto">

        {/* 2. Stats Rail (Horizontal Scroll) */}
        <div>
          <StatsRail
            level={stats?.level || 1}
            xp={stats?.xp || 0}
            streak={stats?.streakDays || 0}
            weight={currentWeight ?? undefined}
            onWeightClick={() => navigate('/client/body-composition')}
          />
        </div>

        {/* 3. Quick Actions Rail */}
        <div className="mt-2">
          <QuickActionsRail />
        </div>

        {/* 4. Weekly Activity Chart Card */}
        <div className="px-4 py-4 w-full">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-blue-500/10 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">Cette Semaine</h4>
                <p className="text-sm text-slate-400">{weeklyWorkouts} séances terminées</p>
              </div>
            </div>
            <div className="flex items-end justify-between h-32 gap-3 mt-4">
              {days.map((day, i) => {
                // Map i (0=Mon...6=Sun) to JS getDay() format (0=Sun, 1=Mon...6=Sat)
                const jsDayOfWeek = i === 6 ? 0 : i + 1;
                const isCompleted = daysWithWorkouts.has(jsDayOfWeek);
                const heightPercentage = isCompleted ? '80%' : '20%';
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ease-out ${isCompleted ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 group-hover:bg-slate-700'}`}
                      style={{ height: heightPercentage }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-500">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}