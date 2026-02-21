import React from 'react';

interface BodyVisualizerProps {
    scanData: any;
    mode: 'muscle' | 'fat';
}

export function BodyVisualizer({ scanData, mode }: BodyVisualizerProps) {
    if (!scanData) return null;

    const isMuscle = mode === 'muscle';
    const prefix = isMuscle ? 'segmental_muscle' : 'segmental_fat';
    const unit = isMuscle ? 'kg' : 'kg';

    // Helper for circular dot
    const Dot = () => (
        <div className="w-12 h-[1px] bg-cyan-accent/50 relative">
            <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border border-cyan-accent bg-[#0f172a]"></div>
        </div>
    );

    const DotLeft = () => (
        <div className="w-12 h-[1px] bg-cyan-accent/50 relative">
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full border border-cyan-accent bg-[#0f172a]"></div>
        </div>
    );

    return (
        <div className="relative flex flex-col items-center py-8 min-h-[450px] w-full max-w-[340px] mx-auto">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Body Silhouette */}
            <div className="relative z-10 w-full max-w-[280px]">
                <img
                    className="w-full h-auto drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] opacity-80"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBof6_Bs8Pz29x_suKFuYAoyNCP87q_4Bh_9rWyRzNvgkb7CkID9SpMQckpg_QDfqu2oelZ5MhxUyjlgiJVEs2p1DquVko769wfCA5hW9Qf35wswopFwELF9CD5pPGWLI5GHEJyILOPrGS4-pgj7vnNHJi_X3S3-38D9I5hjjnNAWGlGtV5JclPo1Onhb9rkVyDG4lsoKLW36WtC5AgOGZkcjyvW_KIuMME4MkAuaBZR_m_HyLN7O4Z9naMaf_2s3lwQ5sf4SYgH4"
                    alt="Body Visualization"
                />

                {/* Anatomical Callouts */}

                {/* Left Arm */}
                {scanData[`${prefix}_right_arm`] && (
                    <div className="absolute top-[20%] -left-4 flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Bras G.</p>
                            <p className="text-sm font-bold text-white">{scanData[`${prefix}_right_arm`]} {unit}</p>
                        </div>
                        <Dot />
                    </div>
                )}

                {/* Right Arm */}
                {scanData[`${prefix}_left_arm`] && (
                    <div className="absolute top-[20%] -right-4 flex items-center gap-2 flex-row-reverse">
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Bras D.</p>
                            <p className="text-sm font-bold text-white">{scanData[`${prefix}_left_arm`]} {unit}</p>
                        </div>
                        <DotLeft />
                    </div>
                )}

                {/* Trunk */}
                {scanData[`${prefix}_trunk`] && (
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2">
                        <div className="bg-[#4f44e9]/20 backdrop-blur-md border border-[#4f44e9]/40 rounded-lg px-3 py-1 text-center shadow-[0_0_20px_rgba(79,68,233,0.3)]">
                            <p className="text-[10px] uppercase tracking-widest text-slate-100 font-bold">Tronc</p>
                            <p className="text-base font-bold text-white leading-tight">{scanData[`${prefix}_trunk`]} {unit}</p>
                        </div>
                    </div>
                )}

                {/* Left Leg */}
                {scanData[`${prefix}_right_leg`] && (
                    <div className="absolute bottom-[15%] -left-8 flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Jambe G.</p>
                            <p className="text-sm font-bold text-white">{scanData[`${prefix}_right_leg`]} {unit}</p>
                        </div>
                        <div className="w-16 h-[1px] bg-cyan-accent/50 relative">
                            <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border border-cyan-accent bg-[#0f172a]"></div>
                        </div>
                    </div>
                )}

                {/* Right Leg */}
                {scanData[`${prefix}_left_leg`] && (
                    <div className="absolute bottom-[15%] -right-8 flex items-center gap-2 flex-row-reverse">
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Jambe D.</p>
                            <p className="text-sm font-bold text-white">{scanData[`${prefix}_left_leg`]} {unit}</p>
                        </div>
                        <div className="w-16 h-[1px] bg-cyan-accent/50 relative">
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full border border-cyan-accent bg-[#0f172a]"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
