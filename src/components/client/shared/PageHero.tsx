import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeroProps {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    headerContent?: ReactNode; // For buttons/actions in the top right or bottom of hero
    showBackButton?: boolean;
    children?: ReactNode; // For additional content inside the hero (like chips)
}

export function PageHero({
    title,
    subtitle,
    backgroundImage,
    headerContent,
    showBackButton = false,
    children
}: PageHeroProps) {
    const navigate = useNavigate();

    return (
        <div className="relative w-full h-[35vh] min-h-[300px] flex flex-col justify-end pb-8 px-6 overflow-hidden mb-6 rounded-b-[3rem] shadow-2xl shadow-black/50">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-[#0f172a]/60 to-[#0f172a]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                <img
                    src={backgroundImage || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"}
                    alt="Background"
                    className="w-full h-full object-cover opacity-50"
                />
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-start z-20">
                {showBackButton && (
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <div className="ml-auto">
                    {/* Placeholder for top right actions if needed */}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Badge / Label if needed */}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight uppercase">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-gray-300 text-lg font-medium max-w-xl">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Optional Header Content (Buttons, etc) */}
                        {headerContent && (
                            <div className="mb-1">
                                {headerContent}
                            </div>
                        )}
                    </div>

                    {/* Additional Children (Tabs, Filters, etc) */}
                    {children && (
                        <div className="mt-8">
                            {children}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
