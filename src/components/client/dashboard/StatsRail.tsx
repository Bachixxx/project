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
            {stats.map((stat, i) => {
                // Circular Progress calculations
                const radius = 24;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = stat.progress !== undefined
                    ? circumference - (stat.progress / 100) * circumference
                    : circumference;

                return (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={stat.onClick}
                        className={`flex-none w-[140px] h-[140px] bg-slate-900/50 backdrop-blur-xl rounded-[1.5rem] p-4 flex flex-col justify-between border ${stat.borderColor || 'border-white/5'} shadow-xl ${stat.onClick ? 'cursor-pointer hover:bg-slate-800/60 active:scale-95 transition-all duration-300' : ''} relative overflow-hidden group`}
                    >
                        {/* Subtle Background Glow */}
                        {stat.id === 'level' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl z-0"></div>
                        )}

                        <div className="flex justify-between items-start z-10 relative">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</span>
                            {stat.id !== 'level' && (
                                <div className="flex items-center justify-center w-6 h-6 bg-white/5 rounded-full border border-white/5 text-white">
                                    {stat.icon}
                                </div>
                            )}
                        </div>

                        {/* Circular Level Indicator */}
                        {stat.id === 'level' ? (
                            <div className="flex flex-col items-center justify-center z-10 relative w-full h-full pt-2">
                                <div className="relative w-[56px] h-[56px] flex items-center justify-center -ml-1">
                                    {/* SVG Background Track */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle
                                            cx="28"
                                            cy="28"
                                            r={radius}
                                            fill="transparent"
                                            className="stroke-slate-800/80"
                                            strokeWidth="5"
                                        />
                                        {/* SVG Progress Ring */}
                                        <circle
                                            cx="28"
                                            cy="28"
                                            r={radius}
                                            fill="transparent"
                                            className="stroke-emerald-400 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                            strokeWidth="5"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="text-xl font-black text-white">{stat.value}</span>
                                </div>
                                <span className="text-[9px] text-emerald-400 font-bold tracking-widest mt-2">{stat.subtext}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col pb-1 z-10 relative">
                                <span className="text-2xl font-black text-white tracking-tight leading-none mb-1">{stat.value}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                    {stat.id === 'streak' && 'En cours'}
                                    {stat.id === 'workouts' && 'Cettte semaine'}
                                    {stat.id === 'weight' && 'Actuel'}
                                </span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
            {/* Spacer for right padding */}
            <div className="w-4 flex-none" />
        </div>
    );
}
