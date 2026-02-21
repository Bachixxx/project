import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StatsRailProps {
    level: number;
    xp: number;
    streak: number;
    weight?: number; // Optional, if available
    onWeightClick?: () => void;
}

export function StatsRail({ level, xp, streak, weight, onWeightClick }: StatsRailProps) {
    // Assuming max XP for current level is calculated elsewhere, or we use a dynamic formula
    // For now, let's assume next level is (level * 1000) XP roughly for visual display.
    const maxXpForLevel = level * 1000;
    const progressPerc = Math.min((xp / maxXpForLevel) * 100, 100);

    const stats = [
        {
            id: 'level',
            label: 'Niveau',
            value: level,
            progressColor: 'bg-blue-500',
            progress: progressPerc,
            subtext: `${xp} XP`
        },
        {
            id: 'streak',
            label: 'Série',
            value: `${streak}J`,
            icon: <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />,
            borderColor: 'border-orange-500/20'
        },
        {
            id: 'weight',
            label: 'Poids',
            value: weight ? `${weight}kg` : '--',
            borderColor: 'border-white/10',
            onClick: onWeightClick
        },
        {
            id: 'workouts',
            label: 'Séances',
            value: '3',
            borderColor: 'border-white/10'
        }
    ];

    return (
        <div className="w-full overflow-x-auto no-scrollbar pb-4 pt-2 px-6 flex gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={stat.onClick}
                    className={`flex-none w-[160px] bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between border ${stat.borderColor || 'border-white/10'} shadow-lg ${stat.onClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                        <div className="flex items-center gap-1 text-white">
                            {stat.icon && stat.icon}
                            <span className="text-lg font-extrabold">{stat.value}</span>
                        </div>
                    </div>
                    {/* Progress Bar or Subtext */}
                    {stat.progress !== undefined ? (
                        <div className="flex flex-col gap-1 w-full">
                            <span className="text-[10px] text-slate-400 font-medium text-right">{stat.subtext}</span>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${stat.progressColor} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                                    style={{ width: `${stat.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex justify-end">
                            <span className="text-[10px] text-slate-500">
                                {stat.id === 'streak' && 'En cours'}
                                {stat.id === 'workouts' && 'Cette semaine'}
                            </span>
                        </div>
                    )}
                </motion.div>
            ))}
            {/* Spacer for right padding */}
            <div className="w-2 flex-none" />
        </div>
    );
}
