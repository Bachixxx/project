import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, LogOut, ChevronRight, Bell, Shield, HelpCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true);
                        try {
                            await supabase.auth.signOut();
                        } catch (err: any) {
                            Alert.alert('Erreur', err.message || 'Impossible de se déconnecter');
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: Bell, label: 'Notifications', color: '#fbbf24' },
        { icon: Shield, label: 'Confidentialité', color: '#60a5fa' },
        { icon: HelpCircle, label: 'Aide & Support', color: '#a78bfa' },
    ];

    return (
        <View className="flex-1 bg-[#020617]">
            <StatusBar style="light" />
            <View className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full opacity-30"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
            />
            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="px-6 pt-4 pb-6">
                        <Text className="text-white text-2xl font-bold tracking-tight">Profil</Text>
                    </View>

                    {/* Profile Card */}
                    <View className="px-4 mb-6">
                        <View className="rounded-[28px] p-6 items-center"
                            style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <View className="w-20 h-20 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            >
                                <User color="#34d399" size={36} />
                            </View>
                            <Text className="text-white text-xl font-bold">Mon Profil</Text>
                            <View className="flex-row items-center gap-1.5 mt-1">
                                <Mail color="#64748b" size={14} />
                                <Text className="text-slate-400 text-sm">client@coachency.com</Text>
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="px-4 gap-2">
                        {menuItems.map((item, i) => (
                            <TouchableOpacity key={i} activeOpacity={0.85}>
                                <View className="rounded-2xl p-4 flex-row items-center"
                                    style={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.05)',
                                    }}
                                >
                                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                        style={{ backgroundColor: `${item.color}15` }}
                                    >
                                        <item.icon color={item.color} size={20} />
                                    </View>
                                    <Text className="text-white font-medium flex-1">{item.label}</Text>
                                    <ChevronRight color="#475569" size={18} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <View className="px-4 mt-8">
                        <TouchableOpacity onPress={handleLogout} disabled={loggingOut} activeOpacity={0.85}>
                            <View className="rounded-2xl p-4 flex-row items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    opacity: loggingOut ? 0.5 : 1,
                                }}
                            >
                                <LogOut color="#f87171" size={20} />
                                <Text className="text-red-400 font-bold">
                                    {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-center text-slate-600 text-xs mt-6 font-light">
                        Coachency · v2.0
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
