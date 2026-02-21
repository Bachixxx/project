import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Droplets, Activity, Bone, Plus, LayoutDashboard, Dumbbell, Camera, Scale } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { NavRail } from '../shared/NavRail';
import { BiometricRingChart } from './BiometricRingChart';
import { BiometricTrendChart } from './BiometricTrendChart';
import { BodyVisualizer } from './BodyVisualizer'; // New Component
import { AddBodyScanModal } from './AddBodyScanModal';
import { PhotoEvolution } from './PhotoEvolution';

// Data Types matching DB is imported or redefined if needed. 
// Assuming ScanData interface is consistent with DB.
export interface ScanData {
    id: string;
    date: string;
    weight: number;
    height: number;
    bmi?: number;
    body_fat_percent: number;
    body_fat_mass: number;
    skeletal_muscle_mass: number;
    total_body_water: number;
    total_body_water_percent: number;
    bone_mass: number;
    visceral_fat_level: number;
    bmr: number;
    // Segmental Muscle
    segmental_muscle_right_arm: number;
    segmental_muscle_left_arm: number;
    segmental_muscle_trunk: number;
    segmental_muscle_right_leg: number;
    segmental_muscle_left_leg: number;
    // Segmental Fat
    segmental_fat_right_arm: number;
    segmental_fat_left_arm: number;
    segmental_fat_trunk: number;
    segmental_fat_right_leg: number;
    segmental_fat_left_leg: number;
    metabolic_age: number;
}

interface BiometricsDashboardProps {
    clientId: string;
    readOnly?: boolean;
}

