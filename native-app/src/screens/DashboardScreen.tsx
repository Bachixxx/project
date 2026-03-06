import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Image,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Flame,
    Scale,
    Calendar,
    Trophy,
    MessageSquare,
    Camera,
    FileText,
    User,
    Settings,
    Bell,
    Play,
    Sofa,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useClientDashboard } from '../hooks/useClientDashboard';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_HERO =
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop';

/* ──────────────────────────────────────────────────────────
   UI/UX Pro Max – Design tokens
   ────────────────────────────────────────────────────────── */
const T = {
    bg: '#020617',               // slate-950
    card: 'rgba(15,23,42,0.60)',  // slate-900/60
    cardBorder: 'rgba(255,255,255,0.05)',
    cardBorderHover: 'rgba(255,255,255,0.10)',
    emerald: '#34d399',
    emeraldDark: '#059669',
    teal: '#2dd4bf',
    cyan: '#22d3ee',
    blue: '#60a5fa',
    orange: '#f97316',
    rose: '#fb7185',
    amber: '#fbbf24',
    indigo: '#a78bfa',
    muted: '#94a3b8',             // slate-400
    mutedDark: '#64748b',         // slate-500
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',     // slate-300
    ring: 28,                     // circle progress radius
};

export default function DashboardScreen() {
    const { data, isLoading } = useClientDashboard();
    const nav = useNavigation<any>();

    /* ── Loading / Skeleton ── */
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={T.emerald} size="large" />
                <Text style={{ color: T.muted, marginTop: 16, fontSize: 14 }}>Chargement…</Text>
            </View>
        );
    }

    /* ── Data ── */
    const client = data?.client;
    const firstName = (client?.full_name || 'Client').split(' ')[0];
    const next = data?.nextSession;
    const program = data?.activeProgram;
    const weekly = data?.weeklyWorkouts ?? 0;
    const weeklyData = data?.weeklyWorkoutsData ?? [];
    const weight = data?.currentWeight;
    const stats = data?.stats ?? { totalWorkouts: 0, streakDays: 0, level: 1, xp: 0 };
    const brand = data?.branding;

    const heroImg = brand?.dashboardHeroImage || DEFAULT_HERO;
    const logoUrl = brand?.logoUrl;
    const appName = brand?.appName || 'COACHENCY PRO';
    const welcome = brand?.welcomeMessage;

    /* Level ring */
    const maxXP = stats.level * 1000;
    const percent = Math.min((stats.xp / maxXP) * 100, 100);
    const C = 2 * Math.PI * T.ring;
    const offset = C - (percent / 100) * C;

    /* Weekly chart */
    const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const todayMapped = ((new Date().getDay() + 6) % 7);
    const workoutDays = new Set(
        weeklyData.map((w: any) => ((new Date(w.completed_at).getDay() + 6) % 7)),
    );

    /* Session helpers */
    const sessionColor = (s: any) =>
        s?.source === 'program' ? T.cyan : s?.source === 'group' ? T.emerald : T.blue;
    const sessionLabel = (s: any) => {
        switch (s?.source) {
            case 'program': return 'Programme en cours';
            case 'group': return 'Séance Collective';
            case 'appointment': return 'Séance Privée';
            default: return 'Prochaine Séance';
        }
    };
    const fmt = (d: string) => {
        const dt = new Date(d);
        const now = new Date();
        if (dt.toDateString() === now.toDateString()) return "Aujourd'hui";
        const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
        if (dt.toDateString() === tmr.toDateString()) return 'Demain';
        return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    /* ══════════════════════════════════════════════════════ */
    return (
        <View style={{ flex: 1, backgroundColor: T.bg }}>
            <StatusBar style="light" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ╔═══════════════ HERO ═══════════════╗ */}
                <View style={{ minHeight: 440 }}>
                    {/* Background image — opacity controlled via imageStyle */}
                    <ImageBackground
                        source={{ uri: heroImg }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        imageStyle={{ opacity: 0.45 }}
                        resizeMode="cover"
                    />
                    {/* Smooth gradient overlays */}
                    <LinearGradient
                        colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.92)', '#020617']}
                        locations={[0, 0.25, 0.6, 1]}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' }}
                    />
                    <LinearGradient
                        colors={['rgba(2,6,23,0.5)', 'transparent']}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '30%' }}
                    />

                    <SafeAreaView edges={['top']}>
                        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, minHeight: 440, justifyContent: 'flex-end' }}>

                            {/* ── Brand ── */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {logoUrl ? (
                                            <Image source={{ uri: logoUrl }}
                                                style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }} />
                                        ) : (
                                            <View style={{
                                                width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: 'rgba(30,41,59,0.80)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                                shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.08, shadowRadius: 10,
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', fontStyle: 'italic' }}>C</Text>
                                            </View>
                                        )}
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: T.muted, letterSpacing: 3, textTransform: 'uppercase' }}>
                                            {appName}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                                        Bonjour {firstName}.
                                    </Text>
                                    {welcome ? (
                                        <Text style={{ color: T.textSecondary, fontSize: 14, marginTop: 4, maxWidth: 260, lineHeight: 20 }}>
                                            {welcome}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Bell – min 44×44 touch target (UI/UX Pro Max rule) */}
                                <TouchableOpacity
                                    style={{
                                        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: 'rgba(15,23,42,0.60)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Bell color={T.muted} size={20} />
                                </TouchableOpacity>
                            </View>

                            {/* ── Next Session Card ── */}
                            {next ? (
                                <View style={{
                                    borderRadius: 28, padding: 24, overflow: 'hidden',
                                    backgroundColor: 'rgba(15,23,42,0.70)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.40, shadowRadius: 40, elevation: 20,
                                }}>
                                    {/* Subtle corner glow */}
                                    <LinearGradient
                                        colors={[`${sessionColor(next)}18`, 'transparent']}
                                        start={{ x: 1, y: 0 }}
                                        end={{ x: 0.3, y: 0.7 }}
                                        style={{ position: 'absolute', top: 0, right: 0, width: 160, height: 160 }}
                                    />

                                    {/* Type badge */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sessionColor(next) }} />
                                        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: sessionColor(next) }}>
                                            {sessionLabel(next)}
                                        </Text>
                                    </View>

                                    <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 30, marginBottom: 16 }}>
                                        {next.title || next.name || 'Entraînement'}
                                    </Text>

                                    {/* Info pills */}
                                    <View style={{
                                        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24, paddingBottom: 24,
                                        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
                                    }}>
                                        <Pill icon={<Calendar color={sessionColor(next)} size={14} />} label={fmt(next.start)} />
                                        {next.source === 'program' && (
                                            <Pill icon={<Flame color={T.orange} size={14} />} label="Focus" />
                                        )}
                                    </View>

                                    {/* CTA – emerald gradient feel */}
                                    <TouchableOpacity activeOpacity={0.85}>
                                        <View style={{
                                            width: '100%', paddingVertical: 18, borderRadius: 16,
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            backgroundColor: T.emeraldDark,
                                            shadowColor: T.emerald, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 24,
                                        }}>
                                            <Play color={T.bg} size={18} fill={T.bg} />
                                            <Text style={{ fontSize: 17, fontWeight: '800', color: T.bg }}>Démarrer Entraînement</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : program ? (
                                /* Empty – active program */
                                <View style={{
                                    borderRadius: 28, padding: 32, alignItems: 'center', overflow: 'hidden',
                                    backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder,
                                }}>
                                    <View style={{
                                        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                        backgroundColor: 'rgba(34,211,238,0.10)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.20)',
                                        shadowColor: T.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20,
                                    }}>
                                        <Flame color={T.cyan} size={32} />
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 }}>Prêt pour la suite ?</Text>
                                    <Text style={{ color: T.muted, fontSize: 14, textAlign: 'center', marginBottom: 24, maxWidth: 280 }}>
                                        Votre programme vous attend. Continuez là où vous en étiez.
                                    </Text>
                                    <TouchableOpacity style={{ width: '100%' }} onPress={() => nav.navigate('Workouts')} activeOpacity={0.85}>
                                        <View style={{ width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#0891b2' }}>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Continuer mon programme</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                /* True empty */
                                <View style={{
                                    borderRadius: 28, padding: 32, alignItems: 'center', overflow: 'hidden',
                                    backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder,
                                }}>
                                    <View style={{
                                        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                    }}>
                                        {/* UI/UX Pro Max: no emoji → SVG icon */}
                                        <Sofa color={T.muted} size={28} />
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 }}>Repos mérité</Text>
                                    <Text style={{ color: T.muted, fontSize: 14, textAlign: 'center', marginBottom: 24, maxWidth: 280 }}>
                                        Votre corps récupère. Explorez le catalogue pour planifier la suite.
                                    </Text>
                                    <TouchableOpacity style={{ width: '100%' }} onPress={() => nav.navigate('Workouts')} activeOpacity={0.85}>
                                        <View style={{
                                            width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                        }}>
                                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Explorer le catalogue</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </SafeAreaView>
                </View>

                {/* ╔═══════════════ STATS RAIL ═══════════════╗ */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 12 }}
                >
                    {/* Level */}
                    <StatCard w={140}>
                        <Text style={S.statLabel}>Niveau</Text>
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <View style={{
                                width: 64, height: 64, alignItems: 'center', justifyContent: 'center',
                                shadowColor: T.emerald, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 16,
                            }}>
                                <Svg width={64} height={64} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                                    <Circle cx={32} cy={32} r={T.ring} fill="transparent" stroke="rgba(30,41,59,0.80)" strokeWidth={5} />
                                    <Circle cx={32} cy={32} r={T.ring} fill="transparent"
                                        stroke={T.emerald} strokeWidth={5}
                                        strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" />
                                </Svg>
                                <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>{stats.level}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: T.emerald, letterSpacing: 2 }}>{stats.xp} XP</Text>
                    </StatCard>

                    {/* Streak */}
                    <StatCard w={140} borderColor="rgba(249,115,22,0.20)">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={S.statLabel}>Série</Text>
                            <IconBadge><Flame color={T.orange} size={14} fill={T.orange} /></IconBadge>
                        </View>
                        <View>
                            <Text style={S.statValue}>{stats.streakDays}J</Text>
                            <Text style={S.statSub}>En cours</Text>
                        </View>
                    </StatCard>

                    {/* Weight */}
                    <StatCard w={140} onPress={() => nav.navigate('BodyComposition')}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={S.statLabel}>Poids</Text>
                            <IconBadge><Scale color={T.blue} size={14} /></IconBadge>
                        </View>
                        <View>
                            <Text style={S.statValue}>{weight ? `${weight}kg` : '--'}</Text>
                            <Text style={S.statSub}>Actuel</Text>
                        </View>
                    </StatCard>

                    {/* Workouts */}
                    <StatCard w={140}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={S.statLabel}>Séances</Text>
                            <IconBadge><Trophy color="#eab308" size={14} /></IconBadge>
                        </View>
                        <View>
                            <Text style={S.statValue}>{stats.totalWorkouts}</Text>
                            <Text style={S.statSub}>Total</Text>
                        </View>
                    </StatCard>

                    <View style={{ width: 16 }} />
                </ScrollView>

                {/* ╔═══════════════ QUICK ACTIONS ═══════════════╗ */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16, paddingTop: 8, paddingBottom: 12 }}
                >
                    {([
                        { id: 'chat', label: 'Coach', icon: MessageSquare, color: T.blue, onPress: undefined as (() => void) | undefined },
                        { id: 'weight', label: 'Poids', icon: Scale, color: T.emerald, onPress: () => nav.navigate('BodyComposition') },
                        { id: 'photos', label: 'Photos', icon: Camera, color: T.rose, onPress: undefined as (() => void) | undefined },
                        { id: 'program', label: 'Prog', icon: FileText, color: T.amber, onPress: () => nav.navigate('Workouts') },
                        { id: 'profile', label: 'Profil', icon: User, color: T.indigo, onPress: () => nav.navigate('Profile') },
                        { id: 'settings', label: 'Réglages', icon: Settings, color: T.muted, onPress: () => nav.navigate('Profile') },
                    ]).map((a) => (
                        <TouchableOpacity key={a.id} onPress={a.onPress} activeOpacity={0.7}
                            style={{ alignItems: 'center' }}
                        >
                            {/* 80×80 — same as PWA (w-20 h-20) */}
                            <View style={{
                                width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                                backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder,
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
                            }}>
                                <a.icon color={a.color} size={24} />
                            </View>
                            <Text style={{
                                fontSize: 11, fontWeight: '700', color: T.muted, marginTop: 10,
                                textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                                {a.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ╔═══════════════ WEEKLY CHART ═══════════════╗ */}
                <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
                    <View style={{
                        borderRadius: 28, padding: 24, overflow: 'hidden',
                        backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorderHover,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 15,
                    }}>
                        {/* Top glow */}
                        <View style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, backgroundColor: 'rgba(16,185,129,0.50)' }} />

                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Cette Semaine</Text>
                        <Text style={{ fontSize: 14, color: T.emerald, fontWeight: '500', marginTop: 4, marginBottom: 28 }}>
                            {weekly} séances terminées
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 144 }}>
                            {DAYS.map((day, i) => {
                                const done = workoutDays.has(i);
                                const today = i === todayMapped;
                                const h = done ? 85 : today ? 18 : 22;

                                return (
                                    <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 3, height: '100%', justifyContent: 'flex-end' }}>
                                        <View style={{
                                            width: '100%', maxWidth: 36, borderRadius: 12, overflow: 'hidden',
                                            height: `${h}%`,
                                            backgroundColor: done ? 'transparent' : today ? 'rgba(71,85,105,0.80)' : 'rgba(30,41,59,0.50)',
                                            borderWidth: today && !done ? 1 : 0, borderColor: 'rgba(100,116,139,0.60)',
                                            shadowColor: done ? T.emerald : 'transparent',
                                            shadowOffset: { width: 0, height: 0 }, shadowOpacity: done ? 0.60 : 0, shadowRadius: 24,
                                        }}>
                                            {/* Completed → gradient bar */}
                                            {done && (
                                                <LinearGradient
                                                    colors={[T.teal, T.emerald, T.emeraldDark]}
                                                    locations={[0, 0.4, 1]}
                                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                                />
                                            )}
                                            {/* Glass reflection on completed */}
                                            {done && (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.20)' }} />
                                            )}
                                        </View>
                                        <Text style={{
                                            fontSize: 11, fontWeight: '700', marginTop: 12,
                                            color: today ? T.emerald : done ? '#fff' : T.mutedDark,
                                        }}>
                                            {day}
                                        </Text>
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

/* ─────────────── Reusable sub-components ─────────────── */

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }}>
            {icon}
            <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{label}</Text>
        </View>
    );
}

function StatCard({ children, w, borderColor, onPress }: {
    children: React.ReactNode; w: number; borderColor?: string; onPress?: () => void;
}) {
    const inner = (
        <View style={{
            width: w, height: 140, borderRadius: 24, padding: 16,
            justifyContent: 'space-between', overflow: 'hidden',
            backgroundColor: 'rgba(15,23,42,0.50)',
            borderWidth: 1, borderColor: borderColor || 'rgba(255,255,255,0.05)',
            shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.20, shadowRadius: 12, elevation: 6,
        }}>
            {children}
        </View>
    );
    return onPress
        ? <TouchableOpacity activeOpacity={0.85} onPress={onPress}>{inner}</TouchableOpacity>
        : <TouchableOpacity activeOpacity={0.85}>{inner}</TouchableOpacity>;
}

function IconBadge({ children }: { children: React.ReactNode }) {
    return (
        <View style={{
            width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }}>
            {children}
        </View>
    );
}



const S = {
    statLabel: {
        fontSize: 10,
        fontWeight: '800' as const,
        color: '#94a3b8',
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900' as const,
        color: '#fff',
        letterSpacing: -0.5,
    },
    statSub: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: '#64748b',
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
    },
};
