import { motion } from 'framer-motion';
import { Bell, Calendar, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeroProps {
    clientName: string;
    nextSession: any | null;
    notificationsCount?: number;
    heroImage?: string;
    welcomeMessage?: string;
}

export function DashboardHero({ clientName, nextSession, notificationsCount = 0, heroImage, welcomeMessage }: DashboardHeroProps) {
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getSessionRoute = (session: any) => {
        const isScheduled = session.type === 'scheduled';
        return isScheduled
            ? `/client/live-workout/${session.id}`
            : `/client/live-workout/appointment/${session.id}`;
    };

    return (
        <div className="relative w-full shrink-0 min-h-[480px] flex flex-col justify-end pb-8">
            {/* Massive Background Image with Premium Dark Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[30%] pointer-events-none"
                style={{ backgroundImage: `url('${heroImage || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop"}')` }}
            ></div>
            {/* Multi-layered gradient for perfect text readability (Dark to transparent to Dark) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20 pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

            {/* Inner Content Container */}
            <div className="relative z-20 w-full max-w-5xl mx-auto px-4 md:px-6 mt-[env(safe-area-inset-top)] flex flex-col justify-between h-full pt-6">

                {/* Top Nav (Greeting & Notifications) */}
                <div className="flex justify-between items-start mb-6 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {welcomeMessage ? (
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                {welcomeMessage}
                            </h1>
                        ) : (
                            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                Bonjour, {clientName.split(' ')[0]} <span className="animate-wave">👋</span>
                            </h1>
                        )}
                        <p className="text-emerald-400 text-sm font-medium mt-1">Prêt à dominer votre journée ?</p>
                    </motion.div>

                    <button className="relative w-10 h-10 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-lg active:scale-95">
                        <Bell className="w-5 h-5" />
                        {notificationsCount > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
                        )}
                    </button>
                </div>

                {/* Next Session Card (Massive Glassmorphic Focus) */}
                <div className="w-full relative z-20">
                    {nextSession ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group"
                        >
                            {/* Decorative Animated Glow inside the card */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] group-hover:bg-emerald-400/30 transition-colors duration-700 pointer-events-none"></div>

                            <div className="flex flex-col gap-2 relative z-10 mb-6 pb-6 border-b border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Prochaine Séance</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {nextSession.type === 'scheduled' ? nextSession.session.name : nextSession.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Calendar className="w-4 h-4 text-emerald-500" />
                                        <span>{formatDate(nextSession.start || nextSession.scheduled_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span>Focus</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(getSessionRoute(nextSession))}
                                className="relative w-full overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold px-6 py-4 md:py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                <span className="relative z-10 text-lg">Démarrer Entraînement</span>
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-0"></div>
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 pointer-events-none"></div>
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <span className="text-2xl">🛋️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Repos mérité</h3>
                            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Votre corps récupère. Explorez le catalogue pour planifier la suite.</p>
                            <button
                                onClick={() => navigate('/client/workouts')}
                                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-4 rounded-xl border border-white/10 transition-colors active:scale-95"
                            >
                                Explorer le catalogue
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
