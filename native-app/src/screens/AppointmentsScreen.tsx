import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
    ActivityIndicator,
    Modal,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    User,
    Users,
    Clock,
    Dumbbell,
    FileText,
    Activity,
    Moon,
    BadgeCheck,
    MapPin,
    ArrowRight,
    X,
    TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { format, isToday as isDateToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_W } = Dimensions.get('window');

const T = {
    bg: '#020617',
    card: 'rgba(15, 23, 42, 0.6)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    emerald: '#34d399',
    blue: '#60a5fa',
    amber: '#fbbf24',
    indigo: '#a78bfa',
    rose: '#fb7185',
    cyan: '#22d3ee',
    muted: '#94a3b8',
    textSecondary: '#cbd5e1',
};

export default function AppointmentsScreen() {
    const {
        loading,
        activeTab,
        setActiveTab,
        personalSessions,
        groupSessions,
        viewDate,
        weekDays,
        navigateWeek,
        refetch,
        handleRegister,
        handleUnregister
    } = useAppointments();

    const nav = useNavigation<any>();
    const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const currentSessions = activeTab === 'personal' ? personalSessions : groupSessions;
    const selectedApt = selectedAptId ? currentSessions.find(a => a.id === selectedAptId) : null;

    const handleSelectApt = (apt: Appointment) => {
        if (apt.item_type === 'rest') return;
        if (apt.item_type === 'metric') {
            nav.navigate('BodyComposition');
            return;
        }
        setSelectedAptId(apt.id);
        setModalVisible(true);
    };

    if (loading && !personalSessions.length && !groupSessions.length) {
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
                    colors={['rgba(96,165,250,0.1)', 'transparent']}
                    style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200 }}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                stickyHeaderIndices={[1]}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && (personalSessions.length > 0 || groupSessions.length > 0)}
                        onRefresh={refetch}
                        tintColor={T.emerald}
                        colors={[T.emerald]}
                    />
                }
            >
                {/* ╔═══════════════ HERO ═══════════════╗ */}
                <View style={{ height: 260, justifyContent: 'flex-end' }}>
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop' }}
                        style={{ position: 'absolute', inset: 0 }}
                        imageStyle={{ opacity: 0.35 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(2,6,23,0.6)', T.bg]}
                        locations={[0, 0.4, 1]}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    <View style={{ paddingHorizontal: 24, paddingBottom: 25, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: T.muted, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
                            Votre Planning
                        </Text>
                        <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>
                            AGENDA
                        </Text>
                    </View>
                </View>

                {/* ╔═══════════════ CONTENT (STICKY NAV) ═══════════════╗ */}
                <View style={{ backgroundColor: T.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30, paddingTop: 24 }}>

                    {/* Segmented Control */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                onPress={() => setActiveTab('personal')}
                                style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
                            >
                                <User size={16} color={activeTab === 'personal' ? '#fff' : T.muted} />
                                <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>Privé</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setActiveTab('group')}
                                style={[styles.tab, activeTab === 'group' && styles.tabActive]}
                            >
                                <Users size={16} color={activeTab === 'group' ? '#fff' : T.muted} />
                                <Text style={[styles.tabText, activeTab === 'group' && styles.tabTextActive]}>Collectif</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Week Navigator */}
                    <View style={styles.weekNav}>
                        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navBtn}>
                            <ChevronLeft color="#fff" size={20} />
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.monthText}>{format(viewDate, 'MMMM yyyy', { locale: fr })}</Text>
                            <Text style={styles.weekText}>SÉMAINE {format(viewDate, 'w')}</Text>
                        </View>

                        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navBtn}>
                            <ChevronRight color="#fff" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Timeline Data */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                        {weekDays.map((day, idx) => {
                            const dayEvents = currentSessions.filter(s =>
                                s.start.getDate() === day.getDate() &&
                                s.start.getMonth() === day.getMonth() &&
                                s.start.getFullYear() === day.getFullYear()
                            );
                            const today = isDateToday(day);

                            return (
                                <View key={idx} style={styles.dayRow}>
                                    {/* Date Circle */}
                                    <View style={styles.dateCol}>
                                        <View style={[styles.dateCircle, today && styles.dateCircleToday]}>
                                            <Text style={[styles.dateDay, today && { color: '#fff' }]}>{format(day, 'd')}</Text>
                                        </View>
                                        <Text style={[styles.dateName, today && { color: T.blue }]}>{format(day, 'EEE', { locale: fr }).toUpperCase()}</Text>
                                        {idx < 6 && <View style={styles.timelineLine} />}
                                    </View>

                                    {/* Events List */}
                                    <View style={styles.eventsCol}>
                                        {dayEvents.length > 0 ? (
                                            dayEvents.map(event => (
                                                <EventCard key={event.id} event={event} onPress={() => handleSelectApt(event)} />
                                            ))
                                        ) : (
                                            <View style={styles.emptyDayContainer}>
                                                <Text style={styles.emptyDayText}>Rien de prévu</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Appointment Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                    <BlurView intensity={90} tint="dark" style={styles.modalContent}>
                        {selectedApt && (
                            <View>
                                <View style={styles.modalHeader}>
                                    <View style={[styles.modalIconBox, { backgroundColor: getThemeColor(selectedApt.item_type) + '20' }]}>
                                        {getIcon(selectedApt.item_type, 28)}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalTitle}>{selectedApt.title}</Text>
                                        <Text style={styles.modalSubtitle}>Avec {selectedApt.coach?.full_name || 'votre coach'}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                        <X color="#fff" size={20} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalStats}>
                                    <View style={styles.modalStatItem}>
                                        <Clock size={16} color={T.muted} />
                                        <Text style={styles.modalStatText}>{format(selectedApt.start, 'HH:mm')} - {format(selectedApt.end, 'HH:mm')}</Text>
                                    </View>
                                    {selectedApt.price !== undefined && selectedApt.price > 0 && (
                                        <View style={styles.modalStatItem}>
                                            <TrendingUp size={16} color={T.amber} />
                                            <Text style={styles.modalStatText}>{selectedApt.price} CHF</Text>
                                        </View>
                                    )}
                                </View>

                                {selectedApt.notes && (
                                    <View style={styles.noteBox}>
                                        <Text style={styles.noteTitle}>Notes du coach</Text>
                                        <Text style={styles.noteText}>{selectedApt.notes}</Text>
                                    </View>
                                )}

                                {selectedApt.type === 'group' && !selectedApt.registered ? (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, selectedApt.payment_method === 'online' && { backgroundColor: T.blue }, actionLoading && { opacity: 0.5 }]}
                                        disabled={actionLoading}
                                        onPress={async () => {
                                            setActionLoading(true);
                                            try {
                                                await handleRegister(selectedApt.id, selectedApt.source as any);
                                                if (selectedApt.payment_method !== 'online') {
                                                    setModalVisible(false);
                                                }
                                            } catch (e) {
                                                // Alert already shown by hook
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                    >
                                        <Text style={[styles.actionBtnText, selectedApt.payment_method === 'online' && { color: '#fff' }]}>
                                            {selectedApt.payment_method === 'online' ? `PAYER ${selectedApt.price} CHF` : "S'INSCRIRE À LA SÉANCE"}
                                        </Text>
                                        {selectedApt.payment_method === 'online' ? (
                                            <Clock color="#fff" size={18} />
                                        ) : (
                                            <BadgeCheck color={T.bg} size={18} />
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ gap: 12 }}>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => {
                                                setModalVisible(false);
                                                if (selectedApt.item_type === 'session') {
                                                    nav.navigate('Workouts', {
                                                        screen: 'LiveWorkout',
                                                        params: {
                                                            scheduledSessionId: selectedApt.type === 'personal' ? selectedApt.id : undefined,
                                                            appointmentId: (selectedApt.type === 'appointment_registration' || selectedApt.type === 'group') ? selectedApt.id : undefined
                                                        }
                                                    });
                                                }
                                            }}
                                        >
                                            <Text style={styles.actionBtnText}>DÉMARRER LA SÉANCE</Text>
                                            <ArrowRight color={T.bg} size={18} />
                                        </TouchableOpacity>

                                        {selectedApt.registered && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.rose }, actionLoading && { opacity: 0.5 }]}
                                                disabled={actionLoading}
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Se désinscrire',
                                                        'Êtes-vous sûr de vouloir vous désinscrire de cette séance ?',
                                                        [
                                                            { text: 'Annuler', style: 'cancel' },
                                                            {
                                                                text: 'Se désinscrire',
                                                                style: 'destructive',
                                                                onPress: async () => {
                                                                    setActionLoading(true);
                                                                    try {
                                                                        await handleUnregister(selectedApt.id, selectedApt.source as any);
                                                                        setModalVisible(false);
                                                                    } catch (e) {
                                                                        // Alert already shown by hook
                                                                    } finally {
                                                                        setActionLoading(false);
                                                                    }
                                                                },
                                                            },
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={[styles.actionBtnText, { color: T.rose }]}>SE DÉSINSCRIRE</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
}


function EventCard({ event, onPress }: { event: Appointment; onPress: () => void }) {
    const isAppointment = (event as any).source === 'appointment';
    const color = isAppointment ? T.cyan : getThemeColor(event.item_type);
    const icon = isAppointment ? <Users size={20} color={T.cyan} /> : getIcon(event.item_type, 20);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: color + '15' }]}>
                    {icon}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={[styles.cardBadge, { color }]}>
                            {isAppointment ? 'RENDEZ-VOUS' : 'ENTRAÎNEMENT'}
                        </Text>
                    </View>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    <View style={styles.cardMeta}>
                        <Clock size={12} color={T.muted} />
                        <Text style={styles.cardTime}>{isAppointment ? format(event.start, 'HH:mm') : format(event.start, 'd MMM', { locale: fr })}</Text>
                        {event.coach && (
                            <>
                                <View style={styles.dot} />
                                <Text style={styles.cardTime}>{event.coach.full_name}</Text>
                            </>
                        )}
                        {event.price !== undefined && event.price > 0 && !event.registered && (
                            <>
                                <View style={styles.dot} />
                                <Text style={[styles.cardTime, { color: T.blue, fontWeight: '800' }]}>{event.price} CHF</Text>
                            </>
                        )}
                    </View>
                </View>
                {event.registered ? (
                    <BadgeCheck size={18} color={T.emerald} />
                ) : (
                    <ChevronRight color={T.muted} size={18} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const getThemeColor = (type: string) => {
    switch (type) {
        case 'note': return T.amber;
        case 'metric': return T.emerald;
        case 'rest': return T.indigo;
        default: return T.blue;
    }
};

const getIcon = (type: string, size: number) => {
    switch (type) {
        case 'note': return <FileText size={size} color={T.amber} />;
        case 'metric': return <TrendingUp size={size} color={T.emerald} />;
        case 'rest': return <Moon size={size} color={T.indigo} />;
        default: return <Dumbbell size={size} color={T.blue} />;
    }
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15,23,42,0.8)',
        padding: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    tabActive: {
        backgroundColor: 'rgba(30,41,59,1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: T.muted,
    },
    tabTextActive: {
        color: '#fff',
    },
    weekNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    weekText: {
        color: T.muted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 2,
    },
    dayRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dateCol: {
        width: 60,
        alignItems: 'center',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dateCircleToday: {
        backgroundColor: T.blue,
        borderColor: '#93c5fd',
        shadowColor: T.blue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    dateDay: {
        color: T.muted,
        fontSize: 15,
        fontWeight: '800',
    },
    dateName: {
        color: 'rgba(148, 163, 184, 0.4)',
        fontSize: 10,
        fontWeight: '800',
        marginTop: 6,
    },
    timelineLine: {
        width: 1,
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 8,
    },
    eventsCol: {
        flex: 1,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: T.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: T.cardBorder,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBadge: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    cardTime: {
        color: T.muted,
        fontSize: 12,
        fontWeight: '500',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    emptyDayContainer: {
        height: 40,
        justifyContent: 'center',
    },
    emptyDayText: {
        color: 'rgba(148, 163, 184, 0.25)',
        fontSize: 13,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    modalIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    modalSubtitle: {
        color: T.muted,
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalStats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    modalStatItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalStatText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    noteBox: {
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.1)',
        marginBottom: 32,
    },
    noteTitle: {
        color: T.amber,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    noteText: {
        color: T.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    actionBtn: {
        backgroundColor: T.emerald,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 18,
        shadowColor: T.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    actionBtnText: {
        color: T.bg,
        fontSize: 16,
        fontWeight: '900',
    },
});
