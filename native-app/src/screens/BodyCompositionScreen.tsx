import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Activity, Scale, Camera, TrendingDown, TrendingUp } from 'lucide-react-native';

export default function BodyCompositionScreen() {
    const metrics = [
        { label: 'Poids actuel', value: '78.5 kg', trend: '-1.2', isDown: true },
        { label: 'Tour de taille', value: '82 cm', trend: '-2', isDown: true },
        { label: 'Tour de bras', value: '36 cm', trend: '+1.5', isDown: false },
        { label: 'Tour de cuisse', value: '58 cm', trend: '+0.5', isDown: false },
    ];

    return (
        <View className="flex-1 bg-[#020617]">
            <StatusBar style="light" />
            <View className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full opacity-30"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}
            />
            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-6 pt-4 pb-6">
                        <Text className="text-white text-2xl font-bold tracking-tight">Biométrie</Text>
                        <Text className="text-slate-400 text-sm font-light mt-1">Suivi corporel et mesures</Text>
                    </View>

                    {/* Quick Actions */}
                    <View className="flex-row px-4 gap-3 mb-6">
                        <TouchableOpacity className="flex-1" activeOpacity={0.85}>
                            <View className="rounded-2xl p-4 items-center"
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)' }}
                            >
                                <Scale color="#34d399" size={22} />
                                <Text className="text-emerald-400 text-xs font-bold mt-2">Ajouter poids</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1" activeOpacity={0.85}>
                            <View className="rounded-2xl p-4 items-center"
                                style={{ backgroundColor: 'rgba(244, 63, 94, 0.12)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.25)' }}
                            >
                                <Camera color="#fb7185" size={22} />
                                <Text className="text-rose-400 text-xs font-bold mt-2">Prendre photo</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Metrics Cards */}
                    <View className="px-4 gap-3">
                        {metrics.map((metric, i) => (
                            <View key={i} className="rounded-[24px] p-5 flex-row items-center"
                                style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.08)',
                                }}
                            >
                                <View className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}
                                >
                                    <Activity color="#a78bfa" size={20} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">{metric.label}</Text>
                                    <Text className="text-white text-xl font-extrabold mt-1">{metric.value}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    {metric.isDown ? (
                                        <TrendingDown color="#34d399" size={16} />
                                    ) : (
                                        <TrendingUp color="#60a5fa" size={16} />
                                    )}
                                    <Text className={metric.isDown ? 'text-emerald-400 text-sm font-bold' : 'text-blue-400 text-sm font-bold'}>
                                        {metric.trend}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Photo Evolution Placeholder */}
                    <View className="px-4 mt-6">
                        <View className="rounded-[24px] p-6"
                            style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Text className="text-white text-lg font-bold mb-2">Évolution Photos</Text>
                            <Text className="text-slate-500 text-sm">Prenez des photos pour suivre votre transformation</Text>
                            <View className="h-32 items-center justify-center mt-4">
                                <Camera color="#64748b" size={48} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
