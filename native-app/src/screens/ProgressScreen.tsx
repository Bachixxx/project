import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, FlatList, TextInput, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, Target, Flame, Trophy, BarChart3, Search, ChevronRight, X, Activity, Dumbbell } from 'lucide-react-native';
import { useProgress } from '../hooks/useProgress';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

// --- Sub-components ---

function LevelCard({ data }: any) {
    return (
        <View className="bg-slate-900/70 rounded-[48px] p-8 border border-white/10 shadow-2xl overflow-hidden">
            <View className="flex-row items-center mb-10">
                <View className="relative">
                    <View className="w-24 h-24 rounded-full bg-slate-950 items-center justify-center border border-white/10 shadow-xl">
                        <Trophy color="#fbbf24" size={32} />
                        <Text className="text-white text-3xl font-black mt-1">{(data?.stats.level || 1)}</Text>
                    </View>
                    <View className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10" />
                </View>
                <View className="flex-1 ml-8">
                    <Text className="text-white text-2xl font-black mb-1">Niveau Actuel</Text>
                    <Text className="text-slate-400 text-sm font-medium mb-4">Continue sur cette lancée !</Text>
                    <View className="bg-slate-950/50 h-3 rounded-full overflow-hidden border border-white/5">
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, (data?.stats.xp || 0) % 1000 / 10)}%` }}
                        />
                    </View>
                    <View className="flex-row justify-between mt-2 px-1">
                        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">XP</Text>
                        <Text className="text-[10px] font-black text-blue-400">{(data?.stats.xp || 0)} / {(data?.stats.level || 1) * 1000}</Text>
                    </View>
                </View>
            </View>
            <View className="bg-slate-950/40 rounded-[32px] p-6 border border-white/5">
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-5">ASSIDUITÉ</Text>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Flame color="#f97316" size={40} fill={(data?.stats.streakDays || 0) > 0 ? "#f97316" : "transparent"} />
                        <Text className="text-white text-4xl font-black ml-4">{(data?.stats.streakDays || 0)}</Text>
                    </View>
                    <View className="bg-orange-950/30 px-5 py-2.5 rounded-full border border-orange-500/20">
                        <Text className="text-orange-500 text-[10px] font-black uppercase tracking-widest">JOURS D'AFFILÉE</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

function WeightEvolutionCard({ data, startWeight, currentWeight, weightTrend }: any) {
    return (
        <View className="bg-slate-900/70 rounded-[48px] p-8 border border-white/10 shadow-2xl">
            <View className="flex-row justify-between items-start mb-8">
                <View>
                    <View className="flex-row items-center mb-1.5">
                        <TrendingUp color="#10b981" size={22} className="mr-2" />
                        <Text className="text-white text-2xl font-black">Évolution Poids</Text>
                    </View>
                    <Text className="text-slate-400 text-sm font-medium">Comparaison dernier relevé</Text>
                </View>
                <View className="bg-blue-500/10 px-5 py-2 rounded-full border border-blue-500/20">
                    <Text className="text-blue-400 text-sm font-black">{weightTrend}</Text>
                </View>
            </View>
            <View className="bg-slate-950/40 rounded-[32px] p-8 border border-white/5 mt-4">
                <View className="flex-row justify-between items-center px-4">
                    <View className="items-center">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-3">DÉPART</Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black tracking-tight">{startWeight}</Text>
                            <Text className="text-slate-500 text-sm font-bold ml-1.5">kg</Text>
                        </View>
                    </View>
                    <View className="flex-1 px-10 items-center">
                        <View className="w-full h-[1px] bg-slate-800 relative">
                            <View className="absolute top-[-4px] left-[65%] w-2.5 h-2.5 rounded-full bg-slate-600 shadow-lg shadow-black/50" />
                        </View>
                    </View>
                    <View className="items-center">
                        <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-[3px] mb-3">ACTUEL</Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-4xl font-black tracking-tight">{currentWeight}</Text>
                            <Text className="text-emerald-500 text-base font-bold ml-1.5">kg</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

function MonthlyActivityCard({ data }: any) {
    return (
        <View className="bg-slate-900/70 rounded-[48px] p-8 border border-white/10 shadow-2xl flex flex-col justify-between">
            <View className="flex justify-between flex-row items-start mb-10">
                <View>
                    <View className="flex-row items-center mb-1.5">
                        <Activity className="w-5 h-5 text-purple-400 mr-2" />
                        <Text className="text-white text-2xl font-black">Activité du mois</Text>
                    </View>
                    <Text className="text-slate-400 text-sm font-medium">Séances complétées en {format(new Date(), 'MMMM', { locale: fr })}</Text>
                </View>
                <View className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                    <Dumbbell className="w-6 h-6 text-purple-400/80" />
                </View>
            </View>
            <View className="flex flex-row items-end justify-between">
                <View className="flex-row items-end">
                    <Text className="text-6xl font-black text-white leading-none">{(data?.stats.sessionsThisMonth || 0)}</Text>
                    <Text className="text-lg text-purple-400 ml-3 font-bold mb-1">séances</Text>
                </View>
                <View className="text-right pb-1">
                    <Text className="block text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-2">Total à vie</Text>
                    <Text className="text-2xl font-black text-slate-300">{(data?.stats.totalSessionsAllTime || 0)}</Text>
                </View>
            </View>
        </View>
    );
}

function GoalsCard({ data }: any) {
    if (!data?.stats.fitnessGoals || data.stats.fitnessGoals.length === 0) return null;
    return (
        <View className="bg-slate-900/40 rounded-[48px] p-8 border border-white/5 mb-10">
            <View className="flex-row items-center mb-6">
                <Target className="w-6 h-6 text-blue-400 mr-3" />
                <Text className="text-white text-2xl font-black">Mes Objectifs</Text>
            </View>
            <View className="space-y-4">
                {data.stats.fitnessGoals.map((goal: string, index: number) => (
                    <View key={index} className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex-row items-center">
                        <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-4 shadow-lg shadow-blue-500/50" />
                        <Text className="text-slate-200 text-base font-semibold">{goal}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function PerformanceChartCard({ exercise, onOpenSelector, getChartData }: any) {
    const [metric, setMetric] = useState<any>(null);
    useEffect(() => {
        if (exercise && !metric) {
            if (exercise.track_weight) setMetric('weight');
            else if (exercise.track_reps) setMetric('reps');
            else if (exercise.track_duration) setMetric('duration');
            else if (exercise.track_distance) setMetric('distance');
            else setMetric('reps');
        }
    }, [exercise, metric]);

    const chartData = useMemo(() => {
        return exercise ? getChartData(exercise.id, metric) : null;
    }, [exercise, metric, getChartData]);

    const availableMetrics = [
        { id: 'weight', label: 'Poids', show: exercise?.track_weight },
        { id: 'reps', label: 'Reps', show: exercise?.track_reps },
        { id: 'volume', label: 'Volume', show: exercise?.track_weight && exercise?.track_reps },
        { id: 'duration', label: 'Temps', show: exercise?.track_duration },
        { id: 'distance', label: 'Distance', show: exercise?.track_distance },
    ].filter(m => m.show);

    return (
        <View className="bg-slate-900/70 rounded-[48px] p-8 border border-white/10 shadow-2xl min-h-[440px] relative overflow-hidden">
            <View className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <View className="flex-row justify-between items-center mb-8 relative z-10">
                <View>
                    <Text className="text-white text-2xl font-black">{exercise?.name || 'Sélectionnez'}</Text>
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mt-2">Performances max</Text>
                </View>
                <TouchableOpacity onPress={onOpenSelector} className="bg-blue-500/10 px-5 py-2.5 rounded-2xl border border-blue-500/20">
                    <Text className="text-blue-400 text-xs font-black uppercase tracking-widest">Changer</Text>
                </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2 mb-8 relative z-10">
                {availableMetrics.map((m: any) => (
                    <TouchableOpacity
                        key={m.id}
                        onPress={() => setMetric(m.id)}
                        className={`px-4 py-2 rounded-full border ${metric === m.id ? 'bg-blue-500/20 border-blue-500/40' : 'bg-slate-950/40 border-white/5'}`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${metric === m.id ? 'text-blue-400' : 'text-slate-500'}`}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {chartData ? (
                <View className="relative z-10">
                    <LineChart
                        data={chartData}
                        width={screenWidth - 96}
                        height={240}
                        chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: 'transparent',
                            backgroundGradientTo: 'transparent',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                            propsForDots: { r: '6', strokeWidth: '0', fill: '#3b82f6' },
                            propsForBackgroundLines: { stroke: 'rgba(255, 255, 255, 0.05)', strokeDasharray: '' }
                        }}
                        bezier
                        style={{ marginLeft: -16, marginTop: 10 }}
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                    />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center pt-24">
                    <Activity color="#334155" size={56} />
                    <Text className="text-slate-500 text-sm font-medium mt-6 text-center max-w-[200px]">Données insuffisantes pour cet exercice</Text>
                </View>
            )}
        </View>
    );
}

// --- Main Screen Component ---

export default function ProgressScreen({ navigation }: any) {
    useEffect(() => {
        console.log('--- RENDERING PROGRESS SCREEN (V5 - DIAGNOSTIC) ---');
        if (!navigation) {
            console.error('--- CRITICAL: navigation prop is missing in ProgressScreen! ---');
        } else {
            console.log('--- Navigation prop is present and valid ---');
        }
    }, [navigation]);

    const { data, isLoading } = useProgress();
    const [activeTab, setActiveTab] = useState<'summary' | 'performance'>('summary');

    useEffect(() => {
        console.log(`--- TAB SWITCHED TO: ${activeTab.toUpperCase()} ---`);
    }, [activeTab]);

    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredExercises = useMemo(() => {
        if (!data?.exercises) return [];
        return data.exercises.filter(ex =>
            ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data?.exercises, searchQuery]);

    useEffect(() => {
        if (data?.exercises?.length && !selectedExerciseId) {
            setSelectedExerciseId(data.exercises[0].id);
        }
    }, [data?.exercises, selectedExerciseId]);

    const getExerciseChartData = useCallback((exerciseId: string, metric: string) => {
        if (!data?.workoutLogs || !exerciseId) return null;
        const exercise = data.exercises.find(e => e.id === exerciseId);
        if (!exercise) return null;
        const filteredLogs = data.workoutLogs.filter(log => log.exercise_id === exerciseId);
        if (filteredLogs.length === 0) return null;
        const groups: Record<string, any[]> = {};
        filteredLogs.forEach(log => {
            const date = log.scheduled_session?.scheduled_date || log.completed_at.split('T')[0];
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
        });
        const sortedDates = Object.keys(groups).sort();
        const chartLabels = sortedDates.map(d => format(new Date(d), 'dd/MM', { locale: fr }));
        const chartValues = sortedDates.map(d => {
            const logs = groups[d];
            if (metric === 'weight') return Math.max(...logs.map(l => l.weight || 0));
            if (metric === 'volume') return logs.reduce((sum, l) => sum + ((l.weight || 0) * (l.reps || 0)), 0);
            if (metric === 'reps') return logs.reduce((sum, l) => sum + (l.reps || 0), 0);
            if (metric === 'duration') return logs.reduce((sum, l) => sum + (l.duration_seconds || 0), 0) / 60;
            if (metric === 'distance') return logs.reduce((sum, l) => sum + (l.distance_meters || 0), 0);
            return 0;
        });
        return {
            labels: chartLabels.slice(-6),
            datasets: [{ data: chartValues.slice(-6) }]
        };
    }, [data]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#020617] items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const weightHistory = [...(data?.weightHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : 0;
    const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0;
    const weightDiff = currentWeight - startWeight;
    const weightTrend = weightDiff >= 0 ? `+ ${weightDiff.toFixed(1)}kg` : `${weightDiff.toFixed(1)}kg`;

    return (
        <View className="flex-1 bg-[#020617]">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    <View className="items-center mt-12 px-6">
                        <Text className="text-white text-4xl font-black">PROGRÈS</Text>
                    </View>
                    <View className="px-6 mt-16 mb-10">
                        <View className="flex-row bg-slate-900/60 p-1.5 rounded-[24px] border border-white/5 backdrop-blur-xl">
                            <TouchableOpacity onPress={() => setActiveTab('summary')} className="flex-1 p-3 items-center">
                                <Text className="text-white">Synthèse</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('performance')} className="flex-1 p-3 items-center">
                                <Text className="text-white">Perfs</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {activeTab === 'summary' ? (
                        <View className="px-6 space-y-8">
                            <LevelCard data={data} />
                            <Text className="text-white">OTHER CARDS GO HERE</Text>
                        </View>
                    ) : (
                        <View className="px-6 space-y-8">
                            <Text className="text-white">PERFORMANCE CHART GOES HERE</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

