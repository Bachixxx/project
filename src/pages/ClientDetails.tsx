import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Calendar as CalendarIcon, BarChart, Activity, TrendingUp } from 'lucide-react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import { InviteClientButton } from '../components/InviteClientButton';
import { ScheduleSessionModal } from '../components/ScheduleSessionModal';
import { SessionDetailsModal } from '../components/SessionDetailsModal';

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

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  height: number;
  weight: number;
  fitness_goals: string[];
  medical_conditions: string[];
  notes: string;
  status: string;
  created_at: string;
  auth_id: string | null;
}

interface Program {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty_level: string;
}

interface ClientProgram {
  id: string;
  program: Program;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
}

function ClientDetails() {
  const { clientId } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [clientPrograms, setClientPrograms] = useState<ClientProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (user && clientId) {
      fetchClientData();
    }
  }, [user, clientId]);

  const fetchClientData = async () => {
    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Fetch client programs
      const { data: programsData, error: programsError } = await supabase
        .from('client_programs')
        .select(`
          id,
          program:programs (
            id,
            name,
            description,
            duration_weeks,
            difficulty_level
          ),
          start_date,
          end_date,
          progress,
          status
        `)
        .eq('client_id', clientId)
        .order('start_date', { ascending: false });

      if (programsError) throw programsError;

      // Fetch scheduled sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('scheduled_sessions')
        .select(`
          *,
          session:sessions (
            id,
            name,
            description,
            duration_minutes,
            difficulty_level
          )
        `)
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: true });

      if (sessionsError) throw sessionsError;

      const formattedSessions = (sessionsData || []).map(s => ({
        id: s.id,
        title: s.session.name,
        start: new Date(s.scheduled_date),
        end: new Date(new Date(s.scheduled_date).getTime() + s.session.duration_minutes * 60000),
        status: s.status,
        notes: s.notes,
        session: s.session
      }));

      setClient(clientData);
      setClientPrograms(programsData || []);
      setScheduledSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setShowScheduleModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedSessionId(event.id);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Client not found</h1>
          <Link
            to="/clients"
            className="inline-flex items-center text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/clients"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Clients
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{client.full_name}</h1>
              <div className="text-white/80">
                <p>{client.email} • {client.phone}</p>
                <p>
                  {client.gender} • {new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()} years
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {client && !client.auth_id && (
                <InviteClientButton
                  clientId={client.id}
                  onInviteSent={() => {
                    fetchClientData();
                  }}
                />
              )}
              <Link
                to={`/clients/${client.id}/analytics`}
                className="bg-white/5 border border-white/10 backdrop-blur-lg text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 hover:border-white/20"
              >
                <TrendingUp className="w-5 h-5" />
                Analyse des performances
              </Link>
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-white/5 border border-white/10 backdrop-blur-lg text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 hover:border-white/20"
              >
                <Plus className="w-5 h-5" />
                Assign Program
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">Stats</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-white/60 text-sm">Height</div>
                <div className="text-xl font-semibold">{client.height} cm</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Weight</div>
                <div className="text-xl font-semibold">{client.weight} kg</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">BMI</div>
                <div className="text-xl font-semibold">
                  {(client.weight / Math.pow(client.height / 100, 2)).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <BarChart className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">Goals</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {client.fitness_goals.map((goal, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/10 rounded-lg text-sm"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">Medical Info</h2>
            </div>
            <div className="space-y-2">
              {client.medical_conditions.map((condition, index) => (
                <div key={index} className="text-white/80">
                  • {condition}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Programs</h2>
          <div className="space-y-4">
            {clientPrograms.map((cp) => (
              <div
                key={cp.id}
                className="bg-white/10 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {cp.program.name}
                    </h3>
                    <p className="text-white/60">
                      {new Date(cp.start_date).toLocaleDateString()} - {new Date(cp.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/workout/${cp.id}`}
                    className="px-4 py-2 bg-white/50/20 hover:bg-white/50/30 rounded-lg text-blue-200"
                  >
                    Start Workout
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>Progress</span>
                    <span>{cp.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-white/50 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${cp.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-6">Calendrier des séances</h2>
          <div className="bg-white rounded-lg p-4">
            <BigCalendar
              localizer={localizer}
              events={scheduledSessions}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={['month', 'week', 'day']}
              defaultView="week"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              min={new Date(2024, 0, 1, 6, 0, 0)}
              max={new Date(2024, 0, 1, 21, 0, 0)}
              messages={{
                next: "Suivant",
                previous: "Précédent",
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                noEventsInRange: "Aucune séance programmée"
              }}
            />
          </div>
        </div>
      </div>

      {showAssignModal && (
        <AssignProgramModal
          clientId={client.id}
          onClose={() => setShowAssignModal(false)}
          onAssign={() => {
            fetchClientData();
            setShowAssignModal(false);
          }}
        />
      )}
      {showScheduleModal && (
        <ScheduleSessionModal
          clientId={client.id}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={fetchClientData}
          selectedSlot={selectedSlot}
        />
      )}
      {showDetailsModal && selectedSessionId && (
        <SessionDetailsModal
          scheduledSessionId={selectedSessionId}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSessionId(null);
          }}
          onStatusChange={fetchClientData}
        />
      )}
    </div>
  );
}

function AssignProgramModal({ clientId, onClose, onAssign }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('coach_id', user?.id)
        .order('name');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    
    try {
      setLoading(true);
      const program = programs.find(p => p.id === selectedProgram);
      if (!program) return;

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + program.duration_weeks * 7);

      const { error } = await supabase
        .from('client_programs')
        .insert([{
          client_id: clientId,
          program_id: selectedProgram,
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
          progress: 0,
          status: 'active',
        }]);

      if (error) throw error;
      console.log("Program assigned successfully:", {
        client_id: clientId,
        program_id: selectedProgram,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0]
      });
      onAssign();
    } catch (error) {
      console.error('Error assigning program:', error);
      alert('Error assigning program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Assign Program</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.duration_weeks} weeks)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-500 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedProgram}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
              >
                Assign Program
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientDetails;