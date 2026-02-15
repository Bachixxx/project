import { motion } from 'framer-motion';

interface FilterChipsProps {
    filters: string[];
    activeFilter: string;
    onSelect: (filter: string) => void;
    className?: string;
}

export function WorkoutFilterChips({ filters, activeFilter, onSelect, className = '' }: FilterChipsProps) {
    return (
        <div className={`overflow-x-auto pb-4 scrollbar-hide ${className}`}>
            <div className="flex gap-3 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => onSelect(filter)}
                        className={`
                            relative px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200
                            ${activeFilter === filter
                                ? 'text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }
                        `}
                    >
                        {activeFilter === filter && (
                            <motion.div
                                layoutId="activeChip"
                                className="absolute inset-0 bg-blue-600 rounded-full"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{filter}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
