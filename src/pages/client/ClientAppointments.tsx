import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Users, User, Loader, X, Clock, DollarSign, FileText, Dumbbell, CheckCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripe';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: fr }),
  getDay,
  locales,
});

const formats = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: any) => {
    return `${format(start, 'HH:mm', { locale: fr })} - ${format(end, 'HH:mm', { locale: fr })}`;
  },
  selectRangeFormat: ({ start, end }: any) => {
    return `${format(start, 'HH:mm', { locale: fr })} - ${format(end, 'HH:mm', { locale: fr })}`;
  },
  dayRangeHeaderFormat: ({ start, end }: any) => {
    return `${format(start, 'dd MMM', { locale: fr })} - ${format(end, 'dd MMM', { locale: fr })}`;
  },
  dayHeaderFormat: (date: Date) => format(date, 'EEE dd MMM', { locale: fr }),
  dayFormat: (date: Date) => format(date, 'EEE dd MMM', { locale: fr }),
  monthHeaderFormat: (date: Date) => format(date, 'MMM yyyy', { locale: fr }),
  weekdayFormat: (date: Date) => format(date, 'EEE', { locale: fr }),
  timeRangeFormat: ({ start, end }: any) => {
    return `${format(start, 'HH:mm', { locale: fr })} - ${format(end, 'HH:mm', { locale: fr })}`;
  },
};

