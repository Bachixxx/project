import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Calendar, TrendingUp, User } from 'lucide-react';

function ClientBottomNav() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { path: '/client/dashboard', icon: LayoutDashboard, label: 'Accueil' },
        { path: '/client/workouts', icon: Dumbbell, label: 'Programme' },
        { path: '/client/appointments', icon: Calendar, label: 'Agenda' },
        { path: '/client/progress', icon: TrendingUp, label: 'Progrès' },
        { path: '/client/profile', icon: User, label: 'Profil' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 z-50 lg:hidden safe-area-bottom">
            <div className="flex justify-around items-center">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${active ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <item.icon className={`w-6 h-6 ${active ? 'fill-current/10' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default ClientBottomNav;
