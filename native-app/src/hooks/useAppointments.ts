import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { startOfWeek, addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/ClientAuthContext';
import { useStripe } from '@stripe/stripe-react-native';

export interface Appointment {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    notes?: string;
    session?: any;
    coach?: any;
    type: 'personal' | 'group' | 'appointment_registration';
    item_type: 'session' | 'note' | 'metric' | 'rest';
    source?: 'scheduled_session' | 'appointment';
    registered?: boolean;
    registrationStatus?: string;
    max_participants?: number;
    current_participants?: number;
    session_id?: string;
    price?: number;
    payment_method?: string;
    coach_id?: string;
}

export function useAppointments() {
    const { client } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
    const [personalSessions, setPersonalSessions] = useState<Appointment[]>([]);
    const [groupSessions, setGroupSessions] = useState<Appointment[]>([]);
    const [viewDate, setViewDate] = useState(new Date());
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const getWeekDays = useCallback((date: Date) => {
        const start = startOfWeek(date, { locale: fr, weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, []);

    const weekDays = getWeekDays(viewDate);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(viewDate);
        newDate.setDate(viewDate.getDate() + (direction === 'next' ? 7 : -7));
        setViewDate(newDate);
    };

    const fetchSessions = async () => {
        if (!client?.id) return;

        try {
            setLoading(true);

            // --- 1. FETCH PERSONAL SESSIONS (scheduled_sessions) ---
            const { data: scheduledData, error: scheduledError } = await supabase
                .from('scheduled_sessions')
                .select(`
                    *,
                    session:sessions (
                        id,
                        name,
                        description,
                        duration_minutes,
                        difficulty_level,
                        session_type
                    ),
                    coach:coaches (full_name, email, phone)
                `)
                .eq('client_id', client.id)
                .order('scheduled_date', { ascending: true });

            if (scheduledError) throw scheduledError;

            const formattedPersonalSessions: Appointment[] = (scheduledData || []).map(s => {
                let title = s.title;
                if (!title) {
                    if (s.session?.name) title = s.session.name;
                    else if (s.item_type === 'rest') title = 'Repos';
                    else if (s.item_type === 'note') title = 'Note';
                    else if (s.item_type === 'metric') title = 'Métrique';
                    else title = 'Séance';
                }

                return {
                    id: s.id,
                    title: title,
                    start: new Date(s.scheduled_date),
                    end: new Date(new Date(s.scheduled_date).getTime() + (s.session?.duration_minutes || 60) * 60000),
                    status: s.status,
                    notes: s.notes,
                    session: s.session,
                    coach: s.coach,
                    type: 'personal',
                    item_type: (s.item_type || 'session') as any,
                    source: 'scheduled_session',
                    session_id: s.session_id
                };
            });

            // --- 2. FETCH REGISTERED APPOINTMENTS (appointments table) ---
            const { data: myRegisteredAppointments, error: myRegAppsError } = await supabase
                .from('appointment_registrations')
                .select(`
                    id,
                    status,
                    appointment:appointments (
                        id,
                        title,
                        start,
                        duration,
                        status,
                        notes,
                        session_id,
                        coach:coaches (full_name, email, phone),
                        session:sessions (
                            id,
                            name,
                            description,
                            duration_minutes,
                            difficulty_level
                        )
                    )
                `)
                .eq('client_id', client.id);

            if (myRegAppsError) console.error('Error fetching registered appointments:', myRegAppsError);

            const formattedRegisteredAppointments: Appointment[] = (myRegisteredAppointments as any || [])
                .filter((reg: any) => reg.appointment)
                .map((reg: any) => {
                    const apt = reg.appointment;
                    return {
                        id: apt.id,
                        title: apt.title || apt.session?.name || 'Séance',
                        start: new Date(apt.start),
                        end: new Date(new Date(apt.start).getTime() + (apt.duration || 60) * 60000),
                        status: apt.status,
                        notes: apt.notes,
                        coach: apt.coach,
                        type: 'appointment_registration',
                        source: 'appointment',
                        item_type: 'session',
                        session_id: apt.session_id,
                        session: apt.session || { name: apt.title, duration_minutes: apt.duration },
                        registered: true,
                        registrationStatus: reg.status
                    };
                });

            // --- 3. FETCH REGISTERED GROUP SESSIONS (scheduled_sessions table) ---
            const { data: mySessionRegs } = await supabase
                .from('session_registrations')
                .select('scheduled_session_id')
                .eq('client_id', client.id);

            const registeredSessionIds = (mySessionRegs || []).map(r => r.scheduled_session_id);

            let formattedRegisteredSessions: Appointment[] = [];
            if (registeredSessionIds.length > 0) {
                const { data: registeredSessionsData } = await supabase
                    .from('scheduled_sessions')
                    .select(`
                        *,
                        session:sessions (id, name, duration_minutes),
                        coach:coaches (full_name)
                    `)
                    .in('id', registeredSessionIds);

                formattedRegisteredSessions = (registeredSessionsData || []).map(s => ({
                    id: s.id,
                    title: s.session?.name || 'Séance Collective',
                    start: new Date(s.scheduled_date),
                    end: new Date(new Date(s.scheduled_date).getTime() + (s.session?.duration_minutes || 60) * 60000),
                    status: s.status,
                    session: s.session,
                    coach: s.coach,
                    type: 'group',
                    item_type: 'session',
                    registered: true
                }));
            }

            // Merge All Personal
            const allPersonalMerged = [...formattedPersonalSessions, ...formattedRegisteredAppointments, ...formattedRegisteredSessions];
            // Deduplicate by source ID and start time
            const uniqueMap = new Map();
            allPersonalMerged.forEach(item => {
                const key = `${item.id}-${item.start.getTime()}`;
                if (!uniqueMap.has(key)) uniqueMap.set(key, item);
            });
            setPersonalSessions(Array.from(uniqueMap.values()));

            // --- 4. FETCH AVAILABLE GROUP SESSIONS ---
            // Fetch group appointments that are NOT private
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: publicApps } = await supabase
                .from('appointments')
                .select(`
                    *,
                    coach:coaches (full_name),
                    session:sessions (id, name, duration_minutes)
                `)
                .eq('type', 'group')
                .gte('start', thirtyDaysAgo.toISOString())
                .in('status', ['scheduled', 'confirmed'])
                .order('start', { ascending: true });

            const groupRegistrationMap = new Map((myRegisteredAppointments as any || [])
                .filter((r: any) => r.appointment)
                .map((r: any) => [r.appointment.id, r.status]));

            const formattedGroups: Appointment[] = (publicApps || []).map(a => ({
                id: a.id,
                title: a.title || a.session?.name || 'Session Group',
                start: new Date(a.start),
                end: new Date(new Date(a.start).getTime() + (a.duration || 60) * 60000),
                status: a.status,
                coach: a.coach,
                session: a.session,
                type: 'group',
                item_type: 'session',
                source: 'appointment',
                price: a.price,
                payment_method: a.payment_method,
                coach_id: a.coach_id,
                max_participants: a.max_participants,
                current_participants: a.current_participants || 0,
                registered: groupRegistrationMap.has(a.id) && groupRegistrationMap.get(a.id) !== 'cancelled',
                registrationStatus: groupRegistrationMap.get(a.id) as string | undefined
            }));

            setGroupSessions(formattedGroups);

        } catch (error: any) {
            console.error('Error fetching appointments:', error);
            Alert.alert('Erreur', error.message || 'Impossible de charger les rendez-vous');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!client?.id) return;

        fetchSessions();

        // Subscribe to real-time changes
        const sessionsSubscription = supabase
            .channel('agenda-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_sessions', filter: `client_id=eq.${client.id}` }, () => fetchSessions())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchSessions())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointment_registrations', filter: `client_id=eq.${client.id}` }, () => fetchSessions())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'session_registrations', filter: `client_id=eq.${client.id}` }, () => fetchSessions())
            .subscribe();

        return () => {
            supabase.removeChannel(sessionsSubscription);
        };
    }, [client?.id]);

    const handlePayment = async (appointmentId: string, coachId: string) => {
        if (!client?.id) return false;

        try {
            // 1. Fetch Payment Sheet params from Edge Function
            const { data, error } = await supabase.functions.invoke('create-native-payment-sheet', {
                body: { appointmentId, clientId: client.id, coachId }
            });

            if (error) throw error;

            // 2. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Coachency',
                customerId: data.customer,
                customerEphemeralKeySecret: data.ephemeralKey,
                paymentIntentClientSecret: data.paymentIntent,
                allowsDelayedPaymentMethods: false,
                defaultBillingDetails: {
                    name: client.full_name,
                    email: client.email,
                },
                returnURL: 'coachency://stripe-redirect', // Example deep link
            });

            if (initError) throw initError;

            // 3. Present Payment Sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    return false;
                }
                throw presentError;
            }

            return true;
        } catch (error: any) {
            console.error('Stripe Payment Error:', error);
            throw error;
        }
    };

    const handleRegister = async (sessionId: string, source: 'appointment' | 'scheduled_session') => {
        if (!client?.id) return;
        try {
            if (source === 'appointment') {
                const appointment = groupSessions.find(a => a.id === sessionId);

                // Online payment required: handle via Stripe, webhook does registration
                if (appointment?.payment_method === 'online' && appointment?.price > 0) {
                    const success = await handlePayment(sessionId, appointment.coach?.id || appointment.coach_id);
                    if (!success) return; // User cancelled or failed

                    // Poll for webhook confirmation instead of blind setTimeout
                    setLoading(true);
                    let confirmed = false;
                    for (let i = 0; i < 10; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        const { data: updated } = await supabase
                            .from('appointments')
                            .select('payment_status')
                            .eq('id', sessionId)
                            .single();
                        if (updated?.payment_status === 'completed') {
                            confirmed = true;
                            break;
                        }
                    }
                    if (!confirmed) {
                        Alert.alert('Info', 'Paiement en cours de traitement. Rafraîchissez dans quelques instants.');
                    }
                    await fetchSessions();
                    return;
                }

                // Free or in-person payment: direct registration
                if (!appointment) throw new Error('Appointment not found');
                const { error } = await supabase
                    .from('appointment_registrations')
                    .insert({
                        appointment_id: sessionId,
                        client_id: client.id,
                        status: 'registered'
                    });
                if (error) throw error;
            } else {
                // Fetch coach_id first
                const { data: sess } = await supabase.from('scheduled_sessions').select('coach_id').eq('id', sessionId).single();
                const { error } = await supabase
                    .from('session_registrations')
                    .insert({
                        scheduled_session_id: sessionId,
                        client_id: client.id,
                        coach_id: sess?.coach_id,
                        status: 'registered'
                    });
                if (error) throw error;
            }
            await fetchSessions();
        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Erreur', error.message || "Impossible de s'inscrire");
            throw error;
        }
    };

    const handleUnregister = async (sessionId: string, source: 'appointment' | 'scheduled_session') => {
        if (!client?.id) return;
        try {
            if (source === 'appointment') {
                const { error } = await supabase
                    .from('appointment_registrations')
                    .delete()
                    .match({ appointment_id: sessionId, client_id: client.id });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('session_registrations')
                    .delete()
                    .match({ scheduled_session_id: sessionId, client_id: client.id });
                if (error) throw error;
            }
            await fetchSessions();
        } catch (error: any) {
            console.error('Unregistration error:', error);
            Alert.alert('Erreur', error.message || 'Impossible de se désinscrire');
            throw error;
        }
    };

    return {
        loading,
        activeTab,
        setActiveTab,
        personalSessions,
        groupSessions,
        viewDate,
        weekDays,
        navigateWeek,
        refetch: fetchSessions,
        handleRegister,
        handleUnregister
    };
}
