import React from 'react';

interface BodySegmentProps {
    part: 'leftArm' | 'rightArm' | 'trunk' | 'leftLeg' | 'rightLeg';
    value: string | number;
    label: string;
    x: number;
    y: number;
    align?: 'left' | 'right';
    highlight?: boolean;
}

export function BodyMap({ children }: { children?: React.ReactNode }) {
    return (
        <div className="relative w-full max-w-[300px] mx-auto aspect-[1/2] flex items-center justify-center">
            {/* 
        This is a simplified silhouette representation. 
        In a real production app, we would use a detailed SVG path. 
        For now, we use a conceptual visual using CSS/divs or a basic SVG structure.
      */}
            <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Silhouette Professional Path */}
                <path
                    d="M100,20 C115,20 122,32 122,45 C122,55 118,62 110,65 L150,75 C160,78 165,85 165,95 L175,150 C176,155 174,160 170,165 L155,170 C150,172 145,168 144,162 L138,110 L132,170 L150,350 C151,360 145,370 135,370 L115,370 C108,370 102,362 102,350 L102,200 L98,200 L98,350 C98,362 92,370 85,370 L65,370 C55,370 49,360 50,350 L68,170 L62,110 L56,162 C55,168 50,172 45,170 L30,165 C26,160 24,155 25,150 L35,95 C35,85 40,78 50,75 L90,65 C82,62 78,55 78,45 C78,32 85,20 100,20 Z"
                    fill="url(#bodyGradient)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    filter="url(#glow)"
                    className="opacity-90"
                />

                {/* Internal Segmentation Lines (Artistic) */}
                <path d="M50,75 L150,75" stroke="rgba(255,255,255,0.1)" strokeWidth="1" /> {/* Shoulders */}
                <path d="M68,170 L132,170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" /> {/* Hips */}
                <line x1="100" y1="65" x2="100" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" /> {/* Center */}

                {/* Grid lines effect */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" style={{ mixBlendMode: 'overlay' }} />
            </svg>
            {children}
        </div>
    );
}

export function BodySegmentLabel({ label, value, x, y, align = 'left' }: Omit<BodySegmentProps, 'part'>) {
    const isLeft = align === 'left'; // Label is on the LEFT side of the screen (pointing to Right body part)
    const isRight = align === 'right'; // Label is on the RIGHT side of the screen (pointing to Left body part)

    return (
        <div
            className={`absolute flex flex-col ${isRight ? 'items-start text-left' : 'items-end text-right'}`}
            style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)', width: 'auto' }}
        >
            <div className="bg-[#1e293b]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 shadow-2xl mb-1 min-w-[100px] relative z-20">
                <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">{label}</span>
                <span className="block text-xl font-bold text-white tracking-tight">{value}</span>
            </div>

            {/* Connector Dot */}
            <div className={`w-2 h-2 rounded-full bg-blue-500 absolute ${isRight ? '-left-8 mt-6' : '-right-8 mt-6'} top-0 box-content border-2 border-[#0f172a] z-10 hidden md:block`}></div>

            {/* Connector Line */}
            <svg className={`absolute top-0 pointer-events-none md:block hidden ${isRight ? 'left-0 -ml-8' : 'right-0 -mr-8'} w-8 h-10 overflow-visible`} style={{ zIndex: 0 }}>
                <path
                    d={isRight ? "M32,20 L0,20 L0,20" : "M0,20 L32,20 L32,20"}
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="2,2"
                />
            </svg>
        </div>
    );
}
