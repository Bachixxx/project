import React, { useState, useEffect } from 'react';
import { Scale, Droplets, Activity, Bone, Plus, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BiometricRingChart } from './BiometricRingChart';
import { BiometricTrendChart } from './BiometricTrendChart';
import { BodyMap, BodySegmentLabel } from './BodyMap';
import { BiometricBar } from './BiometricBar';
import { AddBodyScanModal } from './AddBodyScanModal';
import { PhotoEvolution } from './PhotoEvolution';

// Data Types matching DB
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
    const [activeTab, setActiveTab] = useState<'general' | 'fat' | 'muscle' | 'water' | 'bone' | 'photos'>('general');
    const [scanData, setScanData] = useState<ScanData | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState<Array<keyof ScanData>>(['weight']);

    // Helper to toggle metric selection
    const toggleMetric = (metricId: keyof ScanData) => {
        setSelectedMetrics(prev => {
            if (prev.includes(metricId)) {
                // Remove it, but keep at least one
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== metricId);
            } else {
                return [...prev, metricId];
            }
        });
    };

    const fetchLatestScan = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('body_scans')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20); // Fetch last 20 scans for history

            if (error) throw error;
            if (data && data.length > 0) {
                setScanData(data[0]); // Latest scan is the first one
                setScanHistory([...data].reverse()); // History needs to be chronological for the chart
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

    const tabs = [
        { id: 'general', label: 'Général' },
        { id: 'fat', label: 'Graisse' },
        { id: 'muscle', label: 'Muscle' },
        { id: 'water', label: 'Eau' },
        { id: 'muscle', label: 'Muscle' },
        { id: 'water', label: 'Eau' },
        { id: 'bone', label: 'Os' },
        { id: 'photos', label: 'Photos' }
    ];

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Chargement des données...</div>;

    if (!scanData && !loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-3xl border border-white/5">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Aucune analyse disponible</h2>
                <p className="text-gray-400 max-w-xs mb-8">
                    {readOnly
                        ? "Ce client n'a pas encore ajouté d'analyse corporelle."
                        : "Commencez par ajouter votre première pesée pour suivre votre évolution."}
                </p>

                {!readOnly && (
                    <>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter une mesure
                        </button>

                        <AddBodyScanModal
                            isOpen={isAddModalOpen}
                            onClose={() => setIsAddModalOpen(false)}
                            onSuccess={() => {
                                fetchLatestScan();
                            }}
                        />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!readOnly && (
                <AddBodyScanModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        fetchLatestScan();
                    }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-left">
                    <h2 className="text-xl font-bold text-white">Analyse Corporelle</h2>
                    {scanData && <p className="text-xs text-gray-400">{new Date(scanData.date).toLocaleDateString()}</p>}
                </div>
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 rounded-full"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-fade-in space-y-6">

                {activeTab === 'general' && scanData && (
                    <>
                        {/* Main Ring Chart */}
                        <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden bg-[#1e293b]/50 border border-white/10">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                            <BiometricRingChart
                                percentage={scanData.total_body_water_percent || 0}
                                label="IMC"
                                subLabel={scanData.bmi ? `${scanData.bmi}` : '--'}
                                value={`${scanData.weight} kg`}
                                color="#06b6d4"
                                size={240}
                            />

                            {/* Floating Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-8">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-yellow-500 uppercase mb-1">Graisse</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.body_fat_percent || '--'} %</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-red-500 uppercase mb-1">Muscle</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.skeletal_muscle_mass || '--'} kg</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-pink-500 uppercase mb-1">Os</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.bone_mass || '--'} kg</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase mb-1">Eau</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.total_body_water_percent || '--'} %</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-purple-500 uppercase mb-1">Viscérale</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.visceral_fat_level || '--'}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-xs font-bold text-green-500 uppercase mb-1">BMR</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.bmr || '--'} <span className="text-xs text-gray-400 font-normal">kcal</span></p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm lg:col-span-2">
                                    <h3 className="text-xs font-bold text-blue-300 uppercase mb-1">Âge Meta.</h3>
                                    <p className="text-2xl font-bold text-white">{scanData.metabolic_age || '--'} <span className="text-xs text-gray-400 font-normal">ans</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Trend Chart Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                                {[
                                    { id: 'weight', label: 'Poids', color: 'bg-blue-500', text: 'text-blue-500' },
                                    { id: 'bmi', label: 'IMC', color: 'bg-emerald-500', text: 'text-emerald-500' },
                                    { id: 'body_fat_percent', label: 'Graisse %', color: 'bg-yellow-500', text: 'text-yellow-500' },
                                    { id: 'skeletal_muscle_mass', label: 'Muscle (kg)', color: 'bg-red-500', text: 'text-red-500' },
                                    { id: 'total_body_water_percent', label: 'Eau %', color: 'bg-cyan-500', text: 'text-cyan-500' },
                                    { id: 'bone_mass', label: 'Os (kg)', color: 'bg-pink-500', text: 'text-pink-500' },
                                    { id: 'visceral_fat_level', label: 'Viscérale', color: 'bg-purple-500', text: 'text-purple-500' },
                                    { id: 'bmr', label: 'BMR', color: 'bg-green-500', text: 'text-green-500' },
                                    { id: 'metabolic_age', label: 'Âge Meta.', color: 'bg-orange-500', text: 'text-orange-500' },
                                ].map((metric) => {
                                    const isSelected = selectedMetrics.includes(metric.id as keyof ScanData);
                                    return (
                                        <button
                                            key={metric.id}
                                            onClick={() => toggleMetric(metric.id as keyof ScanData)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isSelected
                                                ? `${metric.color} text-white shadow-lg ring-2 ring-white/20`
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                            {metric.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <BiometricTrendChart
                                data={scanHistory}
                                metrics={
                                    [
                                        // Standard metrics share the same 'common' axis to show relative magnitude
                                        { id: 'weight', label: 'Poids', color: '#3b82f6', unit: 'kg', yAxisId: 'common' },
                                        { id: 'bmi', label: 'IMC', color: '#10b981', unit: 'kg/m²', yAxisId: 'common' },
                                        { id: 'body_fat_percent', label: 'Masse Grasse', color: '#eab308', unit: '%', yAxisId: 'common' },
                                        { id: 'skeletal_muscle_mass', label: 'Masse Musculaire', color: '#ef4444', unit: 'kg', yAxisId: 'common' },
                                        { id: 'total_body_water_percent', label: 'Eau Corporelle', color: '#06b6d4', unit: '%', yAxisId: 'common' },
                                        { id: 'bone_mass', label: 'Masse Osseuse', color: '#ec4899', unit: 'kg', yAxisId: 'common' },
                                        { id: 'visceral_fat_level', label: 'Graisse Viscérale', color: '#a855f7', unit: '', yAxisId: 'common' },
                                        { id: 'metabolic_age', label: 'Âge Métabolique', color: '#f97316', unit: 'ans', yAxisId: 'common' },

                                        // BMR has its own axis because the values are much larger (1000+)
                                        { id: 'bmr', label: 'Métabolisme de Base', color: '#22c55e', unit: 'kcal', yAxisId: 'bmr', domain: [0, 'auto'] as [number, 'auto'] },
                                    ]
                                        // @ts-ignore
                                        .filter(m => selectedMetrics.includes(m.id as keyof ScanData))
                                }
                            />
                        </div>
                    </>
                )}

                {activeTab === 'muscle' && scanData && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#1e293b]/50">
                            <h3 className="text-lg font-bold text-white mb-6">Masse Musculaire Squelettique</h3>
                            <BiometricBar
                                label="Masse Musculaire"
                                value={scanData.skeletal_muscle_mass || 0}
                                unit="kg"
                                min={20}
                                max={60}
                                lowThreshold={28}
                                highThreshold={42}
                            />
                        </div>

                        <div className="glass-card p-0 rounded-3xl border border-white/10 overflow-hidden relative min-h-[500px] flex items-center justify-center bg-gradient-to-b from-[#1a2c4e] to-[#0f172a]">
                            <div className="absolute top-6 left-6 z-10">
                                <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider">Total Muscle</span>
                                <span className="text-3xl font-bold text-white">{scanData.skeletal_muscle_mass || '--'} <span className="text-sm text-gray-500">kg</span></span>
                            </div>

                            <BodyMap>
                                {scanData.segmental_muscle_right_arm && <BodySegmentLabel x={15} y={30} label="Bras Droit" value={`${scanData.segmental_muscle_right_arm} kg`} align="left" />}
                                {scanData.segmental_muscle_left_arm && <BodySegmentLabel x={85} y={30} label="Bras Gauche" value={`${scanData.segmental_muscle_left_arm} kg`} align="right" />}
                                {scanData.segmental_muscle_trunk && <BodySegmentLabel x={50} y={45} label="Buste" value={`${scanData.segmental_muscle_trunk} kg`} align="right" />}
                                {scanData.segmental_muscle_right_leg && <BodySegmentLabel x={15} y={75} label="Jambe Droite" value={`${scanData.segmental_muscle_right_leg} kg`} align="left" />}
                                {scanData.segmental_muscle_left_leg && <BodySegmentLabel x={85} y={75} label="Jambe Gauche" value={`${scanData.segmental_muscle_left_leg} kg`} align="right" />}
                            </BodyMap>
                        </div>
                    </div>
                )}

                {activeTab === 'fat' && scanData && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#1e293b]/50">
                            <h3 className="text-lg font-bold text-white mb-6">Masse Grasse Corporelle</h3>
                            <BiometricBar
                                label="Masse Grasse"
                                value={scanData.body_fat_mass || 0}
                                unit="kg"
                                min={5}
                                max={50}
                                lowThreshold={10}
                                highThreshold={20}
                            />
                            <div className="mt-8">
                                <BiometricBar
                                    label="Pourcentage de Graisse"
                                    value={scanData.body_fat_percent || 0}
                                    unit="%"
                                    min={5}
                                    max={50}
                                    lowThreshold={15}
                                    highThreshold={25}
                                />
                            </div>
                        </div>

                        <div className="glass-card p-0 rounded-3xl border border-white/10 overflow-hidden relative min-h-[500px] flex items-center justify-center bg-gradient-to-b from-[#1a2c4e] to-[#0f172a]">
                            <div className="absolute top-6 left-6 z-10">
                                <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider">Graisse Segmentaire</span>
                                <span className="text-3xl font-bold text-white">{scanData.body_fat_mass || '--'} <span className="text-sm text-gray-500">kg</span></span>
                            </div>

                            <BodyMap>
                                {scanData.segmental_fat_right_arm && <BodySegmentLabel x={15} y={30} label="Bras Droit" value={`${scanData.segmental_fat_right_arm} kg`} align="left" />}
                                {scanData.segmental_fat_left_arm && <BodySegmentLabel x={85} y={30} label="Bras Gauche" value={`${scanData.segmental_fat_left_arm} kg`} align="right" />}
                                {scanData.segmental_fat_trunk && <BodySegmentLabel x={50} y={45} label="Buste" value={`${scanData.segmental_fat_trunk} kg`} align="right" />}
                                {scanData.segmental_fat_right_leg && <BodySegmentLabel x={15} y={75} label="Jambe Droite" value={`${scanData.segmental_fat_right_leg} kg`} align="left" />}
                                {scanData.segmental_fat_left_leg && <BodySegmentLabel x={85} y={75} label="Jambe Gauche" value={`${scanData.segmental_fat_left_leg} kg`} align="right" />}
                            </BodyMap>
                        </div>
                    </div>
                )}

                {activeTab === 'water' && scanData && (
                    <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#1e293b]/50">
                        <h3 className="text-lg font-bold text-white mb-6">Eau Corporelle</h3>
                        <BiometricBar
                            label="Eau Corporelle Totale"
                            value={scanData.total_body_water || 0}
                            unit="L"
                            min={20}
                            max={60}
                            lowThreshold={35}
                            highThreshold={50}
                        />
                        <div className="mt-8 text-center p-8 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Droplets className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h4 className="text-2xl font-bold text-white mb-2">{scanData.total_body_water_percent || '--'} %</h4>
                            <p className="text-gray-400 text-sm">Votre taux d'hydratation.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'bone' && scanData && (
                    <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#1e293b]/50">
                        <h3 className="text-lg font-bold text-white mb-6">Masse Osseuse</h3>
                        <BiometricBar
                            label="Contenu Minéral Osseux"
                            value={scanData.bone_mass || 0}
                            unit="kg"
                            min={1}
                            max={6}
                            lowThreshold={2.5}
                            highThreshold={4.0}
                        />
                        <div className="mt-8 text-center p-8 bg-gray-500/10 rounded-2xl border border-gray-500/20">
                            <Bone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-sm">Une densité osseuse saine est importante pour votre santé globale.</p>
                        </div>
                    </div>
                )}

            </div>

            {activeTab === 'photos' && (
                <div className="animate-fade-in">
                    <PhotoEvolution />
                </div>
            )}
        </div>
    );
}
