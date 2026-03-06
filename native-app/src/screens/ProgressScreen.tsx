import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, Target, Zap, Award } from 'lucide-react-native';

export default function ProgressScreen() {
    const progressCards = [
        { icon: Target, label: 'Objectif atteint', value: '78%', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
        { icon: Zap, label: 'Séances totales', value: '47', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
        { icon: Award, label: 'Meilleure série', value: '12j', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
        { icon: TrendingUp, label: 'Progression force', value: '+15%', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
    ];

    return (
        <View className="flex-1 bg-[#020617]">
            <StatusBar style="light" />
            <View className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full opacity-30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
            />
            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-6 pt-4 pb-6">
                        <Text className="text-white text-2xl font-bold tracking-tight">Progrès</Text>
                        <Text className="text-slate-400 text-sm font-light mt-1">Votre évolution au fil du temps</Text>
                    </View>

                    <View className="px-4 gap-3">
                        {progressCards.map((card, i) => (
                            <View key={i} className="rounded-[24px] p-5 flex-row items-center"
                                style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.08)',
                                }}
                            >
                                <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                                    style={{ backgroundColor: card.bg }}
                                >
                                    <card.icon color={card.color} size={24} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">{card.label}</Text>
                                    <Text className="text-white text-2xl font-extrabold mt-1">{card.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Monthly Progress Chart Placeholder */}
                    <View className="px-4 mt-6">
                        <View className="rounded-[24px] p-6"
                            style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Text className="text-white text-lg font-bold mb-2">Évolution mensuelle</Text>
                            <Text className="text-slate-500 text-sm">Graphique disponible prochainement</Text>
                            <View className="h-40 items-center justify-center mt-4">
                                <TrendingUp color="#34d399" size={48} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