export function BiometricsDashboard({ clientId, readOnly = false }: BiometricsDashboardProps) {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') as any || 'general';
    const [activeTab, setActiveTab] = useState<'general' | 'fat' | 'muscle' | 'water' | 'bone' | 'photos'>(initialTab);
    const [scanData, setScanData] = useState<ScanData | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState<Array<keyof ScanData>>(['weight']);

    const toggleMetric = (metricId: keyof ScanData) => {
        setSelectedMetrics(prev => {
            if (prev.includes(metricId)) {
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== metricId);
            } else {
                return [...prev, metricId];
            }
        });
    };

    const fetchLatestScan = async () => {
        if (!clientId) return;

        const cacheKey = `biometrics_data_${clientId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const { latest, history } = JSON.parse(cachedData);
                if (latest) setScanData(latest);
                if (history) setScanHistory(history);
            } catch (e) {
                console.error("Error parsing biometrics cache", e);
                setLoading(true);
            }
        } else {
            setLoading(true);
        }

        try {
            const { data, error } = await supabase
                .from('body_scans')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data && data.length > 0) {
                const latest = data[0];
                const history = [...data].reverse();

                setScanData(latest);
                setScanHistory(history);

                localStorage.setItem(cacheKey, JSON.stringify({
                    latest,
                    history,
                    timestamp: new Date().getTime()
                }));
            }
        } catch (error) {
            console.error('Error fetching body scan:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestScan();
    }, [clientId]);

    if (loading && !scanData) return <div className="min-h-[300px] flex items-center justify-center"><div className="loading loading-spinner text-blue-500"></div></div>;

    if (!scanData && !loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-[#1e293b]/50 rounded-3xl border border-dashed border-white/10 m-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Scale className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Aucune mesure</h2>
                <p className="text-gray-400 max-w-xs mb-8">Commencez votre suivi en ajoutant votre première analyse corporelle.</p>
                {!readOnly && (
                    <>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Ajouter une mesure
                        </button>
                        <AddBodyScanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchLatestScan} />
                    </>
                )}
            </div>
        );
    }

    // --- RENDER HELPERS ---

    // --- RENDER HELPERS ---

    const BiometricZoneBar = ({ value, min = 0, max = 100, low = 30, high = 70, unit, label }: any) => {
        // Calculate percentages for zones
        const range = max - min;
        const lowPercent = ((low - min) / range) * 100;
        const highPercent = ((high - min) / range) * 100;
        const valuePercent = Math.min(Math.max(((value - min) / range) * 100, 0), 100);

        // Determine status
        let statusText = "Normal";
        let statusColor = "text-emerald-400";
        if (value < low) {
            statusText = "Faible";
            statusColor = "text-yellow-400";
        } else if (value > high) {
            statusText = "Élevé";
            statusColor = "text-rose-400";
        }

        return (
            <div className="w-full mt-4 space-y-2">
                <div className="flex justify-between items-end text-xs font-medium">
                    <span className="text-slate-400">{label}</span>
                    <span className={statusColor}>{statusText}</span>
                </div>

                <div className="relative h-2 w-full bg-[#0f172a] rounded-full overflow-hidden flex shadow-inner">
                    {/* Low Zone */}
                    <div style={{ width: `${lowPercent}%` }} className="h-full bg-yellow-500/20 border-r border-[#0f172a]/50" />
                    {/* Normal Zone */}
                    <div style={{ width: `${highPercent - lowPercent}%` }} className="h-full bg-emerald-500/20 border-r border-[#0f172a]/50" />
                    {/* High Zone */}
                    <div style={{ width: `${100 - highPercent}%` }} className="h-full bg-rose-500/20" />

                    {/* Cursor */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] transition-all duration-1000"
                        style={{ left: `${valuePercent}%` }}
                    />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                    <span>{min}</span>
                    <span className="text-slate-600">{low}</span>
                    <span className="text-slate-600">{high}</span>
                    <span>{max}</span>
                </div>
            </div>
        );
    };

    const StatsCard = ({ title, value, unit, color, icon: Icon, goal, range }: any) => (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-[#4f44e9]/30 transition-colors">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500`}>
                <Icon className="w-16 h-16 transform rotate-12" />
            </div>

            <div className="relative z-10">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-2`}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                    <span className="text-sm font-medium text-primary">{unit}</span>
                </div>

                {range && (
                    <BiometricZoneBar
                        value={parseFloat(value)}
                        min={range[0]}
                        max={range[1]}
                        low={range[2]}
                        high={range[3]}
                        unit={unit}
                        label="Analyse"
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-24">
            {!readOnly && (
                <AddBodyScanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchLatestScan} />
            )}

            {/* Header & Main Stats */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-white">Suivi Corporel</h2>
                    {scanData && <p className="text-sm text-gray-400">Dernière mesure: {new Date(scanData.date).toLocaleDateString()}</p>}
                </div>
                {!readOnly && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-colors border border-indigo-500/30 flex-shrink-0"
                        title="Ajouter une mesure"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <NavRail
                tabs={[
                    { id: 'general', label: 'Général', icon: LayoutDashboard },
                    { id: 'muscle', label: 'Muscle', icon: Dumbbell },
                    { id: 'fat', label: 'Graisse', icon: Activity },
                    { id: 'water', label: 'Eau', icon: Droplets },
                    { id: 'bone', label: 'Os', icon: Bone },
                    { id: 'photos', label: 'Photos', icon: Camera }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as any)}
            />

            {/* TAB CONTENT */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 1. GENERAL TAB */}
                {activeTab === 'general' && scanData && (
                    <div className="space-y-6">
                        {/* Hero Ring Chart Container - Replaced with Stitch Main Card Style if desired, or kept as Ring */}
                        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 p-8 shadow-2xl">
                            {/* ... keeping ring chart for general view as it looks premium ... */}
                            <div className="flex flex-col items-center justify-center">
                                <BiometricRingChart
                                    percentage={75}
                                    label="Poids Actuel"
                                    subLabel=""
                                    value={`${scanData.weight} kg`}
                                    color="#4f44e9"
                                    size={220}
                                />
                                {/* Added Zone Bar for Weight context */}
                                <div className="w-full max-w-xs mt-6">
                                    <BiometricZoneBar value={scanData.weight} min={40} max={120} low={65} high={85} unit="kg" label="Analyse du Poids" />
                                </div>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatsCard title="Graisse" value={scanData.body_fat_percent || '--'} unit="%" color="yellow" icon={Activity} range={[5, 40, 10, 20]} />
                            <StatsCard title="Muscle" value={scanData.skeletal_muscle_mass || '--'} unit="kg" color="primary" icon={Dumbbell} range={[20, 60, 30, 45]} />
                            <StatsCard title="Eau" value={scanData.total_body_water_percent || '--'} unit="%" color="cyan" icon={Droplets} range={[40, 70, 50, 60]} />
                            <StatsCard title="Os" value={scanData.bone_mass || '--'} unit="kg" color="pink" icon={Bone} range={[1, 5, 2.5, 3.5]} />
                            <div className="col-span-2">
                                <StatsCard title="Métabolisme (BMR)" value={scanData.bmr || '--'} unit="kcal/j" color="orange" icon={Activity} />
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-[#1e293b]/40 border border-white/5 rounded-3xl p-6">
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">Évolution</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'weight', label: 'Poids', color: 'bg-indigo-500' },
                                        { id: 'body_fat_percent', label: 'Graisse', color: 'bg-yellow-500' },
                                        { id: 'skeletal_muscle_mass', label: 'Muscle', color: 'bg-blue-500' },
                                        { id: 'total_body_water_percent', label: 'Eau', color: 'bg-cyan-500' },
                                        { id: 'bone_mass', label: 'Os', color: 'bg-pink-500' },
                                        { id: 'bmi', label: 'IMC', color: 'bg-emerald-500' }
                                    ].map((metric) => (
                                        <button
                                            key={metric.id}
                                            onClick={() => toggleMetric(metric.id as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent ${selectedMetrics.includes(metric.id as any)
                                                ? `${metric.color} text-white shadow-lg`
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                                                }`}
                                        >
                                            {metric.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-64">
                                <BiometricTrendChart
                                    data={scanHistory}
                                    metrics={[
                                        { id: 'weight', label: 'Poids', color: '#4f44e9', unit: 'kg', yAxisId: 'common' },
                                        { id: 'body_fat_percent', label: 'Graisse', color: '#eab308', unit: '%', yAxisId: 'common' },
                                        { id: 'skeletal_muscle_mass', label: 'Muscle', color: '#3b82f6', unit: 'kg', yAxisId: 'common' },
                                        { id: 'total_body_water_percent', label: 'Eau', color: '#22d3ee', unit: '%', yAxisId: 'common' },
                                        { id: 'bone_mass', label: 'Os', color: '#ec4899', unit: 'kg', yAxisId: 'common' },
                                        { id: 'bmi', label: 'IMC', color: '#10b981', unit: '', yAxisId: 'common' }
                                    ].filter(m => selectedMetrics.includes(m.id as any))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MUSCLE TAB */}
                {activeTab === 'muscle' && scanData && (
                    <div className="space-y-6">
                        <StatsCard title="Masse Musculaire" value={scanData.skeletal_muscle_mass} unit="kg" color="primary" icon={Dumbbell} range={[20, 60, 30, 45]} />

                        <div className="relative bg-[#0b1221] rounded-[2.5rem] p-6 border border-blue-900/30 overflow-hidden shadow-2xl shadow-blue-900/20">
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                            <div className="text-center mb-4 relative z-10">
                                <h3 className="text-white font-bold text-lg">Visualisation Musculaire</h3>
                                <p className="text-blue-400 text-xs uppercase tracking-wider">Analyse Segmentaire</p>
                            </div>

                            <BodyVisualizer scanData={scanData} mode="muscle" />

                            <div className="mt-8 space-y-4 bg-[#1e293b]/50 p-6 rounded-2xl border border-white/5">
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Détails Segmentaires</h4>
                                <div className="grid grid-cols-1 gap-6">
                                    <BiometricZoneBar label="Bras Gauche" value={scanData.segmental_muscle_left_arm} unit="kg" min={1} max={6} low={2.5} high={4.5} />
                                    <BiometricZoneBar label="Bras Droit" value={scanData.segmental_muscle_right_arm} unit="kg" min={1} max={6} low={2.5} high={4.5} />
                                    <BiometricZoneBar label="Tronc" value={scanData.segmental_muscle_trunk} unit="kg" min={20} max={40} low={25} high={35} />
                                    <BiometricZoneBar label="Jambe Gauche" value={scanData.segmental_muscle_left_leg} unit="kg" min={5} max={15} low={8} high={12} />
                                    <BiometricZoneBar label="Jambe Droite" value={scanData.segmental_muscle_right_leg} unit="kg" min={5} max={15} low={8} high={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. FAT TAB (Uses similar visualizer logic) */}
                {activeTab === 'fat' && scanData && (
                    <div className="space-y-6">
                        <StatsCard title="Masse Grasse" value={scanData.body_fat_mass} unit="kg" color="yellow" icon={Activity} range={[2, 30, 8, 15]} />
                        <div className="relative bg-[#1a1505] rounded-[2.5rem] p-6 border border-yellow-900/30 overflow-hidden shadow-2xl shadow-yellow-900/10">
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
                            <div className="text-center mb-4 relative z-10">
                                <h3 className="text-white font-bold text-lg">Visualisation Graisseuse</h3>
                                <p className="text-yellow-500 text-xs uppercase tracking-wider">Analyse Segmentaire</p>
                            </div>
                            <BodyVisualizer scanData={scanData} mode="fat" />

                            <div className="mt-8 space-y-4 bg-[#1e293b]/50 p-6 rounded-2xl border border-white/5">
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Détails Segmentaires</h4>
                                <div className="grid grid-cols-1 gap-6">
                                    <BiometricZoneBar label="Bras Gauche" value={scanData.segmental_fat_left_arm} unit="kg" min={0} max={5} low={1} high={2.5} />
                                    <BiometricZoneBar label="Bras Droit" value={scanData.segmental_fat_right_arm} unit="kg" min={0} max={5} low={1} high={2.5} />
                                    <BiometricZoneBar label="Tronc" value={scanData.segmental_fat_trunk} unit="kg" min={2} max={15} low={5} high={10} />
                                    <BiometricZoneBar label="Jambe Gauche" value={scanData.segmental_fat_left_leg} unit="kg" min={0} max={8} low={2} high={4} />
                                    <BiometricZoneBar label="Jambe Droite" value={scanData.segmental_fat_right_leg} unit="kg" min={0} max={8} low={2} high={4} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. WATER TAB */}
                {activeTab === 'water' && scanData && (
                    <div className="space-y-6">
                        <StatsCard title="Masse Hydrique" value={scanData.total_body_water_percent} unit="%" color="cyan" icon={Droplets} range={[40, 70, 50, 60]} />

                        <div className="bg-[#1e293b]/40 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                <Droplets className="w-10 h-10 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Hydratation Globale</h3>
                            <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                                L'eau corporelle totale représente environ 50 à 60% du poids du corps.
                                Une bonne hydratation est essentielle pour la performance musculaire, la récupération et la santé globale.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <div className="text-2xl font-black text-white mb-1">
                                        {scanData.total_body_water_percent ? (scanData.total_body_water_percent < 50 ? 'À surveiller' : 'Optimale') : '--'}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Statut</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <div className="text-2xl font-black text-white mb-1">
                                        50-60%
                                    </div>
                                    <div className="text-xs text-cyan-400 uppercase tracking-wider">Objectif</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. PHOTOS TAB */}
                {activeTab === 'photos' && (
                    <PhotoEvolution clientId={clientId} readOnly={readOnly} />
                )}

                {/* 6. BONE TAB */}
                {activeTab === 'bone' && scanData && (
                    <div className="space-y-6">
                        <StatsCard title="Masse Osseuse" value={scanData.bone_mass} unit="kg" color="pink" icon={Bone} range={[1, 5, 2.5, 3.5]} />

                        <div className="bg-[#1e293b]/40 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                            <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                                <Bone className="w-10 h-10 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Densité Minérale Osseuse</h3>
                            <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                                La masse osseuse est un indicateur clé de la santé squelettique.
                                Un suivi régulier est important, une bonne nutrition et des exercices de musculation contribuent à la renforcer.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <div className="text-2xl font-black text-white mb-1">
                                        {scanData.bone_mass ? (scanData.bone_mass < 2.0 ? 'Faible' : 'Normale') : '--'}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Statut Estimé</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <div className="text-2xl font-black text-white mb-1">
                                        &gt; 2.5kg
                                    </div>
                                    <div className="text-xs text-pink-400 uppercase tracking-wider">Objectif</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
