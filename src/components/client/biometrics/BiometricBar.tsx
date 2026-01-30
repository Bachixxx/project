import React from 'react';

interface BiometricBarProps {
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    lowThreshold: number;
    highThreshold: number;
}

export function BiometricBar({ label, value, unit, min, max, lowThreshold, highThreshold }: BiometricBarProps) {
    // Normalize value to percentage for positioning
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    // Determine status color
    let statusColor = "bg-green-500";
    let statusText = "Normal";

    if (value < lowThreshold) {
        statusColor = "bg-yellow-500";
        statusText = "Inférieur";
    } else if (value > highThreshold) {
        statusColor = "bg-red-500";
        statusText = "Supérieur";
    }

    return (
        <div className="w-full mb-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h4 className="text-sm font-semibold text-gray-300">{label}</h4>
                    <span className="text-2xl font-bold text-white">{value} <span className="text-sm text-gray-500 font-normal">{unit}</span></span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/5 ${statusColor.replace('bg-', 'text-')}`}>
                    {statusText}
                </span>
            </div>

            <div className="relative h-6 w-full">
                {/* Background Track */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-700/50 rounded-full overflow-hidden flex">
                    {/* We could color code the track: Low / Normal / High zones */}
                    <div className="h-full bg-gray-600 w-1/3 border-r border-gray-800"></div>
                    <div className="h-full bg-gray-500 w-1/3 border-r border-gray-800"></div>
                    <div className="h-full bg-gray-600 w-1/3"></div>
                </div>

                {/* Labels Track */}
                <div className="absolute top-4 w-full flex justify-between text-[10px] text-gray-500 font-medium px-2">
                    <span>Inférieur</span>
                    <span>Normal</span>
                    <span>Supérieur</span>
                </div>

                {/* Indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-1000 ease-out z-10"
                    style={{ left: `calc(${percentage}% - 8px)`, backgroundColor: 'var(--status-color)' }}
                >
                    <div className={`w-full h-full rounded-full ${statusColor} opacity-80`}></div>
                </div>
            </div>
        </div>
    );
}
