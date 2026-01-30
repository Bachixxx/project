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
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    </linearGradient>
                </defs>

                {/* Head */}
                <circle cx="100" cy="40" r="25" fill="url(#bodyGradient)" className="opacity-50" />

                {/* Torso */}
                <path d="M75,70 L125,70 L130,180 L70,180 Z" fill="url(#bodyGradient)" className="opacity-90" />

                {/* Arms */}
                <path d="M70,75 L40,150 L55,155 L80,80 Z" fill="url(#bodyGradient)" className="opacity-70" /> {/* Left Arm */}
                <path d="M130,75 L160,150 L145,155 L120,80 Z" fill="url(#bodyGradient)" className="opacity-70" /> {/* Right Arm */}

                {/* Legs */}
                <path d="M75,185 L60,320 L80,320 L90,190 Z" fill="url(#bodyGradient)" className="opacity-80" /> {/* Left Leg */}
                <path d="M125,185 L140,320 L120,320 L110,190 Z" fill="url(#bodyGradient)" className="opacity-80" /> {/* Right Leg */}

                {/* Grid lines effect */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" style={{ mixBlendMode: 'overlay' }} />
            </svg>
            {children}
        </div>
    );
}

export function BodySegmentLabel({ label, value, x, y, align = 'left' }: Omit<BodySegmentProps, 'part'>) {
    const isLeft = align === 'left';

    return (
        <div
            className={`absolute flex flex-col ${isLeft ? 'items-end text-right' : 'items-start text-left'}`}
            style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
        >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 shadow-xl mb-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <span className="block text-lg font-bold text-white">{value}</span>
            </div>
            {/* Connector Line */}
            <div className={`w-12 h-[1px] bg-white/30 absolute top-full ${isLeft ? 'right-4' : 'left-4'} rotate-45 origin-top`}></div>
        </div>
    );
}
