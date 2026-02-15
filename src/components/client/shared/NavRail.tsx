import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TabItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface NavRailProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export function NavRail({ tabs, activeTab, onTabChange, className = '', variant = 'sticky' }: NavRailProps & { variant?: 'sticky' | 'embedded' }) {
    const containerStyles = variant === 'sticky'
        ? 'sticky top-0 z-30 pt-4 pb-4 -mt-4 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 mb-8'
        : 'relative bg-transparent p-0 m-0';

    return (
        <div className={`${containerStyles} ${className}`}>
            <div className={`flex items-center justify-center gap-2 overflow-x-auto no-scrollbar ${variant === 'sticky' ? 'px-4' : ''}`}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                                ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabRail"
                                    className="absolute inset-0 bg-blue-600 rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-current'}`} />
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
