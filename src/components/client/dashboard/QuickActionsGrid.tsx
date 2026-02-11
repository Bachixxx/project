import { motion } from 'framer-motion';
import { TrendingUp, Award, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActionsGrid() {
    const navigate = useNavigate();

    const actions = [
        {
            title: 'Progression',
            icon: TrendingUp,
            color: 'bg-green-500',
            textColor: 'text-green-500',
            route: '/client/progress',
            desc: 'Dernier record: Bench Press'
        },
        {
            title: 'Agenda',
            icon: Calendar,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500',
            route: '/client/appointments',
            desc: 'Gérer mes créneaux'
        },
        {
            title: 'Succès',
            icon: Award,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-500',
            route: '/client/profile', // Or achievements page if created
            desc: '3 nouveaux badges'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
            <h3 className="text-lg font-bold text-white mb-2 pt-4 col-span-full">Raccourcis</h3>

            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => navigate(action.route)}
                    className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group"
                >
                    <div className={`p-3 rounded-xl ${action.color}/20 mr-4 group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 ${action.textColor}`} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-bold text-white">{action.title}</h4>
                        <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </button>
            ))}
        </motion.div>
    );
}
