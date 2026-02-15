import { motion } from 'framer-motion';
import { Trophy, Zap, Scale, TrendingUp } from 'lucide-react';

interface StatsRailProps {
    level: number;
    xp: number;
    streak: number;
    weight?: number; // Optional, if available
    onWeightClick?: () => void;
}

export function StatsRail({ level, xp, streak, weight, onWeightClick }: StatsRailProps) {
    const stats = [
        {
            id: 'level',
            label: 'Niveau',
            value: level,
            subtext: `${xp} XP`,
            icon: <Trophy className="w-5 h-5 text-yellow-400" />,
            color: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/30'
        },
        {
            id: 'streak',
            label: 'Série',
            value: `${streak} J`,
            subtext: 'En feu ! 🔥',
            icon: <Zap className="w-5 h-5 text-orange-400" />,
            color: 'from-orange-500/20 to-red-500/20',
            borderColor: 'border-orange-500/30'
        },
        {
            id: 'weight',
            label: 'Poids',
            value: weight ? `${weight} kg` : '--',
            subtext: 'Dernière pesée',
            icon: <Scale className="w-5 h-5 text-blue-400" />,
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            onClick: onWeightClick
        },
        {
            id: 'workouts',
            label: 'Séances',
            value: '3',
            subtext: 'Cette semaine',
            icon: <TrendingUp className="w-5 h-5 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30'
        }
    ];

    return (
        <div className="w-full overflow-x-auto no-scrollbar pb-4 pt-2 px-6 snap-x snap-mandatory flex gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stat.onClick}
                    className={`flex-none w-32 snap-start rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.borderColor} p-3 flex flex-col justify-between h-28 backdrop-blur-sm ${stat.onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                            {stat.icon}
                        </div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white leading-none mb-1">{stat.value}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{stat.label}</div>
                        <div className="text-[10px] text-gray-500 truncate">{stat.subtext}</div>
                    </div>
                </motion.div>
            ))}
            {/* Spacer for right padding */}
            <div className="w-1 flex-none" />
        </div>
    );
}
