import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

interface StatsProps {
    level: number;
    xp: number;
    streak: number;
    workoutsThisWeek?: number; // Optional as not currently used in UI
}

export function StatsOverview({ level, xp, streak }: StatsProps) {
    // Determine level progress (mock calculation: current xp % 1000 / 1000)
    const levelProgress = (xp % 1000) / 10; // Result is percentage 0-100

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
        >
            {/* Level Card */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Niveau</span>
                    <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white leading-none">{level}</span>
                    <span className="text-xs text-indigo-300 font-medium mb-1">Elite</span>
                </div>
                <div className="w-full bg-indigo-900/30 h-1.5 rounded-full mt-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                    />
                </div>
                <p className="text-[10px] text-indigo-400/80 mt-1 text-right">{xp % 1000} / 1000 XP</p>
            </div>

            {/* Streak Card */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 to-transparent"></div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Série</span>
                    <Zap className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white leading-none">{streak}</span>
                    <span className="text-xs text-orange-300 font-medium mb-1">jours</span>
                </div>
                <p className="text-[10px] text-orange-400/80 mt-2">Continue comme ça ! 🔥</p>
            </div>
        </motion.div>
    );
}
