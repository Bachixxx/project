import React from 'react';

interface BiometricRingChartProps {
    percentage: number; // 0 to 100
    label: string;
    subLabel: string;
    value: string;
    color?: string;
    size?: number;
}

export function BiometricRingChart({
    percentage,
    label,
    subLabel,
    value,
    color = "#10b981",
    size = 200
}: BiometricRingChartProps) {
    const radius = size * 0.4;
    const strokeWidth = size * 0.1;
    const normalizedRadius = radius - strokeWidth * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                height={size}
                width={size}
                className="transform -rotate-90"
            >
                {/* Background Ring */}
                <circle
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Ring */}
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold mt-1">{label}</span>
                <span className="text-lg font-medium text-blue-400 mt-1">{subLabel}</span>
            </div>
        </div>
    );
}
