import { motion } from 'framer-motion';
import { Bell, Play, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeroProps {
    clientName: string;
    nextSession: any | null;
    notificationsCount?: number;
}

export function DashboardHero({ clientName, nextSession, notificationsCount = 0 }: DashboardHeroProps) {
    const navigate = useNavigate();

    // Helper to format date
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
        <div className="relative w-full h-[45vh] min-h-[400px] flex flex-col justify-end pb-8 px-6 overflow-hidden">

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-[#0f172a]/60 to-[#0f172a]" />
                <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
                    alt="Workout Background"
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Top Bar (Absolute) */}
            <div className="absolute top-0 left-0 w-full p-6 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-start z-20">
                <div>
                    {/* Logo or Brand Mark could go here if needed */}
                </div>
                <button className="relative p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                    <Bell className="w-6 h-6" />
                    {notificationsCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl font-black text-white mb-1 tracking-tight">
                        Bonjour, <span className="text-blue-400">{clientName.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8 font-medium">Prêt à transpirer ? 🔥</p>
                </motion.div>

                {/* Next Session Card (Integrated) */}
                {nextSession ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full mb-2 uppercase tracking-wide">Prochaine Séance</span>
                                <h2 className="text-2xl font-bold text-white leading-tight">
                                    {nextSession.type === 'scheduled' ? nextSession.session.name : nextSession.title}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-6">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>{formatDate(nextSession.start || nextSession.scheduled_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                <span>Salle de sport</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(getSessionRoute(nextSession))}
                            className="w-full py-3.5 bg-white text-blue-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            COMMENCER
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/5"
                    >
                        <p className="text-gray-400 text-center">Aucune séance prévue aujourd'hui.</p>
                        <button
                            onClick={() => navigate('/client/workouts')}
                            className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                        >
                            Voir le catalogue
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
