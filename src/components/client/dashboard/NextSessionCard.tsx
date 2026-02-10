import { motion } from 'framer-motion';
import { Play, Calendar, Clock, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NextSessionProps {
    session: any | null;
}

export function NextSessionCard({ session }: NextSessionProps) {
    const navigate = useNavigate();

    if (!session) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center mb-8"
            >
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucune séance prévue</h3>
                <p className="text-gray-400 text-sm mb-6">Profitez de votre repos ou consultez le catalogue.</p>
                <button
                    onClick={() => navigate('/client/workouts')}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors"
                >
                    Voir les programmes
                </button>
            </motion.div>
        );
    }

    const isScheduled = session.type === 'scheduled';
    const date = new Date(isScheduled ? session.scheduled_date : session.start);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const title = isScheduled ? session.session.name : session.title;
    const duration = isScheduled ? session.session.duration_minutes : '60'; // Default assumption
    const difficulty = isScheduled ? session.session.difficulty_level : 'medium';
    const sessionRoute = isScheduled
        ? `/client/live-workout/scheduled/${session.id}`
        : `/client/live-workout/appointment/${session.id}`;

    // Helper for difficulty color
    const getDifficultyColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'text-green-400 border-green-500/30 bg-green-500/10';
            case 'advanced': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
        >
            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-lg font-bold text-white">Prochaine Séance</h2>
                <button onClick={() => navigate('/client/appointments')} className="text-sm text-blue-400 font-medium">Voir tout</button>
            </div>

            <div
                onClick={() => navigate(sessionRoute)}
                className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl shadow-blue-900/40 cursor-pointer active:scale-95 transition-transform duration-200"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                    <Dumbbell className="w-32 h-32 text-white" />
                </div>

                <div className="relative bg-[#0f172a]/90 backdrop-blur-sm rounded-[1.8rem] p-6 h-full flex flex-col justify-between border border-white/5 group-hover:bg-[#0f172a]/80 transition-colors">

                    {/* Top Badges */}
                    <div className="flex gap-2 mb-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(difficulty)}`}>
                            {difficulty === 'beginner' ? 'Débutant' : difficulty === 'advanced' ? 'Avancé' : 'Intermédiaire'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300 border border-white/5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration} min
                        </span>
                    </div>

                    {/* Content */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight pr-8">{title}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}</span>
                            <span>•</span>
                            <span className="text-white font-medium">{time}</span>
                        </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2">
                            {['https://i.pravatar.cc/100?img=33', 'https://i.pravatar.cc/100?img=12'].map((i, idx) => (
                                <img key={idx} src={i} className="w-8 h-8 rounded-full border-2 border-[#1e293b]" alt="Participant" />
                            ))}
                            <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#1e293b] flex items-center justify-center text-[10px] text-white">
                                +3
                            </div>
                        </div>

                        <button className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors group-hover:translate-x-1 duration-300">
                            <Play className="w-4 h-4 fill-current" />
                            <span>GO</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
