import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    ChevronLeft,
    Calendar,
    Dumbbell,
    Clock,
    Award,
    CheckCircle,
    Play,
    RotateCcw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';

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

export default function WorkoutDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user, client } = useAuth();
    const { clientProgramId } = route.params;
    const { program, sessionsStatus, isLoading } = useWorkoutDetail(clientProgramId);
    const [startingSessionId, setStartingSessionId] = useState<string | null>(null);

    const handleStartSession = async (session: any) => {
        if (!client || !program) return;
        setStartingSessionId(session.id);

        try {
            const today = new Date().toISOString().split('T')[0];
            const prog = program.program;

            if (program.scheduling_type === 'coach_led') {
                const { data: existingSession } = await supabase
                    .from('scheduled_sessions')
                    .select('id')
                    .eq('client_id', client.id)
                    .eq('session_id', session.id)
                    .eq('status', 'scheduled')
                    .order('scheduled_date', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (existingSession) {
                    navigation.navigate('LiveWorkout', { scheduledSessionId: existingSession.id });
                    return;
                } else {
                    throw new Error("Cette séance n'a pas été planifiée par votre coach.");
                }
            } else {
                // Self-paced
                const { data: existingSession } = await supabase
                    .from('scheduled_sessions')
                    .select('id')
                    .eq('client_id', client.id)
                    .eq('session_id', session.id)
                    .gte('scheduled_date', today)
                    .neq('status', 'completed')
                    .maybeSingle();

                if (existingSession) {
                    navigation.navigate('LiveWorkout', { scheduledSessionId: existingSession.id });
                    return;
                }

                const { data: newSession, error: createError } = await supabase
                    .from('scheduled_sessions')
                    .insert([{
                        client_id: client.id,
                        coach_id: prog.coach_id,
                        session_id: session.id,
                        scheduled_date: new Date().toISOString(),
                        status: 'scheduled',
                        notes: `Séance du programme: ${prog.name}`
                    }])
                    .select()
                    .single();

                if (createError) throw createError;

                navigation.navigate('LiveWorkout', { scheduledSessionId: newSession.id });
            }
        } catch (error: any) {
            console.error('Error starting session:', error);
            Alert.alert('Erreur', error.message || 'Erreur lors du lancement de la séance');
            setStartingSessionId(null);
        }
    };

    if (isLoading || !program) {
        return (
            <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={T.emerald} size="large" />
            </View>
        );
    }

    const sortedSessions = [...program.program.program_sessions].sort((a, b) => a.order_index - b.order_index);

    return (
        <View style={{ flex: 1, backgroundColor: T.bg }}>
            {/* ── Ambient Background Glows ── */}
            <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <LinearGradient
                    colors={['rgba(16,185,129,0.08)', 'transparent']}
                    style={{ position: 'absolute', top: '30%', left: -100, width: 400, height: 400, borderRadius: 200 }}
                />
                <LinearGradient
                    colors={['rgba(45,212,191,0.06)', 'transparent']}
                    style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, borderRadius: 250 }}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* ╔═══════════════ HERO ═══════════════╗ */}
                <View style={{ height: 300, justifyContent: 'flex-end' }}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop' }}
                        style={{ position: 'absolute', inset: 0 }}
                        imageStyle={{ opacity: 0.4 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(2,6,23,0.8)', T.bg]}
                        locations={[0, 0.4, 1]}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            position: 'absolute',
                            top: 46,
                            left: 20,
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(15,23,42,0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)'
                        }}
                    >
                        <ChevronLeft color="#fff" size={24} style={{ marginRight: 2 }} />
                    </TouchableOpacity>

                    <View style={{ paddingHorizontal: 24, paddingBottom: 12, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>Programme</Text>
                            </View>
                            {program.program.difficulty_level && (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'capitalize' }}>{program.program.difficulty_level}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 4 }}>
                            {program.program.name}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: T.emerald, letterSpacing: 2 }}>
                            PAR {program.program.coach.full_name.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* ╔═══════════════ CONTENT ═══════════════╗ */}
                <View style={{ backgroundColor: T.bg, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -32, paddingTop: 32, paddingHorizontal: 20 }}>

                    {/* Stats Row */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                        <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.cardBorder }}>
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(52,211,153,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' }}>
                                <Calendar color={T.emerald} size={20} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: T.muted, textTransform: 'uppercase' }}>Durée</Text>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{program.program.duration_weeks} sem</Text>
                            </View>
                        </View>
                        <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.cardBorder }}>
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(45,212,191,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(45,212,191,0.2)' }}>
                                <Dumbbell color={T.teal} size={20} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: T.muted, textTransform: 'uppercase' }}>Séances</Text>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{sortedSessions.length} total</Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    {program.program.description && (
                        <View style={{ backgroundColor: 'rgba(15,23,42,0.3)', borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: T.cardBorder }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>À PROPOS</Text>
                            <Text style={{ fontSize: 14, color: T.textSecondary, lineHeight: 20 }}>{program.program.description}</Text>
                        </View>
                    )}

                    {/* Sessions List */}
                    <View style={{ marginBottom: 40 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingLeft: 4 }}>
                            <Award color="#fbbf24" size={20} />
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>Votre Parcours</Text>
                        </View>

                        <View style={{ paddingLeft: 8 }}>
                            {sortedSessions.map((ps, index) => {
                                const session = ps.session;
                                const status = sessionsStatus[session.id];
                                const isCompleted = status?.status === 'completed';
                                const isScheduled = status?.status === 'scheduled';
                                const isStarting = startingSessionId === session.id;

                                return (
                                    <View key={session.id} style={{ marginBottom: 24 }}>
                                        {/* Connection Line */}
                                        {index < sortedSessions.length - 1 && (
                                            <View style={{
                                                position: 'absolute',
                                                left: 20,
                                                top: 52,
                                                bottom: -32,
                                                width: 2,
                                                backgroundColor: isCompleted ? T.emerald : '#1e293b',
                                                opacity: isCompleted ? 0.4 : 1,
                                                zIndex: 0
                                            }} />
                                        )}

                                        <View style={{
                                            flexDirection: 'row',
                                            gap: 16,
                                            backgroundColor: isCompleted ? 'rgba(16,185,129,0.03)' : 'rgba(15,23,42,0.4)',
                                            borderRadius: 24,
                                            padding: 16,
                                            borderWidth: 1,
                                            borderColor: isCompleted ? 'rgba(16,185,129,0.2)' : T.cardBorder,
                                            zIndex: 1
                                        }}>
                                            {/* Left: Icon/Number */}
                                            <View style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 14,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                                borderWidth: 1,
                                                borderColor: isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'
                                            }}>
                                                {isCompleted ? <CheckCircle color={T.emerald} size={20} /> : <Text style={{ color: T.muted, fontSize: 16, fontWeight: '800' }}>{index + 1}</Text>}
                                            </View>

                                            {/* Right: Info */}
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                    <Text style={{ fontSize: 17, fontWeight: '800', color: isCompleted ? T.muted : '#fff', flex: 1 }} numberOfLines={1}>
                                                        {session.name}
                                                    </Text>
                                                    {isCompleted && (
                                                        <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '800', color: T.emerald }}>FAIT</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <Text style={{ fontSize: 13, color: T.muted, marginBottom: 12 }} numberOfLines={1}>
                                                    {session.description || 'Séance complète'}
                                                </Text>

                                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                                        <Clock size={12} color={T.muted} />
                                                        <Text style={{ fontSize: 11, fontWeight: '600', color: T.muted }}>{session.duration_minutes} min</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                                        <Dumbbell size={12} color={T.muted} />
                                                        <Text style={{ fontSize: 11, fontWeight: '600', color: T.muted }}>{session.session_exercises[0]?.count || 0} exos</Text>
                                                    </View>
                                                </View>

                                                {/* Action Button */}
                                                <TouchableOpacity
                                                    onPress={() => handleStartSession(session)}
                                                    disabled={isStarting}
                                                    activeOpacity={0.8}
                                                    style={{
                                                        height: 44,
                                                        borderRadius: 12,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                        gap: 8,
                                                        backgroundColor: isCompleted ? 'rgba(255,255,255,0.05)' : T.emerald,
                                                        borderWidth: isCompleted ? 1 : 0,
                                                        borderColor: 'rgba(255,255,255,0.1)'
                                                    }}
                                                >
                                                    {isStarting ? (
                                                        <ActivityIndicator color={isCompleted ? T.muted : '#fff'} size="small" />
                                                    ) : isCompleted ? (
                                                        <>
                                                            <RotateCcw size={16} color={T.muted} />
                                                            <Text style={{ fontSize: 14, fontWeight: '700', color: T.muted }}>Refaire</Text>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={16} color="#fff" fill="#fff" />
                                                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                                                                {isScheduled ? 'Reprendre' : 'Commencer'}
                                                            </Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
