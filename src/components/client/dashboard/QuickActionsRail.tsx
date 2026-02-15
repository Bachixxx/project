import { motion } from 'framer-motion';
import { MessageSquare, Scale, User, Settings, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActionsRail() {
    const navigate = useNavigate();

    const actions = [
        {
            id: 'chat',
            label: 'Coach',
            icon: <MessageSquare className="w-5 h-5 text-white" />,
            color: 'bg-blue-600',
            action: () => alert("Chat feature coming soon!") // Placeholder
        },
        {
            id: 'weight',
            label: 'Poids',
            icon: <Scale className="w-5 h-5 text-white" />,
            color: 'bg-purple-600',
            action: () => navigate('/client/body-composition')
        },
        {
            id: 'progress',
            label: 'Photos',
            icon: <Camera className="w-5 h-5 text-white" />,
            color: 'bg-pink-600',
            action: () => navigate('/client/body-composition?tab=photos')
        },
        {
            id: 'program',
            label: 'Programme',
            icon: <FileText className="w-5 h-5 text-white" />,
            color: 'bg-emerald-600',
            action: () => navigate('/client/workouts')
        },
        {
            id: 'profile',
            label: 'Profil',
            icon: <User className="w-5 h-5 text-white" />,
            color: 'bg-slate-600',
            action: () => navigate('/client/profile')
        },
        {
            id: 'settings',
            label: 'Réglages',
            icon: <Settings className="w-5 h-5 text-white" />,
            color: 'bg-gray-700',
            action: () => navigate('/client/settings')
        }
    ];

    return (
        <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-6">Accès Rapide</h3>
            <div className="w-full overflow-x-auto no-scrollbar pb-2 px-6 flex gap-4">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + (i * 0.05) }}
                        whileTap={{ scale: 0.9 }}
                        onClick={action.action}
                        className="flex flex-col items-center gap-2 flex-none group"
                    >
                        <div className={`p-0.5 rounded-full bg-gradient-to-br from-white/20 to-white/0 group-active:scale-95 transition-transform`}>
                            <div className={`w-14 h-14 rounded-full ${action.color} flex items-center justify-center shadow-lg`}>
                                {action.icon}
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-300">{action.label}</span>
                    </motion.button>
                ))}
                {/* Spacer */}
                <div className="w-2 flex-none" />
            </div>
        </div>
    );
}
