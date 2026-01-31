import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
    beforeDate?: string;
    afterDate?: string;
}

export function ComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Avant",
    afterLabel = "Après",
    beforeDate,
    afterDate
}: ComparisonSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(() => setIsResizing(true), []);
    const handleMouseUp = useCallback(() => setIsResizing(false), []);

    const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ('touches' in e ? (e as any).touches[0].clientX : (e as MouseEvent).clientX) - rect.left;
        const width = rect.width;

        const position = Math.max(0, Math.min(100, (x / width) * 100));
        setSliderPosition(position);
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Touch events
            window.addEventListener('touchmove', handleMouseMove as any);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove as any);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[3/4] md:aspect-[4/3] bg-black rounded-3xl overflow-hidden cursor-ew-resize select-none border border-white/10 group"
        >
            {/* After Image (Background) */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    src={afterImage}
                    alt="After"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-right">
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">{afterLabel}</span>
                    {afterDate && <span className="block text-[10px] text-gray-300">{new Date(afterDate).toLocaleDateString()}</span>}
                </div>
            </div>

            {/* Before Image (Clipped overlay) */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden border-r border-white/20"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={beforeImage}
                    alt="Before"
                    className="absolute top-0 left-0 max-w-none h-full"
                    style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
                />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">{beforeLabel}</span>
                    {beforeDate && <span className="block text-[10px] text-gray-300">{new Date(beforeDate).toLocaleDateString()}</span>}
                </div>
            </div>

            {/* Handle/Slider Line */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown as any}
            >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                    <MoveHorizontal className="w-4 h-4 text-black" />
                </div>
            </div>

            {/* Tutorial Overlay (disappears on interaction) */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${isResizing || sliderPosition !== 50 ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-medium border border-white/10 animate-pulse">
                    Glissez pour comparer
                </div>
            </div>
        </div>
    );
}
