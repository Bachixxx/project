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
                    className={`flex-none w-[150px] bg-slate-900/50 backdrop-blur-xl rounded-[1.5rem] p-4 flex flex-col justify-between border ${stat.borderColor || 'border-white/5'} shadow-xl ${stat.onClick ? 'cursor-pointer hover:bg-slate-800/60 active:scale-95 transition-all duration-300' : ''}`}
                >
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
                        <div className="flex items-center gap-1.5 text-white bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            {stat.icon && stat.icon}
                            <span className="text-sm font-extrabold">{stat.value}</span>
                        </div>
                    </div>
                    {/* Progress Bar or Subtext */}
                    {stat.progress !== undefined ? (
                        <div className="flex flex-col gap-1.5 w-full mt-2">
                            <span className="text-[10px] text-slate-400 font-bold text-right tracking-tight">{stat.subtext}</span>
                            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
                                <div
                                    className={`h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] relative overflow-hidden`}
                                    style={{ width: `${stat.progress}%` }}
                                >
                                    {/* Subtle shimmer inside progress bar */}
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex justify-end mt-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {stat.id === 'streak' && 'En cours'}
                                {stat.id === 'workouts' && 'Cette semaine'}
                            </span>
                        </div>
                    )}
                </motion.div>
            ))}
            {/* Spacer for right padding */}
            <div className="w-4 flex-none" />
        </div>
    );
}
