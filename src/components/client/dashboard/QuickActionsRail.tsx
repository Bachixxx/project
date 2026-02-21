import { motion } from 'framer-motion';
import { MessageSquare, Scale, User, Settings, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActionsRail() {
    const navigate = useNavigate();

    const actions = [
        {
            id: 'chat',
            label: 'Coach',
            icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30',
            action: () => alert("Chat feature coming soon!") // Placeholder
        },
        {
            id: 'weight',
            label: 'Poids',
            icon: <Scale className="w-6 h-6 text-emerald-400" />,
            bgColor: 'bg-emerald-500/20',
            borderColor: 'border-emerald-500/30',
            action: () => navigate('/client/body-composition')
        },
        {
            id: 'progress',
            label: 'Photos',
            icon: <Camera className="w-6 h-6 text-rose-400" />,
            bgColor: 'bg-rose-500/20',
            borderColor: 'border-rose-500/30',
            action: () => navigate('/client/body-composition?tab=photos')
        },
        {
            id: 'program',
            label: 'Prog',
            icon: <FileText className="w-6 h-6 text-amber-400" />,
            bgColor: 'bg-amber-500/20',
            borderColor: 'border-amber-500/30',
            action: () => navigate('/client/workouts')
        },
        {
            id: 'profile',
            label: 'Profil',
            icon: <User className="w-6 h-6 text-indigo-400" />,
            bgColor: 'bg-indigo-500/20',
            borderColor: 'border-indigo-500/30',
            action: () => navigate('/client/profile')
        },
        {
            id: 'settings',
            label: 'Réglages',
            icon: <Settings className="w-6 h-6 text-slate-400" />,
            bgColor: 'bg-slate-500/20',
            borderColor: 'border-slate-500/30',
            action: () => navigate('/client/profile?tab=settings')
        }
    ];

    return (
        <div className="py-2">
            <div className="w-full overflow-x-auto no-scrollbar px-6 flex gap-4">
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
                        <div className={`w-16 h-16 rounded-full ${action.bgColor} flex items-center justify-center border ${action.borderColor} group-active:scale-95 transition-transform`}>
                            {action.icon}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-tighter text-slate-400">{action.label}</span>
                    </motion.button>
                ))}
                {/* Spacer */}
                <div className="w-2 flex-none" />
            </div>
        </div>
    );
}
