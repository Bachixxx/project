import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ImageBackground,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
    Search,
    LayoutGrid,
    Play,
    CheckCircle,
    Trophy,
    Dumbbell,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWorkouts, Program } from '../hooks/useWorkouts';

const { width: SCREEN_W } = Dimensions.get('window');

const T = {
    bg: '#020617',
    card: 'rgba(15,23,42,0.60)',
    cardBorder: 'rgba(255,255,255,0.05)',
    emerald: '#34d399',
    emeraldDark: '#059669',
    teal: '#2dd4bf',
    muted: '#94a3b8',
    textSecondary: '#cbd5e1',
};

export default function WorkoutsScreen() {
    const { workouts: programs, isLoading, stats } = useWorkouts();
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const nav = useNavigation<any>();

    const filteredPrograms = (programs || []).filter(p => {
        if (!p || !p.program) return false;
        const matchesFilter = activeTab === 'all' || p.status === activeTab;
        const matchesSearch = p.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.program.coach?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={T.emerald} size="large" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: T.bg }}>
            <StatusBar style="light" />

            {/* ── Ambient Background Glows ── */}
            <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <LinearGradient
                    colors={['rgba(16,185,129,0.1)', 'transparent']}
                    style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200 }}
                />
                <LinearGradient
                    colors={['rgba(45,212,191,0.08)', 'transparent']}
                    style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, borderRadius: 250 }}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                stickyHeaderIndices={[1]}
            >
                {/* ╔═══════════════ HERO ═══════════════╗ */}
                <View style={{ height: 280, justifyContent: 'flex-end' }}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop' }}
                        style={{ position: 'absolute', inset: 0 }}
                        imageStyle={{ opacity: 0.4 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(2,6,23,0.6)', T.bg]}
                        locations={[0, 0.4, 1]}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    <View style={{ paddingHorizontal: 24, paddingBottom: 15, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: T.muted, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
                            Coachency App
                        </Text>
                        <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, textAlign: 'center' }}>
                            MES PROGRAMMES
                        </Text>
                        <Text style={{ fontSize: 14, color: T.textSecondary, marginTop: 8, opacity: 0.8 }}>
                            Continuez sur votre lancée.
                        </Text>
                    </View>
                </View>

                {/* ╔═══════════════ CONTENT (STICKY TABS) ═══════════════╗ */}
                <View style={{ backgroundColor: T.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30, paddingTop: 32, paddingHorizontal: 20 }}>

                    {/* iOS-style Segmented Control */}
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: 'rgba(15,23,42,0.8)',
                        padding: 4,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.05)',
                        marginBottom: 20
                    }}>
                        {[
                            { id: 'all', label: 'Tous', icon: LayoutGrid },
                            { id: 'active', label: 'En cours', icon: Play },
                            { id: 'completed', label: 'Terminés', icon: CheckCircle }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id as any)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    gap: 8,
                                    backgroundColor: activeTab === tab.id ? 'rgba(30,41,59,1)' : 'transparent',
                                    borderWidth: activeTab === tab.id ? 1 : 0,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <tab.icon size={16} color={activeTab === tab.id ? T.emerald : T.muted} />
                                <Text style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: activeTab === tab.id ? '#fff' : T.muted
                                }}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Search Bar */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: T.card,
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: T.cardBorder,
                        marginBottom: 24
                    }}>
                        <Search size={20} color={T.muted} style={{ marginRight: 12 }} />
                        <TextInput
                            placeholder="Rechercher un programme..."
                            placeholderTextColor={T.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={{ flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' }}
                        />
                    </View>

                    {/* Stats Grid */}
                    {activeTab === 'all' && (
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: 'rgba(15,23,42,0.4)',
                                borderRadius: 20,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: T.cardBorder,
                                height: 110,
                                justifyContent: 'space-between'
                            }}>
                                <Trophy size={40} color={T.emerald} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.15 }} />
                                <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>Terminés</Text>
                                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{stats.completedCount}</Text>
                            </View>
                            <View style={{
                                flex: 1,
                                backgroundColor: 'rgba(15,23,42,0.4)',
                                borderRadius: 20,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: T.cardBorder,
                                height: 110,
                                justifyContent: 'space-between'
                            }}>
                                <Dumbbell size={40} color={T.teal} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.15 }} />
                                <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Séances</Text>
                                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{stats.totalWorkouts}</Text>
                            </View>
                        </View>
                    )}

                    {/* Programs List */}
                    <View style={{ gap: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 2, paddingLeft: 4 }}>
                            {activeTab === 'all' ? 'Tous les programmes' : activeTab === 'active' ? 'Programmes en cours' : 'Historique'}
                        </Text>

                        {filteredPrograms.length > 0 ? (
                            filteredPrograms.map((cp) => (
                                <TouchableOpacity
                                    key={cp.id}
                                    onPress={() => nav.navigate('WorkoutDetail', { clientProgramId: cp.id })}
                                    activeOpacity={0.8}
                                    style={{
                                        backgroundColor: T.card,
                                        borderRadius: 24,
                                        padding: 16,
                                        borderWidth: 1,
                                        borderColor: T.cardBorder,
                                        flexDirection: 'row',
                                        gap: 16,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 10 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 20,
                                    }}
                                >
                                    {/* Left: Thumbnail Widget */}
                                    <View style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 16,
                                        backgroundColor: '#1e293b',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden'
                                    }}>
                                        <LinearGradient
                                            colors={['rgba(52,211,153,0.15)', 'transparent']}
                                            style={{ position: 'absolute', inset: 0 }}
                                        />
                                        <Dumbbell size={28} color={T.emerald} opacity={0.6} />
                                        {cp.status === 'active' && (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: 6,
                                                right: 6,
                                                width: 10,
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: T.emerald,
                                                borderWidth: 2,
                                                borderColor: '#1e293b',
                                                shadowColor: T.emerald,
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.8,
                                                shadowRadius: 4,
                                            }} />
                                        )}
                                    </View>

                                    {/* Right: Info */}
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 4 }} numberOfLines={1}>
                                            {cp.program.name}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: T.muted, marginBottom: 12 }} numberOfLines={1}>
                                            {cp.program.description}
                                        </Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                                    <Text style={{ fontSize: 9, fontWeight: '800', color: T.muted }}>{cp.program.duration_weeks} SEM</Text>
                                                </View>
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: T.muted, alignSelf: 'center' }}>• {cp.program.coach.full_name}</Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '800', color: T.emerald }}>{cp.progress}%</Text>
                                                <View style={{ width: 40, height: 6, backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <LinearGradient
                                                        colors={[T.emeraldDark, T.emerald]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={{ height: '100%', width: `${cp.progress}%` }}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Search size={32} color="rgba(255,255,255,0.1)" />
                                </View>
                                <Text style={{ color: T.muted, fontSize: 15, fontWeight: '500' }}>Aucun programme trouvé</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
