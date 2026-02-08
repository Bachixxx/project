import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import fr from 'date-fns/locale/fr';
import { Users, User, Loader, X, Clock, FileText, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { TutorialCard } from '../../components/client/TutorialCard';
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
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
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
      const cacheKey = `appointments_data_${client.id}`;
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
          content: s.content
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

      // console.log('Formatted group sessions:', formattedGroupSessions);
      // console.log('Formatted appointments:', formattedAppointments);

      const allGroupSessions = [...formattedGroupSessions, ...formattedAppointments]
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      // console.log('All group sessions combined:', allGroupSessions);

      setGroupSessions(allGroupSessions);

      // 3. Update Cache
      localStorage.setItem(cacheKey, JSON.stringify({
        personal: uniqueSessions,
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

    // Handle special item types
    if (event.item_type === 'rest') {
      return; // No action for rest days for now
    }

    if (event.item_type === 'note') {
      setSelectedNote(event);
      return;
    }

    if (event.item_type === 'metric') {
      setSelectedMetric(event);
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

      <TutorialCard
        tutorialId="appointments_intro"
        title="Gérez votre agenda 📅"
        message="Réservez vos séances de coaching, consultez vos prochains créneaux et synchronisez-les avec votre agenda personnel."
        className="mb-8"
      />

      {
        loading && !personalSessions.length && !groupSessions.length ? (
          <div className="flex items-center justify-center p-12" >
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-4 w-full pb-20 md:pb-0">
            {/* Unified Responsive View */}
            <div className="col-span-1 xl:col-span-4 w-full space-y-4">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/5 mb-4 shadow-lg">
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
                                  <div className="flex items-center gap-1 text-emerald-400">
                                    {/* Using a simple text or icon here if CheckCircle is not imported, 
                                          but relying on existing imports. If check circle missing, just show text or nothing. 
                                          The original code had checkcircle. I'll omit it if I removed the import, 
                                          or simpler: just show the text 'Inscrit' if needed, or rely on the border color.
                                          Actually, I'll check imports. I removed CheckCircle. 
                                          I'll use a simple span or re-add the import if strictly necessary, 
                                          but for now I'll just skip the icon to pass build.
                                      */}
                                    <span className="text-xs">Inscrit</span>
                                  </div>
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


          </div>
        )
      }

      {
        isModalOpen && selectedSession && (
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
        )
      }

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onSave={handleUpdateSession}
        />
      )}

      {selectedMetric && (
        <MetricModal
          metric={selectedMetric}
          onClose={() => setSelectedMetric(null)}
          onSave={handleUpdateSession}
        />
      )}
    </div >
  );
}

const SessionModal = ({ session, exercises, loadingExercises, onClose, onRegister, onUnregister, onStartTraining, registering }: any) => {
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
                    {exercises.map((se: any, idx: number) => (
                      <div key={se.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <span className="flex-shrink-0 w-6 text-sm font-medium text-white/30 pt-0.5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{se.exercise?.name || 'Exercice'}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                            {se.exercise?.tracking_type === 'duration' ? (
                              <span className="text-white/70">{se.duration_seconds}s</span>
                            ) : se.exercise?.tracking_type === 'distance' ? (
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
                    ))}
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

const NoteModal = ({ note, onClose, onSave }: any) => {
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!note.content) {
      setContent(note.notes || "");
    } else if (typeof note.content === 'string') {
      setContent(note.content);
    } else {
      setContent(note.content.text || note.content.body || note.content.content || "");
    }
  }, [note]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(note.id, { text: content });
      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#0f172a] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl animate-scale-in p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              Note
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

        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mx-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border-none text-white/80 placeholder:text-white/20 focus:ring-0 resize-none min-h-[150px] leading-relaxed"
            placeholder="Écrivez votre note ici..."
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricModal = ({ metric, onClose, onSave }: any) => {
  const [value, setValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!metric.content) {
      setValue(metric.notes || "");
    } else if (typeof metric.content === 'string') {
      setValue(metric.content);
    } else {
      setValue(metric.content.value || metric.content.text || "");
    }
  }, [metric]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(metric.id, { value: value });
      onClose();
    } catch (error) {
      console.error("Error saving metric:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#0f172a] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl animate-scale-in p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Métrique
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{metric.title}</h2>
            <p className="text-sm text-white/50">
              {format(metric.start, 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-500/10 text-center">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-transparent border-b border-purple-500/30 text-center text-2xl font-bold text-white/90 placeholder:text-white/20 focus:ring-0 focus:border-purple-500 transition-colors py-2"
            placeholder="Ex: 75 kg"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAppointments;
