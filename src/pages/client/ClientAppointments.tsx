import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Play, CheckCircle, X, FileText, Video, ExternalLink, Info, Dumbbell, Clock, User, Users, Activity, StickyNote, Moon, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripe';

function ClientAppointments() {
  const { client } = useClientAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [personalSessions, setPersonalSessions] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [exerciseGroups, setExerciseGroups] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + (direction === 'next' ? 7 : -7));
    setViewDate(newDate);
  };



  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { locale: fr, weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays(viewDate);

  useEffect(() => {
    if (client) {
      fetchSessions();
    }
  }, [client]);

  const fetchSessions = async () => {
    try {
      // 1. Try cache first
      const cacheKey = `appointments_data_v3_${client.id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const { personal, group } = JSON.parse(cachedData);

          const reviveDates = (sessions: any[]) => {
            if (!Array.isArray(sessions)) return [];
            return sessions.map(session => ({
              ...session,
              start: new Date(session.start),
              end: new Date(session.end)
            }));
          };

          const revivedPersonal = reviveDates(personal);
          const revivedGroup = reviveDates(group);

          setPersonalSessions(revivedPersonal);
          setGroupSessions(revivedGroup);

          // Check if we have data to show, if so, stop loading
          if (revivedPersonal.length > 0 || revivedGroup.length > 0) {
            setLoading(false);
          }
        } catch (e) {
          console.error("Error parsing appointments cache", e);
        }
      }

      // If no cache or cache empty, ensure loading is true
      if (!cachedData) setLoading(true);

      // 2. Network Fetch
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

      if (scheduledData && scheduledData.length > 0) {
        console.log('First session sample:', JSON.stringify(scheduledData[0], null, 2));
      }

      const formattedPersonalSessions = (scheduledData || []).map(s => {
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
          item_type: s.item_type || 'session',
          content: s.content,
          session_id: s.session_id
        };
      });

      setPersonalSessions(formattedPersonalSessions);

      const { data: availableGroupSessionsRaw, error: groupError } = await supabase
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
        .gte('scheduled_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_date', { ascending: true });

      if (groupError) throw groupError;

      // Filter in JS to avoid inner join RLS issues
      const availableGroupSessions = (availableGroupSessionsRaw || []).filter(
        (s: any) => ['group', 'group_public'].includes(s.session?.session_type) && !s.client_id
      );

      // --- FETCH REGISTERED APPOINTMENTS FOR "MY CALENDAR" ---
      const { data: myRegisteredAppointments, error: myRegAppsError } = await supabase
        .from('appointment_registrations')
        .select(`
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

      if (myRegAppsError) {
        console.error('Error fetching registered appointments:', myRegAppsError);
      }

      const formattedRegisteredAppointments = (myRegisteredAppointments || []).map((reg: any) => {
        const apt = reg.appointment;
        if (!apt) return null;
        return {
          id: apt.id,
          title: apt.title,
          start: new Date(apt.start),
          end: new Date(new Date(apt.start).getTime() + (apt.duration || 60) * 60000),
          status: apt.status,
          notes: apt.notes,
          coach: apt.coach,
          type: 'appointment_registration',
          session_id: apt.session_id,
          session: apt.session || { name: apt.title, duration_minutes: apt.duration },
          registered: true
        };
      })
        .filter(Boolean);

      // --- FETCH REGISTERED SCHEDULED SESSIONS (Group Sessions I joined) ---
      const { data: mySessionRegs, error: mySessRegError } = await supabase
        .from('session_registrations')
        .select('scheduled_session_id')
        .eq('client_id', client.id);

      if (mySessRegError) console.error('Error fetching session registrations:', mySessRegError);

      const registeredSessionIds = (mySessionRegs || []).map(r => r.scheduled_session_id);

      let formattedRegisteredSessions: any[] = [];

      if (registeredSessionIds.length > 0) {
        const { data: registeredSessionsData, error: regSessError } = await supabase
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
          .in('id', registeredSessionIds);

        if (regSessError) console.error('Error fetching registered sessions:', regSessError);

        formattedRegisteredSessions = (registeredSessionsData || []).map(s => ({
          id: s.id,
          title: s.session?.name || 'Unknown Session',
          start: new Date(s.scheduled_date),
          end: new Date(new Date(s.scheduled_date).getTime() + (s.session?.duration_minutes || 60) * 60000),
          status: s.status,
          notes: s.notes,
          session: s.session,
          coach: s.coach,
          type: 'group',
          item_type: 'session',
          source: 'scheduled_session',
          registered: true,
          session_id: s.session_id
        }));
      }

      // Merge ALL: personal (1-on-1) + registered appointments + registered group sessions
      // Deduplicate by ID to be safe
      const allMySessions = [
        ...formattedPersonalSessions,
        ...formattedRegisteredAppointments,
        ...formattedRegisteredSessions
      ];

      const currentPersonalSessions = Array.from(new Map(allMySessions.map(item => [item.id, item])).values());


      // --- END FETCH REGISTERED APPOINTMENTS ---

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: publicAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          coach:coaches (full_name, email, phone),
          session:sessions (
            id,
            name,
            description,
            duration_minutes,
            difficulty_level
          )
        `)
        .gte('start', thirtyDaysAgo.toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      const { data: myRegistrations, error: regError } = await supabase
        .from('session_registrations')
        .select('scheduled_session_id, status')
        .eq('client_id', client.id);

      if (regError) throw regError;

      const { data: myAppointmentRegistrations, error: appointmentRegError } = await supabase
        .from('appointment_registrations')
        .select('appointment_id, status')
        .eq('client_id', client.id);

      if (appointmentRegError) {
        console.error('Error fetching appointment registrations:', appointmentRegError);
      }

      const registrationMap = new Map(
        (myRegistrations || []).map(r => [r.scheduled_session_id, r.status])
      );

      const appointmentRegistrationMap = new Map(
        (myAppointmentRegistrations || []).map(r => [r.appointment_id, r.status])
      );

      const formattedGroupSessions = (availableGroupSessions || []).map(s => ({
        id: s.id,
        title: s.session.name,
        start: new Date(s.scheduled_date),
        end: new Date(new Date(s.scheduled_date).getTime() + s.session.duration_minutes * 60000),
        status: s.status,
        notes: s.notes,
        session: s.session,
        coach: s.coach,
        type: 'group',
        item_type: 'session',
        source: 'scheduled_session',
        registered: registrationMap.has(s.id),
        registrationStatus: registrationMap.get(s.id),
        max_participants: s.max_participants,
        current_participants: s.current_participants,
        session_id: s.session_id
      }));

      const formattedPublicGroups: any[] = [];
      const formattedMyPrivateApps: any[] = [];

      (publicAppointments || []).forEach(a => {
        const isMyPrivate = a.client_id === client.id && a.type === 'private';
        const mapped = {
          id: a.id,
          title: a.title,
          start: new Date(a.start),
          end: new Date(new Date(a.start).getTime() + (a.duration || 60) * 60000),
          status: a.status,
          notes: a.notes,
          coach: a.coach,
          type: isMyPrivate ? 'personal' : 'group',
          item_type: 'session',
          source: 'appointment',
          price: a.price,
          payment_method: a.payment_method,
          payment_status: a.payment_status,
          payment_link: a.payment_link,
          max_participants: a.max_participants,
          current_participants: a.current_participants || 0,
          registered: appointmentRegistrationMap.has(a.id) && appointmentRegistrationMap.get(a.id) !== 'cancelled',
          registrationStatus: appointmentRegistrationMap.get(a.id),
          session_id: a.session_id,
          session: a.session
        };

        if (isMyPrivate) {
          formattedMyPrivateApps.push(mapped);
        } else if (a.type === 'group') {
          formattedPublicGroups.push(mapped);
        }
      });

      const allPersonalMerged = [...currentPersonalSessions, ...formattedMyPrivateApps];

      const uniquePersonalSessionsMap = new Map();
      allPersonalMerged.forEach(item => {
        // Create a unique key using session_id and exact start time. If session_id is missing, fallback to title and time.
        const key = `${item.session_id || item.title}-${item.start.getTime()}`;
        if (!uniquePersonalSessionsMap.has(key)) {
          uniquePersonalSessionsMap.set(key, item);
        }
      });
      const uniquePersonalSessions = Array.from(uniquePersonalSessionsMap.values());
      setPersonalSessions(uniquePersonalSessions);

      const allGroupSessions = [...formattedGroupSessions, ...formattedPublicGroups]
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      setGroupSessions(allGroupSessions);

      // 3. Update Cache
      localStorage.setItem(cacheKey, JSON.stringify({
        personal: uniquePersonalSessions,
        group: allGroupSessions,
        timestamp: new Date().getTime()
      }));

    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionExercises = async (sessionId: string) => {
    try {
      setLoadingExercises(true);
      console.log('Fetching exercises for session:', sessionId);

      const [exercisesRes, groupsRes] = await Promise.all([
        supabase
          .from('session_exercises')
          .select(`
            id,
            sets,
            reps,
            rest_time,
            instructions,
            order_index,
            group_id,
            exercise:exercises (
              id,
              name,
              description,
              category,
              equipment,
              tracking_type,
              track_reps,
              track_weight,
              track_duration,
              track_distance
            ),
            duration_seconds,
            distance_meters
          `)
          .eq('session_id', sessionId)
          .order('order_index', { ascending: true }),
        supabase
          .from('exercise_groups')
          .select('*')
          .eq('session_id', sessionId)
          .order('order_index', { ascending: true })
      ]);

      if (exercisesRes.error) {
        console.error('Error fetching session exercises:', exercisesRes.error);
        throw exercisesRes.error;
      }
      if (groupsRes.error) {
        console.error('Error fetching exercise groups:', groupsRes.error);
        throw groupsRes.error;
      }

      console.log('Fetched exercises:', exercisesRes.data);
      setSessionExercises(exercisesRes.data || []);
      setExerciseGroups(groupsRes.data || []);
    } catch (error) {
      console.error('Error in fetchSessionExercises:', error);
      setSessionExercises([]);
      setExerciseGroups([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleSelectEvent = async (event) => {
    console.log('Selected event:', event);

    // Handle special item types
    if (event.item_type === 'rest') {
      return; // No action for rest days for now
    }

    if (event.item_type === 'note') {
      setSelectedNote(event);
      return;
    }

    if (event.item_type === 'metric') {
      navigate('/client/body-composition');
      return;
    }

    // Gate: if online payment required but not completed, create checkout session
    if (event.payment_method === 'online' && event.price > 0 && event.payment_status !== 'completed') {
      try {
        setRegistering(true);
        await createCheckoutSession(undefined, client.id, event.id);
        // Redirect happens automatically via Stripe
      } catch (error: any) {
        console.error('Payment initialization error:', error);
        alert(error.message || 'Erreur lors de l\'initialisation du paiement');
      } finally {
        setRegistering(false);
      }
      return;
    }

    // Default: Session/Workout logic
    console.log('Session ID to fetch exercises:', event.session?.id);
    setSelectedSession(event);
    setIsModalOpen(true);
    if (event.session?.id) {
      fetchSessionExercises(event.session.id);
    } else {
      console.warn('No session ID found in event:', event);
    }
  };

  const handleRegister = async (sessionId) => {
    try {
      setRegistering(true);

      if (selectedSession.source === 'appointment') {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('coach_id, current_participants, max_participants, payment_method, price')
          .eq('id', sessionId)
          .limit(1);

        const appointment = appointments?.[0];

        if (!appointment) throw new Error('Appointment not found');

        if (appointment.current_participants >= appointment.max_participants) {
          alert('Cette séance est complète');
          return;
        }

        // Handle online payment via Stripe
        if (appointment.payment_method === 'online' && appointment.price > 0) {
          try {
            await createCheckoutSession(undefined, client.id, sessionId);
            return; // Exit here, redirection will happen
          } catch (error: any) {
            console.error('Payment initialization error:', error);
            alert(error.message || 'Erreur lors de l\'initialisation du paiement');
            return;
          }
        }

        const { error: regError } = await supabase
          .from('appointment_registrations')
          .insert({
            appointment_id: sessionId,
            client_id: client.id,
            status: 'registered'
          });

        if (regError) throw regError;

        const { error: updateError } = await supabase
          .from('appointments')
          .update({ current_participants: appointment.current_participants + 1 })
          .eq('id', sessionId);

        if (updateError) throw updateError;
      } else {
        const { data: scheduledSession } = await supabase
          .from('scheduled_sessions')
          .select('coach_id, payment_method, price')
          .eq('id', sessionId)
          .maybeSingle();

        if (!scheduledSession) throw new Error('Session not found');

        // Handle online payment for scheduled sessions
        if (scheduledSession.payment_method === 'online' && scheduledSession.price > 0) {
          try {
            await createCheckoutSession(undefined, client.id, sessionId);
            return; // Redirect to Stripe
          } catch (error: any) {
            console.error('Payment initialization error:', error);
            alert(error.message || 'Erreur lors de l\'initialisation du paiement');
            return;
          }
        }

        const { error } = await supabase
          .from('session_registrations')
          .insert({
            scheduled_session_id: sessionId,
            client_id: client.id,
            coach_id: scheduledSession.coach_id,
            status: 'registered'
          });

        if (error) throw error;
      }

      await fetchSessions();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error registering for session:', error);
      alert('Erreur lors de l\'inscription à la séance');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async (sessionId) => {
    try {
      setRegistering(true);

      if (selectedSession.source === 'appointment') {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('current_participants')
          .eq('id', sessionId)
          .limit(1);

        const appointment = appointments?.[0];

        if (!appointment) throw new Error('Appointment not found');

        const { error: deleteError } = await supabase
          .from('appointment_registrations')
          .delete()
          .eq('appointment_id', sessionId)
          .eq('client_id', client.id);

        if (deleteError) throw deleteError;

        const { error: updateError } = await supabase
          .from('appointments')
          .update({ current_participants: Math.max(0, appointment.current_participants - 1) })
          .eq('id', sessionId);

        if (updateError) throw updateError;
      } else {
        const { error } = await supabase
          .from('session_registrations')
          .delete()
          .eq('scheduled_session_id', sessionId)
          .eq('client_id', client.id);

        if (error) throw error;
      }

      await fetchSessions();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error unregistering from session:', error);
      alert('Erreur lors de la désinscription');
    } finally {
      setRegistering(false);
    }
  };

  const handleUpdateSession = async (sessionId: string, newContent: any) => {
    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ content: newContent })
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh sessions to show updated data
      await fetchSessions();

    } catch (error) {
      console.error('Error updating session:', error);
      throw error; // Re-throw for modal to handle
    }
  };

  const currentSessions = activeTab === 'personal' ? personalSessions : groupSessions;


  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden">

      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-teal-600/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Massive Background Image (Native Hero Vibe) */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[30%] pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20 pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

        {/* Floating Title Container */}
        <div className="absolute top-24 left-0 right-0 px-6 z-10 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
              Planning
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase text-shadow-lg mb-2">AGENDA</h1>
          <p className="text-slate-300 text-sm font-medium">Gérez vos inscriptions</p>
        </div>
      </div>

      {/* The Native "Sheet" Content Container */}
      <div className="relative z-20 mt-[30vh] bg-slate-950 rounded-t-[3rem] px-4 pt-8 pb-32 min-h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 flex flex-col">

        {/* Segmented Control Tabs */}
        <div className="px-4 md:px-8 mb-6 max-w-3xl mx-auto flex justify-center w-full z-40">
          <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-full">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'personal'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'personal' ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Mon calendrier</span>
              <span className="sm:hidden">Privé</span>
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'group'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'group' ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Séances collectives</span>
              <span className="sm:hidden">Groupe</span>
            </button>
          </div>
        </div>

        {/* Week Navigation - Sticky Inside Sheet */}
        <div className="sticky top-[72px] md:top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 py-4 w-full">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-white font-bold text-lg capitalize">
                {format(weekDays[0], 'MMMM yyyy', { locale: fr })}
              </span>
              <div className="flex items-center gap-2 text-xs text-white/50 font-medium uppercase tracking-wide">
                <span>Semaine {format(weekDays[0], 'w')}</span>
              </div>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full py-8 relative z-10">

          {/* Tutorial Card */}
          {/* <TutorialCard
          tutorialId="appointments_intro"
          title="Gérez votre agenda 📅"
          message="Réservez vos séances de coaching, consultez vos prochains créneaux et synchronisez-les avec votre agenda personnel."
          className="mb-8"
        /> */}

          {
            loading && !personalSessions.length && !groupSessions.length ? (
              <div className="flex items-center justify-center p-12" >
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : (
              <div className="space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent hidden md:block" />

                {weekDays.map((day, dayIndex) => {
                  const dayEvents = currentSessions.filter(event =>
                    new Date(event.start).getDate() === day.getDate() &&
                    new Date(event.start).getMonth() === day.getMonth() &&
                    new Date(event.start).getFullYear() === day.getFullYear()
                  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                  const isToday = new Date().toDateString() === day.toDateString();
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <div key={day.toISOString()} className={`relative ${dayEvents.length === 0 && !isToday ? 'opacity-50' : 'opacity-100'}`}>

                      {/* Day Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 
                        ${isToday ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/40' :
                            dayEvents.length > 0 ? 'bg-[#0f172a] border-white/20 text-white' : 'bg-[#0f172a] border-white/10 text-white/40'}
                      `}>
                          <span className="text-sm font-bold">{format(day, 'd')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold capitalize ${isToday ? 'text-blue-400' : 'text-white/80'}`}>
                            {format(day, 'EEEE', { locale: fr })}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs text-white/40">
                              {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Events List */}
                      <div className="ml-14 space-y-3">
                        {dayEvents.length > 0 ? (
                          dayEvents.map(event => {
                            let themeColor = 'blue';
                            let icon = <Dumbbell className="w-6 h-6" />;
                            let badgeText = 'Personnel';

                            if (event.item_type === 'note') {
                              themeColor = 'amber';
                              icon = <StickyNote className="w-6 h-6" />;
                              badgeText = 'Note';
                            } else if (event.item_type === 'rest') {
                              themeColor = 'indigo';
                              icon = <Moon className="w-6 h-6" />;
                              badgeText = 'Repos';
                            } else if (event.item_type === 'metric') {
                              themeColor = 'green';
                              icon = <Activity className="w-6 h-6" />;
                              badgeText = 'Biométrie';
                            } else if (event.type === 'group') {
                              themeColor = 'emerald';
                              icon = <Users className="w-6 h-6" />;
                              badgeText = 'Groupe';
                            }

                            return (
                              <div
                                key={event.id}
                                onClick={() => handleSelectEvent(event)}
                                className={`relative group bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-${themeColor}-500/30 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-4 overflow-hidden cursor-pointer border-t-white/10`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>

                                <div className="flex items-center gap-4 relative z-10">
                                  {/* Left Icon/Thumbnail Widget */}
                                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border backdrop-blur-md
                                  bg-${themeColor}-500/10 border-${themeColor}-500/30 text-${themeColor}-400 group-hover:shadow-[0_0_15px_rgba(var(--tw-colors-${themeColor}-500),0.3)] transition-shadow`}
                                  >
                                    {icon}
                                  </div>

                                  {/* Center Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[10px] uppercase font-bold tracking-wider text-${themeColor}-400`}>
                                        {badgeText}
                                      </span>
                                      {event.item_type === 'session' && (
                                        <span className="text-white/40 text-xs flex items-center gap-1 font-medium">
                                          <Clock className="w-3 h-3" />
                                          {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className={`text-base font-bold text-white truncate group-hover:text-${themeColor}-300 transition-colors`}>
                                      {event.title}
                                    </h4>
                                    {event.coach && event.item_type === 'session' && (
                                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                        Par {event.coach.full_name}
                                      </p>
                                    )}
                                  </div>

                                  {/* Right Action Icon */}
                                  <div className="flex-shrink-0 flex items-center justify-center">
                                    {event.item_type === 'metric' ? (
                                      <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                                        <CheckCircle className="w-5 h-5" />
                                      </div>
                                    ) : (event.registered || event.type === 'personal') && event.item_type === 'session' ? (
                                      <div className={`p-2.5 rounded-full bg-${themeColor}-500/20 text-${themeColor}-400 shadow-lg shadow-${themeColor}-500/10`}>
                                        <Play className="w-5 h-5 fill-current" />
                                      </div>
                                    ) : event.item_type !== 'session' ? (
                                      <div className={`p-2 rounded-full text-${themeColor}-400/50 group-hover:bg-${themeColor}-500/10 group-hover:text-${themeColor}-400 transition-colors`}>
                                        <ChevronRight className="w-5 h-5" />
                                      </div>
                                    ) : (
                                      <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80 uppercase tracking-wider">
                                        Infos
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          isToday && (
                            <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-sm">
                              Aucun événement prévu aujourd'hui
                            </div>
                          )
                        )}

                        {/* Spacer for empty days to maintain rhythm but take less space */}
                        {dayEvents.length === 0 && !isToday && <div className="h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }

        </div>

        {
          isModalOpen && selectedSession && (
            <SessionModal
              session={selectedSession}
              exercises={sessionExercises}
              groups={exerciseGroups}
              loadingExercises={loadingExercises}
              onClose={() => {
                setIsModalOpen(false);
                setSessionExercises([]);
                setExerciseGroups([]);
              }}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              onStartTraining={() => {
                if (selectedSession.source === 'appointment') {
                  navigate(`/client/live-workout/appointment/${selectedSession.id}`);
                } else {
                  navigate(`/client/live-workout/${selectedSession.id}`);
                }
              }}
              registering={registering}
            />
          )
        }

        {selectedNote && (
          <NoteModal
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
            onSave={handleUpdateSession}
          />
        )}


      </div>
    </div>
  );
}

const SessionModal = ({ session, exercises, groups, loadingExercises, onClose, onRegister, onUnregister, onStartTraining, registering }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-100 border border-blue-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-100 border border-red-500/30';
      case 'registered': return 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-100 border border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'registered': return 'Inscrit';
      default: return status;
    }
  };

  const isPersonal = session.type === 'personal';
  const accentColor = isPersonal ? 'blue' : 'emerald';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-white/10 shadow-2xl animate-scale-in">

        {/* Header Hero */}
        <div className={`relative p-6 pb-8 overflow-hidden`}>
          {/* Decorative background gradient */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-${accentColor}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

          <div className="flex justify-between items-start z-10 relative">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(session.registered ? 'registered' : session.status)}`}>
                {session.registered ? 'Inscrit' : getStatusText(session.status)}
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">{session.title}</h2>
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="w-4 h-4" />
                <span className="text-lg">
                  {format(session.start, 'EEEE d MMMM', { locale: fr })}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-lg font-medium text-white">
                  {format(session.start, 'HH:mm')} - {format(session.end, 'HH:mm')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-8">

          {/* Compact Coach Section */}
          {session.coach && (
            <div className="flex items-center justify-between py-4 border-t border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-${accentColor}-500/20 flex items-center justify-center border border-${accentColor}-500/30`}>
                  <User className={`w-5 h-5 text-${accentColor}-300`} />
                </div>
                <div>
                  <p className="text-sm text-white/50 font-medium">Votre coach</p>
                  <p className="text-white font-medium">{session.coach.full_name}</p>
                </div>
              </div>
              {/* Optional: Add quick action buttons here if needed later (call, mail) */}
            </div>
          )}

          {/* Session Details */}
          {session.session && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Programme</h3>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/70">
                    {session.session.duration_minutes} min
                  </span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/70">
                    {session.session.difficulty_level}
                  </span>
                </div>
              </div>

              {session.session.description && (
                <p className="text-white/60 text-sm leading-relaxed">{session.session.description}</p>
              )}

              {/* Exercises List */}
              <div className="mt-4">
                {loadingExercises ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-5 h-5 text-white/40 animate-spin" />
                  </div>
                ) : exercises && exercises.length > 0 ? (
                  <div className="space-y-1">
                    {(() => {
                      const standalone = (exercises || []).filter((e: any) => !e.group_id);
                      const grouped = (groups || []).map((g: any) => ({
                        ...g,
                        exercises: (exercises || []).filter((e: any) => e.group_id === g.id).sort((a: any, b: any) => a.order_index - b.order_index)
                      })).filter((g: any) => g.exercises.length > 0);

                      const allBlocks = [
                        ...grouped,
                        ...standalone.map((e: any) => ({ type: 'standalone', order_index: e.order_index, exercise: e, id: `standalone-${e.id}` }))
                      ].sort((a: any, b: any) => a.order_index - b.order_index);

                      return allBlocks.map((block: any, blockIdx: number) => {
                        if (block.type === 'standalone') {
                          const se = block.exercise;
                          return (
                            <div key={block.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                              <span className="flex-shrink-0 w-6 text-sm font-medium text-white/30 pt-0.5">{blockIdx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{se.exercise?.name || 'Exercice'}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                                  {se.exercise?.track_duration || se.exercise?.tracking_type === 'duration' ? (
                                    <span className="text-white/70">
                                      {se.duration_seconds ? `${Math.floor(se.duration_seconds / 60)}m ${se.duration_seconds % 60}s` : 'Durée libre'}
                                    </span>
                                  ) : se.exercise?.track_distance || se.exercise?.tracking_type === 'distance' ? (
                                    <span className="text-white/70">{se.distance_meters}m</span>
                                  ) : (
                                    <span className="text-white/70">{se.sets} séries × {se.reps} reps</span>
                                  )}
                                  {se.rest_time > 0 && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                      <span>{se.rest_time}s repos</span>
                                    </>
                                  )}
                                </div>
                                {se.instructions && (
                                  <p className="text-white/40 text-xs mt-1.5 line-clamp-2">{se.instructions}</p>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={`group-${block.id}`} className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-2 mt-2 group relative overflow-hidden">
                              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                  <span className="text-white/30 text-sm font-medium">{blockIdx + 1}.</span>
                                  {block.name || 'Bloc'}
                                </h4>
                                <div className="flex gap-2">
                                  {block.type === 'circuit' && block.repetitions > 1 && (
                                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                      {block.repetitions} Tours
                                    </span>
                                  )}
                                  {block.type === 'amrap' && (
                                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                                      AMRAP {Math.floor((block.duration_seconds || 0) / 60)} min
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                {block.exercises.map((se: any, idx: number) => (
                                  <div key={`g-ex-${se.id}`} className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex-shrink-0 w-6 flex items-center justify-center">
                                      <span className="text-sm font-medium text-white/20 pt-0.5">{String.fromCharCode(97 + idx)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white/90 text-sm font-medium truncate">{se.exercise?.name || 'Exercice'}</p>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                                        {se.exercise?.track_duration || se.exercise?.tracking_type === 'duration' ? (
                                          <span className="text-white/70">
                                            {se.duration_seconds ? `${Math.floor(se.duration_seconds / 60)}m ${se.duration_seconds % 60}s` : 'Durée libre'}
                                          </span>
                                        ) : se.exercise?.track_distance || se.exercise?.tracking_type === 'distance' ? (
                                          <span className="text-white/70">{se.distance_meters}m</span>
                                        ) : (
                                          <span className="text-white/70">{block.type === 'circuit' || block.type === 'amrap' ? `${se.reps} reps` : `${se.sets} séries × ${se.reps} reps`}</span>
                                        )}
                                        {se.rest_time > 0 && (
                                          <>
                                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                            <span>{se.rest_time}s repos</span>
                                          </>
                                        )}
                                      </div>
                                      {se.instructions && (
                                        <p className="text-white/40 text-[10px] sm:text-xs mt-1 line-clamp-2">{se.instructions}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                    <p className="text-white/40 text-sm">Aucun exercice détaillé</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {session.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h3>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm text-white/80 leading-relaxed">
                {session.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-4 border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-xl flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Fermer
          </button>

          {session.type === 'personal' && session.status !== 'completed' && session.status !== 'cancelled' && (
            <button
              onClick={onStartTraining}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Commencer
            </button>
          )}

          {session.type === 'group' && (
            <>
              {session.registered && session.session_id && (
                <button
                  onClick={onStartTraining}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Lancer
                </button>
              )}

              {session.registered ? (
                <button
                  onClick={() => onUnregister(session.id)}
                  disabled={registering}
                  className="px-6 py-2.5 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-sm font-medium rounded-xl transition-all"
                >
                  {registering ? '...' : 'Se désinscrire'}
                </button>
              ) : (
                session.start > new Date() && (
                  <button
                    onClick={() => onRegister(session.id)}
                    disabled={registering}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {registering ? '...' : "S'inscrire"}
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const NoteModal = ({ note, onClose }: any) => {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!note.content) {
      setContent(note.notes || "");
    } else if (typeof note.content === 'string') {
      setContent(note.content);
    } else {
      setContent(note.content.text || note.content.body || note.content.content || "");
    }
  }, [note]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#0f172a] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl animate-scale-in p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Note du Coach
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{note.title}</h2>
            <p className="text-sm text-white/50">
              {format(note.start, 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10 min-h-[150px]">
          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
            {content || note.notes}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAppointments;
