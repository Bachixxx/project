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
        <div className="relative h-[420px] w-full overflow-hidden shrink-0">
            {/* Dynamic Background (Edge to Edge) */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/40 to-[#0f172a]"></div>

            {/* Inner Content Container (Max Width for Responsiveness) */}
            <div className="relative z-20 w-full h-full max-w-5xl mx-auto">
                {/* Top Nav */}
                <div className="absolute top-0 left-0 w-full p-6 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center z-20">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 overflow-hidden bg-white/10 hidden">
                        {/* Optional generic avatar container */}
                    </div>
                    <div className="flex-1"></div> {/* Spacer */}
                    <button className="relative w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <Bell className="w-5 h-5" />
                        {notificationsCount > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
                        )}
                    </button>
                </div>

                {/* Greeting */}
                <div className="absolute bottom-40 left-6 right-6 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {welcomeMessage ? (
                            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                                {welcomeMessage}
                            </h1>
                        ) : (
                            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                                Bonjour, {clientName.split(' ')[0]}
                            </h1>
                        )}
                        <p className="text-slate-300 font-medium">Prêt pour votre séance de force ?</p>
                    </motion.div>
                </div>

                {/* Next Session Card (Glassmorphic) */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                    {nextSession ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-xl flex items-center justify-between shadow-xl"
                        >
                            <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Prochaine Séance</span>
                                <h3 className="text-lg font-bold text-white truncate">
                                    {nextSession.type === 'scheduled' ? nextSession.session.name : nextSession.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="truncate">{formatDate(nextSession.start || nextSession.scheduled_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                                        <Flame className="w-3.5 h-3.5" />
                                        <span>-- kcal</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(getSessionRoute(nextSession))}
                                className="bg-white text-blue-600 font-bold px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 text-sm shrink-0 whitespace-nowrap"
                            >
                                Démarrer
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-xl"
                        >
                            <p className="text-slate-300 text-sm font-medium">Aucune séance prévue aujourd'hui.</p>
                            <button
                                onClick={() => navigate('/client/workouts')}
                                className="mt-3 text-blue-400 font-bold text-sm hover:text-blue-300 transition-colors"
                            >
                                Voir le catalogue &rarr;
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
