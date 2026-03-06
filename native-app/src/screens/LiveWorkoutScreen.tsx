import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Platform,
    StatusBar
} from 'react-native';
import {
    ChevronLeft,
    ChevronRight,
    Timer as TimerIcon,
    CheckCircle,
    Play,
    Pause,
    SkipForward,
    Info,
    Flame,
    Zap,
    X,
    RotateCcw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLiveWorkout, SetData } from '../hooks/useLiveWorkout';
import { supabase } from '../lib/supabase';
import { Stepper } from '../components/Stepper';
import YoutubeIframe from 'react-native-youtube-iframe';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const getYoutubeVideoId = (url: string | undefined | null) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
};

const T = {
    bg: '#09090b',
    card: 'rgba(24, 24, 27, 0.6)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    indigo: '#6366f1',
    orange: '#f97316',
    emerald: '#10b981',
    rose: '#f43f5e',
    muted: '#71717a',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function LiveWorkoutScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { scheduledSessionId, appointmentId } = route.params;

    const {
        isLoading,
        session,
        exercises,
        currentExerciseIndex,
        setCurrentExerciseIndex,
        activeSetIndex,
        completedExercises,
        groupTimer,
        elapsedTime,
        isPaused,
        setIsPaused,
        restTimer,
        setRestTimer,
        activeTimer,
        handleUpdateSet,
        toggleSetCompletion,
        handleAutoAdvance,
        handleStartTimer,
        handlePauseTimer,
        handleStopTimer
    } = useLiveWorkout(scheduledSessionId, appointmentId);

    const [isFinalizing, setIsFinalizing] = useState(false);
    const [localActiveSetIndex, setLocalActiveSetIndex] = useState(0);

    const currentEx = exercises[currentExerciseIndex];
    const setStates = useMemo(() => completedExercises[currentEx?.id]?.sets || [], [completedExercises, currentEx?.id]);
    const activeSet = setStates[localActiveSetIndex] || setStates[0];

    // Sync local active set with hook's active set index on exercise change
    useEffect(() => {
        setLocalActiveSetIndex(activeSetIndex);
    }, [activeSetIndex, currentExerciseIndex]);

    // Calculate progression
    const totalSets = useMemo(() => exercises.reduce((acc, ex) => acc + (ex.group?.repetitions || ex.sets), 0), [exercises]);
    const completedSetsCount = useMemo(() => Object.values(completedExercises).reduce((acc, ex) =>
        acc + ex.sets.filter(s => s.completed).length, 0), [completedExercises]);
    const progressPercent = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

    const isFlowMode = currentEx?.group?.type === 'circuit' || currentEx?.group?.type === 'amrap' || currentEx?.group?.type === 'interval';
    const isLastEx = currentExerciseIndex === exercises.length - 1;
    const isLastSet = localActiveSetIndex === setStates.length - 1;

    const handleFinish = async () => {
        Alert.alert(
            "Terminer la séance",
            "Voulez-vous enregistrer et terminer votre entraînement ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Terminer",
                    onPress: async () => {
                        try {
                            setIsFinalizing(true);
                            const table = scheduledSessionId ? 'scheduled_sessions' : 'appointments';
                            const { error } = await supabase
                                .from(table)
                                .update({
                                    status: 'completed',
                                    completed_at: new Date().toISOString(),
                                    actual_duration_seconds: elapsedTime
                                })
                                .eq('id', scheduledSessionId || appointmentId);

                            if (error) throw error;
                            navigation.navigate('WorkoutsList');
                        } catch (err) {
                            Alert.alert('Erreur', 'Impossible d\'enregistrer la séance.');
                        } finally {
                            setIsFinalizing(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading || !currentEx) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={T.indigo} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ── Background Gradients ── */}
            <View style={styles.bgGradientContainer}>
                {!isFlowMode ? (
                    <>
                        <LinearGradient
                            colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
                            style={[styles.bgGlow, { top: -200, left: '50%', transform: [{ translateX: -SCREEN_W / 2 }] }]}
                        />
                        <LinearGradient
                            colors={['rgba(99, 102, 241, 0.1)', 'transparent']}
                            style={[styles.bgGlow, { bottom: -100, left: -100 }]}
                        />
                    </>
                ) : (
                    <LinearGradient
                        colors={['rgba(249, 115, 22, 0.15)', 'transparent']}
                        style={[styles.bgGlow, { top: '10%', left: '50%', transform: [{ translateX: -SCREEN_W / 2 }] }]}
                    />
                )}
            </View>

            {/* ╔═══════════════ HEADER ═══════════════╗ */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    {isFlowMode ? (
                        <View style={styles.flowBadgeContainer}>
                            <View style={styles.flowBadge}>
                                <Text style={styles.flowBadgeText}>{currentEx.group?.name || currentEx.group?.type?.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.flowRoundText}>
                                Tour {localActiveSetIndex + 1}/{currentEx.group?.repetitions || currentEx.sets}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.standardHeaderLabel}>
                            <Text style={styles.headerLabelText}>EXERCICE {currentExerciseIndex + 1}/{exercises.length}</Text>
                            <View style={styles.miniProgressContainer}>
                                <View style={[styles.miniProgressBar, { width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }]} />
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
                        {isPaused ? <Play color={T.emerald} size={24} fill={T.emerald} /> : <Pause color="#fff" size={24} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Video or Spacer Section */}
                <View style={{ height: (SCREEN_W - 40) * 0.5625, marginHorizontal: 20, marginBottom: 24 }}>
                    {currentEx.video_url && getYoutubeVideoId(currentEx.video_url) ? (
                        <View style={styles.videoContainer}>
                            <YoutubeIframe
                                height={(SCREEN_W - 40) * 0.5625}
                                width={SCREEN_W - 40}
                                videoId={getYoutubeVideoId(currentEx.video_url)!}
                                play={false}
                                initialPlayerParams={{
                                    controls: true,
                                    modestbranding: true,
                                    rel: false,
                                }}
                            />
                        </View>
                    ) : null}
                </View>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    {!isFlowMode && (
                        <View style={styles.activeStatusBadge}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.activeStatusText}>SÉRIE EN COURS</Text>
                        </View>
                    )}
                    <Text style={styles.exerciseTitle}>{currentEx.name}</Text>
                    <Text style={styles.sessionSubtitle}>{session?.session?.name}</Text>
                </View>

                {/* AMRAP / Group Timer (Large) */}
                {groupTimer !== null && (
                    <View style={styles.largeTimerContainer}>
                        <Text style={styles.largeTimerValue}>{formatTime(groupTimer)}</Text>
                        <Text style={styles.largeTimerLabel}>TEMPS RESTANT</Text>
                    </View>
                )}

                {/* Set Navigation (Horizontal) */}
                {!isFlowMode && setStates.length > 0 && (
                    <View style={styles.setNavContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.setNavScroll}>
                            {setStates.map((s, idx) => {
                                const isActive = idx === localActiveSetIndex;
                                const isCompleted = s.completed;
                                return (
                                    <View key={idx} style={styles.setNavItemWrapper}>
                                        <TouchableOpacity
                                            onPress={() => setLocalActiveSetIndex(idx)}
                                            style={[
                                                styles.setNavItem,
                                                isActive && styles.setNavItemActive,
                                                isCompleted && !isActive && styles.setNavItemCompleted
                                            ]}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle size={18} color={T.emerald} />
                                            ) : (
                                                <Text style={[styles.setNavItemText, isActive && styles.setNavItemTextActive]}>{idx + 1}</Text>
                                            )}
                                        </TouchableOpacity>
                                        <Text style={[
                                            styles.setNavItemLabel,
                                            isActive ? { color: T.indigo } : isCompleted ? { color: T.emerald } : { color: T.textSecondary }
                                        ]}>
                                            {isActive ? 'COURANTE' : isCompleted ? 'VALIDÉ' : 'À VENIR'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Focus Case (Action Card) */}
                {activeSet && (
                    <View style={styles.focusContainer}>
                        <BlurView intensity={30} style={styles.actionCard}>
                            {/* Card Glow */}
                            <LinearGradient
                                colors={[isFlowMode ? 'rgba(249, 115, 22, 0.1)' : 'rgba(99, 102, 241, 0.1)', 'transparent']}
                                style={styles.cardInternalGlow}
                            />

                            {activeSet.isGhost && (
                                <View style={styles.ghostInfoBadge}>
                                    <Text style={styles.ghostInfoText}>HISTORIQUE PRÉ-REMPLI</Text>
                                </View>
                            )}

                            <View style={styles.steppersGrid}>
                                {(currentEx.track_weight !== false) && (
                                    <Stepper
                                        label="POIDS (KG)"
                                        value={activeSet.weight || 0}
                                        ghostValue={activeSet.isGhost ? undefined : setStates[localActiveSetIndex]?.weight}
                                        step={2.5}
                                        onChange={(v) => handleUpdateSet(currentEx.id, localActiveSetIndex, { weight: v })}
                                    />
                                )}
                                {(currentEx.track_reps !== false) && (
                                    <Stepper
                                        label="REPS"
                                        value={activeSet.reps || 0}
                                        ghostValue={activeSet.isGhost ? undefined : setStates[localActiveSetIndex]?.reps}
                                        onChange={(v) => handleUpdateSet(currentEx.id, localActiveSetIndex, { reps: v })}
                                    />
                                )}
                                {currentEx.track_duration && (
                                    <View style={{ width: '100%', marginTop: 16 }}>
                                        {activeTimer && activeTimer.setIndex === localActiveSetIndex ? (
                                            <View style={[
                                                styles.activeTimerOverlay,
                                                activeTimer.isPreStart ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' } : {}
                                            ]}>
                                                <Text style={[
                                                    styles.activeTimerValue,
                                                    activeTimer.isPreStart ? { color: '#ef4444' } : {}
                                                ]}>
                                                    {activeTimer.isPreStart
                                                        ? activeTimer.preStartTimeLeft
                                                        : formatTime(activeTimer.timeLeft)}
                                                </Text>
                                                <View style={styles.activeTimerControls}>
                                                    <TouchableOpacity onPress={handlePauseTimer} style={styles.activeTimerBtn}>
                                                        {activeTimer.isRunning ? <Pause color="#fff" size={20} fill="#fff" /> : <Play color="#fff" size={20} fill="#fff" />}
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={handleStopTimer} style={[styles.activeTimerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                                        <X color="#fc8181" size={20} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={{ gap: 8 }}>
                                                <Stepper
                                                    label="DURÉE (S)"
                                                    value={activeSet.duration_seconds || 60}
                                                    ghostValue={activeSet.isGhost ? undefined : setStates[localActiveSetIndex]?.duration_seconds}
                                                    step={5}
                                                    onChange={(v) => handleUpdateSet(currentEx.id, localActiveSetIndex, { duration_seconds: v })}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => handleStartTimer(localActiveSetIndex, activeSet.duration_seconds || 60)}
                                                    style={[styles.startTimerBtn, isFlowMode ? { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.3)' } : {}]}
                                                >
                                                    <Play color={isFlowMode ? T.orange : T.indigo} size={16} fill={isFlowMode ? T.orange : T.indigo} />
                                                    <Text style={[styles.startTimerText, isFlowMode ? { color: T.orange } : {}]}>LANCER CHRONO</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}
                                {currentEx.track_distance && (
                                    <View style={{ width: '100%', marginTop: currentEx.track_duration ? 16 : 0 }}>
                                        <Stepper
                                            label="DIST (M)"
                                            value={activeSet.distance_meters || 0}
                                            ghostValue={activeSet.isGhost ? undefined : setStates[localActiveSetIndex]?.distance_meters}
                                            step={50}
                                            onChange={(v) => handleUpdateSet(currentEx.id, localActiveSetIndex, { distance_meters: v })}
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    if (isLastEx && isLastSet && (activeSet.completed || isFlowMode)) {
                                        // If not already completed, complete it first
                                        if (!activeSet.completed) {
                                            toggleSetCompletion(currentEx.id, localActiveSetIndex);
                                        }
                                        // Then finish or show the finish alert
                                        handleFinish();
                                    } else {
                                        toggleSetCompletion(currentEx.id, localActiveSetIndex);
                                    }
                                }}
                                style={[
                                    styles.validateBtn,
                                    (isLastEx && isLastSet && (activeSet.completed || isFlowMode)) ? { backgroundColor: T.emerald } :
                                        isFlowMode ? { backgroundColor: T.orange } :
                                            activeSet.completed ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' } :
                                                { backgroundColor: T.indigo }
                                ]}
                            >
                                <Text style={[styles.validateBtnText, (activeSet.completed || (isLastEx && isLastSet && isFlowMode)) && !isLastEx && { color: '#fff' }]}>
                                    {(isLastEx && isLastSet) ? 'TERMINER LA SÉANCE' :
                                        isFlowMode ? 'VALIDER & SUIVANT' :
                                            activeSet.completed ? 'MODIFIER LA SÉRIE' : 'VALIDER LA SÉRIE'}
                                </Text>
                                <CheckCircle size={20} color="#fff" />
                            </TouchableOpacity>
                        </BlurView>

                        {/* Summary / Instructions */}
                        {currentEx.instructions && (
                            <TouchableOpacity style={styles.instructionToggle}>
                                <Info size={16} color={T.indigo} />
                                <Text style={styles.instructionText} numberOfLines={2}>{currentEx.instructions}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ╔═══════════════ FOOTER CONTROLS ═══════════════╗ */}
            <BlurView intensity={80} tint="dark" style={styles.footer}>
                <View style={styles.footerRow}>
                    <TouchableOpacity
                        onPress={() => currentExerciseIndex > 0 && setCurrentExerciseIndex(prev => prev - 1)}
                        style={[styles.footerNavBtn, currentExerciseIndex === 0 && { opacity: 0.3 }]}
                        disabled={currentExerciseIndex === 0}
                    >
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>

                    <View style={styles.footerStats}>
                        <View style={styles.footerProgressBg}>
                            <View style={[styles.footerProgressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.footerTime}>{formatTime(elapsedTime)}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => !isLastEx && setCurrentExerciseIndex(prev => prev + 1)}
                        style={[styles.footerNavBtn, isLastEx && { opacity: 0.3 }]}
                        disabled={isLastEx}
                    >
                        <ChevronRight color="#fff" size={24} />
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* ╔═══════════════ REST TIMER OVERLAY ═══════════════╗ */}
            {restTimer !== null && restTimer > 0 && (
                <BlurView intensity={100} tint="dark" style={styles.restOverlay}>
                    <View style={styles.restCircle}>
                        <TimerIcon size={40} color={T.indigo} />
                    </View>
                    <Text style={styles.restValue}>{restTimer}</Text>
                    <Text style={styles.restMuted}>REPOS - SOUFFLEZ UN PEU</Text>

                    <TouchableOpacity
                        onPress={() => {
                            handleAutoAdvance();
                            setRestTimer(null);
                        }}
                        style={styles.skipRestBtn}
                    >
                        <Text style={styles.skipRestBtnText}>REPRENDRE MAINTENANT</Text>
                    </TouchableOpacity>
                </BlurView>
            )}

            {isFinalizing && (
                <View style={styles.finalizingOverlay}>
                    <ActivityIndicator color={T.indigo} size="large" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: T.bg,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: T.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgGradientContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bgGlow: {
        position: 'absolute',
        width: SCREEN_W * 2,
        height: 600,
        borderRadius: SCREEN_W,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    standardHeaderLabel: {
        alignItems: 'center',
    },
    headerLabelText: {
        color: T.indigo,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    miniProgressContainer: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    miniProgressBar: {
        height: '100%',
        backgroundColor: T.indigo,
        borderRadius: 2,
    },
    flowBadgeContainer: {
        alignItems: 'center',
    },
    flowBadge: {
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.2)',
        marginBottom: 2,
    },
    flowBadgeText: {
        color: T.orange,
        fontSize: 10,
        fontWeight: '800',
    },
    flowRoundText: {
        color: T.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 140,
    },
    videoContainer: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#000',
    },
    titleSection: {
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 30,
    },
    activeStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: T.indigo,
        marginRight: 6,
    },
    activeStatusText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    exerciseTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 4,
    },
    sessionSubtitle: {
        color: T.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    largeTimerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    largeTimerValue: {
        fontSize: 72,
        fontWeight: '900',
        color: T.orange,
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(249, 115, 22, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    largeTimerLabel: {
        color: 'rgba(249, 115, 22, 0.6)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: -5,
    },
    setNavContainer: {
        marginBottom: 24,
    },
    setNavScroll: {
        paddingHorizontal: 20,
    },
    setNavItemWrapper: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    setNavItem: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    setNavItemActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: T.indigo,
        borderWidth: 2,
        shadowColor: T.indigo,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    setNavItemCompleted: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    setNavItemText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
        fontWeight: '800',
    },
    setNavItemTextActive: {
        color: '#fff',
    },
    setNavItemLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    focusContainer: {
        paddingHorizontal: 20,
    },
    actionCard: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(24, 24, 27, 0.6)',
        overflow: 'hidden',
    },
    cardInternalGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    ghostInfoBadge: {
        position: 'absolute',
        top: 16,
        left: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    ghostInfoText: {
        color: T.muted,
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    startTimerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    startTimerText: {
        color: T.indigo,
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },
    activeTimerOverlay: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTimerValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
        marginBottom: 16,
    },
    activeTimerControls: {
        flexDirection: 'row',
        gap: 16,
    },
    activeTimerBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    steppersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20,
        marginBottom: 30,
    },
    validateBtn: {
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    validateBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    instructionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        marginTop: 16,
        gap: 12,
    },
    instructionText: {
        flex: 1,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 40,
        paddingTop: 15,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerNavBtn: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerStats: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    footerProgressBg: {
        height: 3,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        marginBottom: 8,
    },
    footerProgressFill: {
        height: '100%',
        backgroundColor: T.indigo,
        borderRadius: 2,
    },
    footerTime: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    restOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        zIndex: 100,
    },
    restCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    restValue: {
        fontSize: 100,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
        lineHeight: 110,
    },
    restMuted: {
        color: 'rgba(99, 102, 241, 0.6)',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 50,
    },
    skipRestBtn: {
        width: '100%',
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipRestBtnText: {
        color: T.bg,
        fontSize: 16,
        fontWeight: '900',
    },
    finalizingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
    },
});
