import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addMinutes from 'date-fns/addMinutes';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Plus,
  X,
  User,
  Users,
  Clock,
  CreditCard,
  Banknote,
  Copy,
  QrCode,
  Link as LinkIcon,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import { createAppointmentPaymentLink } from '../lib/stripe';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: fr }),
  getDay,
  locales,
});

const messages = {
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
  noEventsInRange: 'Aucun événement dans cette période',
  showMore: (total: number) => `+ ${total} événement${total > 1 ? 's' : ''}`,
};

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

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
}

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  duration: number;
  client_id: string | null;
  type: 'private' | 'group';
  max_participants: number;
  current_participants: number;
  status: string;
  notes: string;
  price: number;
  payment_method?: string;
  payment_link?: string;
  payment_status?: string;
  group_visibility?: 'public' | 'private';
}

function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('coach_id', user?.id);

      if (appointmentsError) throw appointmentsError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, full_name, email, phone')
        .eq('coach_id', user?.id)
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      setAppointments(
        (appointmentsData || []).map(apt => ({
          ...apt,
          start: new Date(apt.start),
          end: new Date(apt.end),
        }))
      );
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: any) => {
    setSelectedAppointment(null);
    setSelectedSlot({ start, end });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: Appointment) => {
    setSelectedAppointment(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-[2560px] mx-auto animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{t('calendar.title')}</h1>
          <p className="text-gray-400">Gérez votre emploi du temps et vos séances</p>
        </div>
        <button
          onClick={() => {
            setSelectedAppointment(null);
            setIsModalOpen(true);
          }}
          className="primary-button flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          {t('calendar.newSession')}
        </button>
      </div>

      <div className="glass p-0 flex-1 overflow-hidden flex flex-col rounded-2xl shadow-xl border border-white/5 bg-zinc-900">
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
          events={appointments}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          defaultView="week"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          className="calendar-dark"
          messages={messages}
          formats={formats}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          slotPropGetter={(date) => {
            const hour = date.getHours();
            const isWorkingHour = hour >= 9 && hour < 18;
            return {
              /* Ensure the base class has !important to override any library defaults */
              className: isWorkingHour ? '' : 'bg-black/20',
              style: {
                backgroundColor: isWorkingHour ? 'transparent' : 'rgba(0,0,0,0.2)'
              }
            };
          }}
          eventPropGetter={(event: Appointment) => ({
            className: `${event.type === 'private' ? 'bg-blue-600/90' : 'bg-emerald-600/90'} backdrop-blur-md`,
            style: {
              fontSize: '0.85rem',
              padding: '6px 10px',
              borderLeft: event.type === 'private' ? '3px solid #60a5fa' : '3px solid #34d399'
            }
          })}
          components={{
            event: ({ event }: any) => (
              <div className="w-full h-full flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {event.type === 'private' ? <User className="w-3 h-3 text-blue-200" /> : <Users className="w-3 h-3 text-emerald-200" />}
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

      {isModalOpen && (
        <AppointmentModal
          appointment={selectedAppointment}
          selectedSlot={selectedSlot}
          clients={clients}
          onClose={() => setIsModalOpen(false)}
          onSave={async (appointmentData: any) => {
            try {
              const formattedData = {
                title: appointmentData.title,
                start: appointmentData.start.toISOString(),
                duration: appointmentData.duration,
                client_id: appointmentData.type === 'private' ? appointmentData.client_id : null,
                type: appointmentData.type,
                group_visibility: appointmentData.type === 'group' ? appointmentData.group_visibility : null,
                max_participants: appointmentData.type === 'group' && appointmentData.group_visibility === 'public' ? appointmentData.max_participants : null,
                current_participants: appointmentData.current_participants,
                status: appointmentData.status,
                notes: appointmentData.notes,
                price: appointmentData.price,
                payment_method: appointmentData.payment_method,
                payment_status: 'pending',
                coach_id: user?.id,
              };

              if (selectedAppointment) {
                const { error } = await supabase
                  .from('appointments')
                  .update(formattedData)
                  .eq('id', selectedAppointment.id);

                if (error) throw error;

                if (appointmentData.type === 'group' && appointmentData.group_visibility === 'private') {
                  await supabase
                    .from('appointment_participants')
                    .delete()
                    .eq('appointment_id', selectedAppointment.id);

                  if (appointmentData.selectedClients?.length > 0) {
                    const participants = appointmentData.selectedClients.map((clientId: string) => ({
                      appointment_id: selectedAppointment.id,
                      client_id: clientId,
                      status: 'invited'
                    }));
                    await supabase.from('appointment_participants').insert(participants);
                  }
                }
              } else {
                const { data: newAppointment, error } = await supabase
                  .from('appointments')
                  .insert([formattedData])
                  .select()
                  .single();

                if (error) throw error;

                if (appointmentData.type === 'group' && appointmentData.group_visibility === 'private' && appointmentData.selectedClients?.length > 0) {
                  const participants = appointmentData.selectedClients.map((clientId: string) => ({
                    appointment_id: newAppointment.id,
                    client_id: clientId,
                    status: 'invited'
                  }));
                  await supabase.from('appointment_participants').insert(participants);
                }
              }

              fetchData();
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error saving appointment:', error);
            }
          }}
        />
      )}
    </div>
  );
}

function AppointmentModal({ appointment, selectedSlot, clients, onClose, onSave }: any) {
  const getValidDate = (dateValue: any) => {
    if (!dateValue) {
      return selectedSlot?.start || new Date();
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? (selectedSlot?.start || new Date()) : date;
  };

  const [formData, setFormData] = useState({
    title: appointment?.title || '',
    start: getValidDate(appointment?.start),
    duration: appointment?.duration || 60,
    client_id: appointment?.client_id || '',
    type: appointment?.type || 'private',
    group_visibility: appointment?.group_visibility || 'public',
    max_participants: appointment?.max_participants || 5,
    current_participants: appointment?.current_participants || 1,
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || '',
    price: appointment?.price || 0,
    payment_method: appointment?.payment_method || 'in_person',
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [registeredParticipants, setRegisteredParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [paymentLink, setPaymentLink] = useState(appointment?.payment_link || '');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appointment?.id && appointment?.type === 'group') {
      fetchRegisteredParticipants();
    }
    if (appointment?.payment_link) {
      setPaymentLink(appointment.payment_link);
    }
  }, [appointment?.id, appointment?.payment_link]);

  const fetchRegisteredParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const { data, error } = await supabase
        .from('appointment_registrations')
        .select(`
          id,
          status,
          registered_at,
          client:clients (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('appointment_id', appointment.id)
        .in('status', ['registered', 'confirmed']);

      if (error) throw error;
      setRegisteredParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, selectedClients });
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleGeneratePaymentLink = async () => {
    if (!appointment?.id) return;

    try {
      setGeneratingLink(true);
      const result = await createAppointmentPaymentLink(appointment.id);
      setPaymentLink(result.url);
    } catch (error: any) {
      console.error('Error generating payment link:', error);
      const errorMessage = error?.message || 'Erreur lors de la génération du lien de paiement';
      alert(errorMessage);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {appointment ? 'Modifier la séance' : 'Nouvelle séance'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Ex: Séance Jambes, Yoga..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Début</label>
                <input
                  type="datetime-local"
                  name="start"
                  value={formData.start ? format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    start: new Date(e.target.value)
                  }))}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Durée</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="30" className="bg-gray-800">30 minutes</option>
                  <option value="45" className="bg-gray-800">45 minutes</option>
                  <option value="60" className="bg-gray-800">1 heure</option>
                  <option value="90" className="bg-gray-800">1 heure 30</option>
                  <option value="120" className="bg-gray-800">2 heures</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type de séance</label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-black/20 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'private' }));
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'private' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    Privée
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'group', client_id: '' }));
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'group' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    Groupe
                  </button>
                </div>
              </div>

              {formData.type === 'private' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    required={formData.type === 'private'}
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id} className="bg-gray-800">
                        {client.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Visibilité</label>
                  <select
                    name="group_visibility"
                    value={formData.group_visibility}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value === 'public') {
                        setSelectedClients([]);
                      }
                    }}
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="public" className="bg-gray-800">Public (ouvert à tous)</option>
                    <option value="private" className="bg-gray-800">Privé (sur invitation)</option>
                  </select>
                </div>
              )}
            </div>

            {formData.type === 'group' && formData.group_visibility === 'public' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Participants max</label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="2"
                  required
                  className="input-field"
                />
              </div>
            )}

            {formData.type === 'group' && formData.group_visibility === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Clients invités</label>
                <div className="border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto bg-black/20 custom-scrollbar">
                  {clients.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">Aucun client disponible</p>
                  ) : (
                    <div className="space-y-1">
                      {clients.map(client => (
                        <label
                          key={client.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedClients.includes(client.id) ? 'bg-primary-500/10 border border-primary-500/30' : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedClients.includes(client.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-500'
                            }`}>
                            {selectedClients.includes(client.id) && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id)}
                            className="hidden"
                          />
                          <span className={`text-sm ${selectedClients.includes(client.id) ? 'text-white' : 'text-gray-300'}`}>
                            {client.full_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} sélectionné{selectedClients.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prix (CHF)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="scheduled" className="bg-gray-800">Planifié</option>
                  <option value="completed" className="bg-gray-800">Terminé</option>
                  <option value="cancelled" className="bg-gray-800">Annulé</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Mode de paiement</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: 'online' }))}
                  className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'online'
                    ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className={`w-6 h-6 ${formData.payment_method === 'online' ? 'text-cyan-400' : 'text-gray-500'
                      }`} />
                    <span className={`text-sm font-medium ${formData.payment_method === 'online' ? 'text-white' : 'text-gray-400'
                      }`}>
                      En ligne
                    </span>
                    <span className="text-xs text-gray-500 text-center">
                      Stripe / Carte
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: 'in_person' }))}
                  className={`p-4 rounded-xl border transition-all ${formData.payment_method === 'in_person'
                    ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className={`w-6 h-6 ${formData.payment_method === 'in_person' ? 'text-cyan-400' : 'text-gray-500'
                      }`} />
                    <span className={`text-sm font-medium ${formData.payment_method === 'in_person' ? 'text-white' : 'text-gray-400'
                      }`}>
                      Sur place
                    </span>
                    <span className="text-xs text-gray-500 text-center">
                      Cash / TWINT
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {appointment?.id && formData.type === 'group' && (
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants inscrits
                  </h3>
                  <span className="text-sm text-gray-400">
                    {registeredParticipants.length} / {formData.max_participants}
                  </span>
                </div>

                {loadingParticipants ? (
                  <div className="text-center py-4 text-gray-500">
                    Chargement des participants...
                  </div>
                ) : registeredParticipants.length > 0 ? (
                  <div className="space-y-2">
                    {registeredParticipants.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {reg.client?.full_name?.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{reg.client?.full_name}</p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              {/* {reg.client?.email && <span>{reg.client.email}</span>} */}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          Inscrit
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                    Aucun participant inscrit pour le moment
                  </div>
                )}
              </div>
            )}

            {appointment?.id && formData.payment_method === 'online' && (
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Lien de paiement
                  </h3>
                </div>

                {paymentLink ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <LinkIcon className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">
                          Lien actif
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={paymentLink}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copié!' : 'Copier'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQR(!showQR)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {showQR && (
                      <div className="flex justify-center p-6 bg-white rounded-xl border border-white/10">
                        <div className="text-center">
                          <QRCodeSVG value={paymentLink} size={180} level="H" />
                          <p className="mt-3 text-sm text-gray-800 font-medium">
                            Scannez pour payer
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGeneratePaymentLink}
                    disabled={generatingLink}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingLink ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-5 h-5" />
                        Générer le lien de paiement
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Notes pour la séance..."
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="primary-button"
              >
                {appointment ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;