import React, { useState, useEffect } from 'react';
import { ChevronLeft, Scale, Droplets, Activity, Bone, Info, Share2, Download, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { BiometricRingChart } from '../../components/client/biometrics/BiometricRingChart';
import { BodyMap, BodySegmentLabel } from '../../components/client/biometrics/BodyMap';
import { BiometricBar } from '../../components/client/biometrics/BiometricBar';

// Mock Data Types
interface ScanData {
    id: string;
    date: string;
    weight: number;
    height: number;
    body_fat_percent: number;
    skeletal_muscle_mass: number;
    total_body_water_percent: number;
    bone_mass: number;
    visceral_fat_level: number;
    bmr: number;
    segmental_muscle: {
        leftArm: number;
        rightArm: number;
        trunk: number;
        leftLeg: number;
        rightLeg: number;
    };
}

// Temporary Mock Data
const MOCK_SCAN: ScanData = {
    id: '1',
    date: new Date().toISOString(),
    weight: 84.7,
    height: 177,
    body_fat_percent: 18.6,
    skeletal_muscle_mass: 39.2,
    total_body_water_percent: 59.5,
    bone_mass: 4.7,
    visceral_fat_level: 6,
    bmr: 1850,
    segmental_muscle: {
        leftArm: 3.8,
        rightArm: 3.9,
        trunk: 28.5,
        leftLeg: 10.2,
        rightLeg: 10.1
    }
};

function ClientBodyComposition() {
    const navigate = useNavigate();
    const { client } = useClientAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'fat' | 'muscle' | 'water' | 'bone'>('general');
    const [scanData, setScanData] = useState<ScanData | null>(MOCK_SCAN);
    const [loading, setLoading] = useState(false);

    // In a real implementation, fetch data from Supabase
    /*
    useEffect(() => {
      const fetchLatestScan = async () => {
          if (!client?.id) return;
          const { data } = await supabase.from('body_scans').select('*').eq('client_id', client.id).order('date', { ascending: false }).limit(1).single();
          if (data) setScanData(data);
      }
      fetchLatestScan();
    }, [client]);
    */

    const tabs = [
        { id: 'general', label: 'Général' },
        { id: 'fat', label: 'Graisse' },
        { id: 'muscle', label: 'Muscle' }, // "Sans gras" usually refers to Lean Body Mass which is correlated with muscle
        { id: 'water', label: 'Eau' },
        { id: 'bone', label: 'Os' }
    ];

    if (!scanData) return <div className="p-8 text-center text-gray-500">Aucune donnée disponible</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 pb-24 md:p-8">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold">Analyse Corporelle</h1>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <History className="w-6 h-6" />
                    </button>
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

                    {activeTab === 'general' && (
                        <>
                            {/* Main Ring Chart */}
                            <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                                <BiometricRingChart
                                    percentage={scanData.total_body_water_percent} // Using water % for the ring as per image 1 style
                                    label="IMC"
                                    subLabel="BODY WATER"
                                    value={`${scanData.weight} kg`}
                                    color="#3b82f6"
                                    size={240}
                                />

                                {/* Floating Stats Cards around the ring (Absolute positioning or Grid) */}
                                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <h3 className="text-xs font-bold text-yellow-500 uppercase mb-1">Graisse</h3>
                                        <p className="text-2xl font-bold text-white">{scanData.body_fat_percent} %</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <h3 className="text-xs font-bold text-red-500 uppercase mb-1">Muscle</h3>
                                        <p className="text-2xl font-bold text-white">{scanData.skeletal_muscle_mass} kg</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <h3 className="text-xs font-bold text-pink-500 uppercase mb-1">Os</h3>
                                        <p className="text-2xl font-bold text-white">{scanData.bone_mass} kg</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <h3 className="text-xs font-bold text-orange-500 uppercase mb-1">Eau</h3>
                                        <p className="text-2xl font-bold text-white">{scanData.total_body_water_percent} %</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body Map Preview */}
                            <div className="glass-card p-6 rounded-3xl border border-white/10 relative">
                                <h3 className="text-lg font-bold text-white mb-4">Analyse Segmentaire</h3>
                                <BodyMap>
                                    {/* Placeholder dots */}
                                    <div className="absolute top-[30%] left-[50%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                                </BodyMap>
                                <div className="text-center mt-4 text-gray-400 text-sm">
                                    Cliquez sur l'onglet Muscle pour plus de détails.
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'muscle' && (
                        <div className="space-y-6">
                            <div className="glass-card p-6 rounded-3xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-6">Masse Musculaire Squelettique</h3>
                                <BiometricBar
                                    label="Masse Musculaire"
                                    value={scanData.skeletal_muscle_mass}
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
                                    <span className="text-3xl font-bold text-white">{scanData.skeletal_muscle_mass} <span className="text-sm text-gray-500">kg</span></span>
                                </div>

                                <BodyMap>
                                    <BodySegmentLabel
                                        x={20} y={35}
                                        label="Bras Drout"
                                        value={`${scanData.segmental_muscle.rightArm} kg`}
                                        align="right"
                                    />
                                    <BodySegmentLabel
                                        x={80} y={35}
                                        label="Bras Gauche"
                                        value={`${scanData.segmental_muscle.leftArm} kg`}
                                        align="left"
                                    />
                                    <BodySegmentLabel
                                        x={85} y={20}
                                        label="Buste"
                                        value={`${scanData.segmental_muscle.trunk} kg`}
                                        align="left"
                                    />
                                    <BodySegmentLabel
                                        x={20} y={75}
                                        label="Jambe Droite"
                                        value={`${scanData.segmental_muscle.rightLeg} kg`}
                                        align="right"
                                    />
                                    <BodySegmentLabel
                                        x={80} y={75}
                                        label="Jambe Gauche"
                                        value={`${scanData.segmental_muscle.leftLeg} kg`}
                                        align="left"
                                    />
                                </BodyMap>
                            </div>
                        </div>
                    )}

                    {/* Other tabs placeholders */}
                    {['fat', 'water', 'bone'].includes(activeTab) && (
                        <div className="glass-card p-12 text-center rounded-3xl border border-white/10">
                            <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">En développement</h3>
                            <p className="text-gray-400">Cette section sera bientôt disponible.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default ClientBodyComposition;