function ClientAppointments() {
  const { client } = useClientAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [personalSessions, setPersonalSessions] = useState([]);
  const [groupSessions, setGroupSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionExercises, setSessionExercises] = useState([]);
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
      setLoading(true);

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
        if (!s.session) {
          console.warn('Session data is null for scheduled_session:', s.id);
        }
        return {
          id: s.id,
          title: s.session?.name || 'Unknown Session',
          start: new Date(s.scheduled_date),
          end: new Date(new Date(s.scheduled_date).getTime() + (s.session?.duration_minutes || 60) * 60000),
          status: s.status,
          notes: s.notes,
          session: s.session,
          coach: s.coach,
          type: 'personal'
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
        (s: any) => ['group', 'group_public'].includes(s.session?.session_type)
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
          source: 'scheduled_session',
          registered: true
        }));
      }

      // Merge ALL: personal (1-on-1) + registered appointments + registered group sessions
      // Deduplicate by ID to be safe
      const allMySessions = [
        ...formattedPersonalSessions,
        ...formattedRegisteredAppointments,
        ...formattedRegisteredSessions
      ];

      const uniqueSessions = Array.from(new Map(allMySessions.map(item => [item.id, item])).values());

      setPersonalSessions(uniqueSessions);

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
        source: 'scheduled_session',
        registered: registrationMap.has(s.id),
        registrationStatus: registrationMap.get(s.id),
        max_participants: s.max_participants,
        current_participants: s.current_participants
      }));

      const formattedAppointments = (publicAppointments || []).map(a => ({
        id: a.id,
        title: a.title,
        start: new Date(a.start),
        end: new Date(new Date(a.start).getTime() + (a.duration || 60) * 60000),
        status: a.status,
        notes: a.notes,
        coach: a.coach,
        type: 'group',
        source: 'appointment',
        price: a.price,
        payment_method: a.payment_method,
        max_participants: a.max_participants,
        current_participants: a.current_participants || 0,
        registered: appointmentRegistrationMap.has(a.id) && appointmentRegistrationMap.get(a.id) !== 'cancelled',
        registrationStatus: appointmentRegistrationMap.get(a.id),
        session_id: a.session_id,
        session: a.session
      }));

      console.log('Formatted group sessions:', formattedGroupSessions);
      console.log('Formatted appointments:', formattedAppointments);

      const allGroupSessions = [...formattedGroupSessions, ...formattedAppointments]
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      console.log('All group sessions combined:', allGroupSessions);

      setGroupSessions(allGroupSessions);
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

      const { data, error } = await supabase
        .from('session_exercises')
        .select(`
          id,
          sets,
          reps,
          rest_time,
          instructions,
          order_index,
          exercise:exercises (
            id,
            name,
            description,
            category,
            equipment,
            tracking_type
          ),
          duration_seconds,
          distance_meters
        `)
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching session exercises:', error);
        throw error;
      }

      console.log('Fetched exercises:', data);
      setSessionExercises(data || []);
    } catch (error) {
      console.error('Error in fetchSessionExercises:', error);
      setSessionExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleSelectEvent = (event) => {
    console.log('Selected event:', event);
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
          .select('coach_id')
          .eq('id', sessionId)
          .maybeSingle();

        if (!scheduledSession) throw new Error('Session not found');

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

  const currentSessions = activeTab === 'personal' ? personalSessions : groupSessions;
  const upcomingSessions = currentSessions.filter(s => s.start > new Date()).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">Rendez-vous</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'personal'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mon calendrier
          </div>
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'group'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Séances de groupe
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-4 w-full">
          {/* Mobile View */}
          <div className="md:hidden col-span-1 space-y-4">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white font-medium">
                {format(weekDays[0], 'd MMM', { locale: fr })} - {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {weekDays.map((day) => {
                const dayEvents = currentSessions.filter(event =>
                  new Date(event.start).getDate() === day.getDate() &&
                  new Date(event.start).getMonth() === day.getMonth() &&
                  new Date(event.start).getFullYear() === day.getFullYear()
                ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <div key={day.toISOString()} className={`rounded-xl border ${isToday ? 'bg-white/5 border-blue-500/30' : 'bg-transparent border-transparent'}`}>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-white/60'}`}>
                        {format(day, 'EEEE d', { locale: fr })}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 px-2 pb-2">
                      {dayEvents.length > 0 ? (
                        dayEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            className={`p-3 rounded-lg border border-white/5 cursor-pointer transition-colors ${event.type === 'personal'
                              ? 'bg-blue-500/10 hover:bg-blue-500/20 border-l-4 border-l-blue-500'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-l-4 border-l-emerald-500'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-white text-sm">{event.title}</span>
                              {event.registered && (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/60">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                              </span>
                              {event.coach && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {event.coach.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        isToday && (
                          <div className="p-4 text-center text-sm text-white/40 italic">
                            Aucun événement aujourd'hui
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block xl:col-span-3 glass p-6 w-full rounded-2xl">
            <style>{`
          .rbc-calendar { font-family: 'Inter', system-ui, sans-serif; color: #a1a1aa; }
          
          /* Toolbar */
          .rbc-toolbar {
            padding: 12px 16px;
            margin-bottom: 0 !important;
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }
          .rbc-toolbar button { 
            color: #9ca3af !important; 
            border: none !important;
            background: transparent !important;
            font-weight: 500 !important;
            border-radius: 6px !important;
            padding: 6px 12px !important;
            font-size: 0.875rem !important;
            transition: all 0.2s;
          }
          .rbc-toolbar button:hover { 
            background: rgba(255,255,255,0.05) !important; 
            color: white !important; 
          }
          .rbc-toolbar button.rbc-active { 
            background: rgba(255,255,255,0.08) !important;
            color: white !important;
            box-shadow: none !important;
            font-weight: 600 !important;
          }
          
          /* Header (Days) */
          .rbc-header { 
            padding: 20px 0 12px 0 !important; 
            font-weight: 600; 
            color: #e4e4e7;
            background: transparent !important;
            border-bottom: none !important;
            border-left: none !important;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            text-align: center !important;
          }
          .rbc-header + .rbc-header { border-left: none !important; }
          .rbc-time-header-content { border-left: none !important; }
          .rbc-time-view { border: none !important; }
          .rbc-row.rbc-time-header-cell { border-bottom: 1px solid rgba(255,255,255,0.03) !important; }

          /* Grid & Cells */
          .rbc-day-bg { 
            background: transparent !important; 
            border-left: none !important; /* No vertical borders */
          }
          .rbc-time-content { border-top: none !important; }
          
          .rbc-timeslot-group { 
            border-bottom: 1px dashed rgba(255,255,255,0.05) !important; /* Extremely subtle dashed lines */
            min-height: 60px !important; 
          }
          
          /* Remove side borders in gutter */
          .rbc-time-gutter .rbc-timeslot-group { 
            border-right: none !important; 
            border-bottom: none !important; /* Clean gutter */
          }
          .rbc-time-gutter {
             border-right: 1px solid rgba(255,255,255,0.03) !important; /* Separator only for time labels */
          }
          
          .rbc-day-slot .rbc-time-slot { border-top: none !important; }
          
          /* Today Highlight */
          .rbc-day-slot.rbc-today { 
            background-color: rgba(59, 130, 246, 0.05) !important; /* Subtle blue tint for today column */
          }
          /* Highlight today's header text */
          .rbc-header.rbc-today {
            color: #3b82f6 !important;
          }
          
          /* Time Indicator */
          .rbc-current-time-indicator { 
            background-color: #ef4444 !important; 
            height: 1px !important;
            opacity: 0.8 !important;
          }
          .rbc-current-time-indicator::before {
            content: '';
            position: absolute;
            left: -4px;
            top: -3px;
            width: 7px;
            height: 7px;
            background-color: #ef4444;
            border-radius: 50%;
            z-index: 11;
          }
          
          /* Events */
          .rbc-event { 
            border-radius: 6px !important; 
            box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3) !important;
            border: none !important;
            margin: 0 6px !important; /* More space between events and "invisible" cols */
            width: calc(100% - 12px) !important;
          }
          .rbc-event-label { display: none !important; }
          
          /* Time labels */
          .rbc-time-gutter .rbc-timeslot-group {
            color: #52525b;
            font-size: 0.75rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Explicitly transparent containers to prevent "black bar" issues */
          .rbc-time-header, .rbc-time-header-content, .rbc-time-view {
             background: transparent !important;
          }
          
          /* AGGRESSIVELY Disable default hover effects */
          .rbc-day-slot:hover, 
          .rbc-day-bg:hover,
          .rbc-time-slot:hover,
          .rbc-timeslot-group:hover,
          .rbc-day-slot .rbc-time-slot:hover,
          .rbc-time-view:hover,
          .rbc-time-content:hover,
          .rbc-time-column:hover {
            background-color: transparent !important;
            background: transparent !important;
          }

          /* Ensure proper z-indexing and visibility */
          .rbc-time-header {
            z-index: 20 !important;
            position: relative; 
          }
          
          /* Just in case: force no background on all-day row if present */
          .rbc-allday-cell {
             display: none !important; /* Hide all-day row if not used or stylistically inconsistent */
          }
          
          /* Off Range */
          .rbc-off-range-bg { background: transparent !important; }
        `}</style>
            <BigCalendar
              localizer={localizer}
              events={currentSessions}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={['month', 'week', 'day']}
              defaultView="week"
              onSelectEvent={handleSelectEvent}
              className="text-white calendar-dark"
              formats={formats}
              messages={{
                allDay: 'Journée',
                previous: 'Précédent',
                next: 'Suivant',
                today: "Aujourd'hui",
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Heure',
                event: 'Événement',
                showMore: (total) => `+ ${total} événement${total > 1 ? 's' : ''}`,
                noEventsInRange: activeTab === 'personal'
                  ? "Aucune séance programmée dans cette période"
                  : "Aucune séance de groupe disponible dans cette période"
              }}
              min={new Date(0, 0, 0, 6, 0, 0)}
              max={new Date(0, 0, 0, 22, 0, 0)}
              slotPropGetter={(date) => {
                const hour = date.getHours();
                const isWorkingHour = hour >= 9 && hour < 18;
                return {
                  className: isWorkingHour ? '' : 'bg-black/20',
                  style: {
                    backgroundColor: isWorkingHour ? 'transparent' : 'rgba(0,0,0,0.2)'
                  }
                };
              }}
              eventPropGetter={(event) => ({
                className: `${event.type === 'personal' ? 'bg-blue-600/90' : 'bg-emerald-600/90'} backdrop-blur-md`,
                style: {
                  fontSize: '0.85rem',
                  padding: '6px 10px',
                  borderLeft: event.type === 'personal' ? '3px solid #60a5fa' : '3px solid #34d399'
                }
              })}
              components={{
                event: ({ event }: any) => (
                  <div className="w-full h-full flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {event.type === 'personal' ? <User className="w-3 h-3 text-blue-200" /> : <Users className="w-3 h-3 text-emerald-200" />}
                      <span className="font-semibold leading-tight truncate text-sm shadow-sm">{event.title}</span>
                    </div>
                    <div className="text-xs opacity-75 truncate pl-4.5">
                      {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </div>
                  </div>
                ),
              }}
            />
          </div>

          <div className="xl:col-span-1 space-y-4">
            <div className="glass-card p-6 h-full w-full">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {activeTab === 'personal' ? 'Prochaines séances' : 'Séances disponibles'}
              </h2>
              <div className="space-y-4 w-full">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectEvent(s)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-lg mb-3 w-full overflow-hidden cursor-pointer"
                    >
                      {s.type === 'personal' ? (
                        <User className="w-5 h-5 text-blue-300" />
                      ) : (
                        <Users className="w-5 h-5 text-green-300" />
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-white font-medium truncate">{s.title}</p>
                        <p className="text-white/60 text-sm truncate">
                          {format(s.start, 'dd/MM/yyyy HH:mm')}
                        </p>
                        {s.registered && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-300 mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Inscrit
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-white/60">
                    {activeTab === 'personal'
                      ? 'Aucune séance programmée'
                      : 'Aucune séance de groupe disponible'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedSession && (
        <SessionModal
          session={selectedSession}
          exercises={sessionExercises}
          loadingExercises={loadingExercises}
          onClose={() => {
            setIsModalOpen(false);
            setSessionExercises([]);
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
      )}
    </div>
  );
}

function SessionModal({ session, exercises, loadingExercises, onClose, onRegister, onUnregister, onStartTraining, registering }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-100';
      case 'completed':
        return 'bg-green-500/20 text-green-100';
      case 'cancelled':
        return 'bg-red-500/20 text-red-100';
      case 'registered':
        return 'bg-green-500/20 text-green-100';
      default:
        return 'bg-gray-500/20 text-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Planifié';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      case 'registered':
        return 'Inscrit';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              {session.type === 'personal' ? (
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="w-6 h-6 text-blue-300" />
                </div>
              ) : (
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{session.title}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(session.registered ? 'registered' : session.status)}`}>
                  {session.registered ? 'Inscrit' : getStatusText(session.status)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-white/60" />
              <div className="text-white">
                <div className="font-medium">
                  {format(session.start, 'EEEE dd MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-white/80">
                  {format(session.start, 'HH:mm')} - {format(session.end, 'HH:mm')}
                </div>
              </div>
            </div>

            {session.coach && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Votre coach</h3>
                <div className="space-y-2">
                  <div className="text-white">
                    <span className="font-medium">{session.coach.full_name}</span>
                  </div>
                  {session.coach.email && (
                    <div className="text-white/80 text-sm">
                      Email: {session.coach.email}
                    </div>
                  )}
                  {session.coach.phone && (
                    <div className="text-white/80 text-sm">
                      Téléphone: {session.coach.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {session.session && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Détails de la séance
                </h3>
                <div className="space-y-3">
                  {session.session.name && (
                    <h4 className="text-white font-semibold">{session.session.name}</h4>
                  )}
                  {session.session.description && (
                    <p className="text-white/90 text-sm">{session.session.description}</p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    <span className="px-3 py-1 bg-white/10 text-white rounded text-sm">
                      {session.session.duration_minutes} min
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-white rounded text-sm">
                      {session.session.difficulty_level}
                    </span>
                  </div>

                  <div className="mt-4">
                    {loadingExercises ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="w-5 h-5 text-white/60 animate-spin" />
                        <span className="ml-2 text-white/60 text-sm">Chargement des exercices...</span>
                      </div>
                    ) : exercises && exercises.length > 0 ? (
                      <>
                        <h4 className="text-sm font-medium text-white/80 mb-2">
                          Exercices ({exercises.length})
                        </h4>
                        <div className="space-y-2">
                          {exercises.map((se, idx) => (
                            <div key={se.id} className="bg-white/5 rounded p-3 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="text-white/60 font-medium">{idx + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{se.exercise?.name || 'Exercise'}</p>
                                  {se.exercise?.description && (
                                    <p className="text-white/60 text-xs mt-1">{se.exercise.description}</p>
                                  )}
                                  <div className="flex gap-3 mt-2 text-xs text-white/70">
                                    {se.exercise?.tracking_type === 'duration' ? (
                                      <span>{se.duration_seconds} secondes</span>
                                    ) : se.exercise?.tracking_type === 'distance' ? (
                                      <span>{se.distance_meters} mètres</span>
                                    ) : (
                                      <>
                                        <span>{se.sets} séries</span>
                                        <span>•</span>
                                        <span>{se.reps} reps</span>
                                      </>
                                    )}
                                    {se.rest_time > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{se.rest_time}s repos</span>
                                      </>
                                    )}
                                  </div>
                                  {se.instructions && (
                                    <p className="text-white/60 text-xs mt-2 italic">{se.instructions}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-white/60 text-sm py-2">Aucun exercice dans cette séance</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {session.notes && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-white/60" />
                  <h3 className="text-lg font-medium text-white">Notes</h3>
                </div>
                <p className="text-white/90 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-3 mt-8">
            <div className="flex gap-3">
              {session.type === 'personal' && session.status !== 'completed' && session.status !== 'cancelled' && (
                <button
                  onClick={onStartTraining}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Play className="w-5 h-5" />
                  Commencer l'entraînement
                </button>
              )}
              {session.type === 'group' && (
                <>
                  {session.registered && session.session_id && (
                    <button
                      onClick={onStartTraining}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg text-white font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Play className="w-5 h-5" />
                      Lancer la séance
                    </button>
                  )}

                  {session.registered ? (
                    <button
                      onClick={() => onUnregister(session.id)}
                      disabled={registering}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 rounded-lg text-white transition-colors"
                    >
                      {registering ? 'Désinscription...' : 'Se désinscrire'}
                    </button>
                  ) : (
                    session.start > new Date() && (
                      <button
                        onClick={() => onRegister(session.id)}
                        disabled={registering}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded-lg text-white transition-colors"
                      >
                        {registering ? 'Inscription...' : 'S\'inscrire'}
                      </button>
                    )
                  )}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientAppointments;
