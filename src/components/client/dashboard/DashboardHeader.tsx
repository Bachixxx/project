import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
    clientName: string;
    notifications?: number;
    avatarUrl?: string;
}

export function DashboardHeader({ clientName, notifications = 0, avatarUrl }: DashboardHeaderProps) {
    // Get time of day for greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8 pt-2"
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#0f172a] p-[2px] overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={clientName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-full">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Online/Status Indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full"></div>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white leading-tight">
                        {getGreeting()}, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{clientName.split(' ')[0]}</span>
                    </h1>
                    <p className="text-xs text-gray-400 font-medium">Prêt pour l'entraînement ? 💪</p>
                </div>
            </div>

        </motion.div>
    );
}
