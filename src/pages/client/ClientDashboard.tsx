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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 w-full relative overflow-x-hidden selection:bg-emerald-500/30">

      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[-20%] w-[70%] h-[70%] bg-teal-600/10 rounded-full blur-[100px] mix-blend-screen opacity-30 animate-pulse-slow delay-1000"></div>
      </div>

      {/* 1. Immersive Hero Section */}
      <DashboardHero
        clientName={client.full_name || 'Client'}
        nextSession={nextSession}
        notificationsCount={2} // Mocked for now
        heroImage={branding?.dashboardHeroImage}
        logoUrl={branding?.logoUrl}
        appName={branding?.appName}
        welcomeMessage={branding?.welcomeMessage}
      />

      <div className="flex flex-col relative z-10 w-full max-w-5xl mx-auto">

        {/* 2. Stats Rail (Horizontal Scroll) */}
        <div className="mt-4">
          <StatsRail
            level={stats?.level || 1}
            xp={stats?.xp || 0}
            streak={stats?.streakDays || 0}
            weight={currentWeight ?? undefined}
            onWeightClick={() => navigate('/client/body-composition')}
          />
        </div>

        {/* 3. Quick Actions Rail */}
        <div className="mt-4">
          <QuickActionsRail />
        </div>

        {/* 4. Weekly Activity Chart Card (Gamified) */}
        <div className="px-4 py-6 w-full">
          <div className="bg-slate-900/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Subtle top border glow */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h4 className="text-xl font-extrabold text-white tracking-tight">Cette Semaine</h4>
                <p className="text-sm text-emerald-400 font-medium mt-1">{weeklyWorkouts} séances terminées <span className="opacity-70">/ 7</span></p>
              </div>
            </div>
            <div className="flex items-end justify-between h-36 gap-2 md:gap-4 relative z-10">
              {days.map((day, i) => {
                // Map i (0=Mon...6=Sun) to JS getDay() format (0=Sun, 1=Mon...6=Sat)
                const jsDayOfWeek = i === 6 ? 0 : i + 1;
                const isCompleted = daysWithWorkouts.has(jsDayOfWeek);
                const isToday = new Date().getDay() === jsDayOfWeek;
                const heightPercentage = isCompleted ? '85%' : isToday ? '15%' : '20%';

                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group/bar cursor-pointer">
                    <div className="w-full relative flex items-end justify-center rounded-xl transition-all duration-700 h-full">
                      <div
                        className={`w-full max-w-[40px] rounded-xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCompleted
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : isToday
                            ? 'bg-slate-700/80 border border-slate-600'
                            : 'bg-slate-800/50 group-hover/bar:bg-slate-700 border border-transparent group-hover/bar:border-white/5'
                          } relative overflow-hidden`}
                        style={{ height: heightPercentage }}
                      >
                        {/* Glass reflection on completed bars */}
                        {isCompleted && (
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-400' : isCompleted ? 'text-white' : 'text-slate-500'}`}>
                      {day}
                    </span>
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