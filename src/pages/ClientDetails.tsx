import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Calendar as CalendarIcon, BarChart, Activity, TrendingUp, X, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// import { t } from '../i18n';
import { InviteClientButton } from '../components/InviteClientButton';
import { ScheduleSessionModal } from '../components/ScheduleSessionModal';
import { SessionDetailsModal } from '../components/SessionDetailsModal';

import { CalendarGrid } from '../components/calendar/CalendarGrid';

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

interface ScheduledSession {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  notes: string | null;
  session: any;
  item_type?: string;
  position?: number;
  content?: any;
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
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(null);


  // ... existing imports ...

  // ... inside the component ...
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'planning'>('overview');
  const [agendaTab, setAgendaTab] = useState<'upcoming' | 'past'>('upcoming');

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
        title: s.title || s.session?.name || 'Untitled',
        start: new Date(s.scheduled_date),
        end: new Date(new Date(s.scheduled_date).getTime() + (s.session?.duration_minutes || 60) * 60000),
        status: s.status,
        notes: s.notes,
        session: s.session,
        item_type: s.item_type,
        position: s.position,
        content: s.content
      }));

      setClient(clientData);
      setClientPrograms((programsData as any) || []);
      setScheduledSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDetailsModal(true);
  };

  const filteredSessions = scheduledSessions.filter(session => {
    const now = new Date();
    const isMaintainedInHistory = ['completed', 'cancelled'].includes(session.status);

    if (agendaTab === 'upcoming') {
      // Show only future sessions that are NOT completed or cancelled
      return session.start >= now && !isMaintainedInHistory;
    } else {
      // Show past sessions OR any session that is completed/cancelled (even if in future)
      return session.start < now || isMaintainedInHistory;
    }
  }).sort((a, b) => {
    if (agendaTab === 'upcoming') {
      return a.start.getTime() - b.start.getTime();
    } else {
      // Sort history by most recent first
      return b.start.getTime() - a.start.getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Complétée';
      case 'cancelled': return 'Annulée';
      case 'in_progress': return 'En cours';
      default: return 'Programmée';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#09090b] p-6 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Client introuvable</h1>
          <Link
            to="/clients"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour aux clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 font-sans">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            to="/clients"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour aux Clients
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{client.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-400">
                <span>{client.email}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span>{client.phone}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span>{client.gender}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span>{new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()} ans</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
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
                className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all font-medium"
              >
                <TrendingUp className="w-5 h-5 text-green-400" />
                Analyse
              </Link>
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all font-bold shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                Assigner Programme
              </button>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`pb-3 px-2 font-medium transition-colors relative ${viewMode === 'overview' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            Vue d'ensemble
            {viewMode === 'overview' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-500 rounded-full" />}
          </button>
          <button
            onClick={() => setViewMode('planning')}
            className={`pb-3 px-2 font-medium transition-colors relative ${viewMode === 'planning' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            Planning
            {viewMode === 'planning' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {viewMode === 'planning' ? (
          <div className="h-[calc(100vh-300px)] animate-fade-in">
            <CalendarGrid clientId={client.id} />
          </div>
        ) : (
          <>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Métriques</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400">Taille</span>
                    <span className="text-xl font-bold text-white">{client.height} cm</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400">Poids</span>
                    <span className="text-xl font-bold text-white">{client.weight} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">IMC</span>
                    <span className="text-xl font-bold text-white">
                      {(client.weight / Math.pow(client.height / 100, 2)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl">
                    <BarChart className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Objectifs</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.fitness_goals.map((goal, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-red-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Infos Médicales</h2>
                </div>
                <div className="space-y-2">
                  {client.medical_conditions.length > 0 ? (
                    client.medical_conditions.map((condition, index) => (
                      <div key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-red-400 mt-1.5">•</span>
                        {condition}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Aucune condition signalée.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Active Programs Section */}
              <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Programmes Actifs
                </h2>
                <div className="space-y-4">
                  {clientPrograms.length > 0 ? (
                    clientPrograms.map((cp) => (
                      <div
                        key={cp.id}
                        className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                              {cp.program.name}
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(cp.start_date).toLocaleDateString()} - {new Date(cp.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Link
                            to={`/workout/${cp.id}`}
                            className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            Voir détails
                          </Link>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>Progression</span>
                            <span className="text-white font-medium">{cp.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${cp.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      Aucun programme assigné.
                    </div>
                  )}
                </div>
              </div>

              {/* Agenda View Section */}
              <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl rounded-2xl p-6 mt-8 lg:mt-0 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-cyan-400" />
                    Agenda
                  </h2>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                    <button
                      onClick={() => setAgendaTab('upcoming')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${agendaTab === 'upcoming'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      À venir
                    </button>
                    <button
                      onClick={() => setAgendaTab('past')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${agendaTab === 'past'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Passé
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* Add Session Button */}
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400 transition-all flex items-center justify-center gap-2 group mb-4"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Planifier une nouvelle séance</span>
                  </button>

                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className="group bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all cursor-pointer hover:bg-white/10 flex items-center gap-4"
                      >
                        {/* Date Box */}
                        <div className="flex flex-col items-center justify-center bg-white/5 rounded-lg w-16 h-16 border border-white/5">
                          <span className="text-xs text-gray-400 uppercase font-bold">
                            {new Date(session.start).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-white leading-none">
                            {new Date(session.start).getDate()}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                              {session.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-cyan-500/70" />
                              <span>
                                {new Date(session.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(session.status)}`}>
                              {getStatusLabel(session.status)}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="p-2 bg-white/5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <CalendarIcon className="w-12 h-12 mb-3 text-gray-700" />
                      <p className="font-medium">Aucune séance {agendaTab === 'upcoming' ? 'à venir' : 'passée'}.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

      </>
      )}

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

interface AssignProgramModalProps {
  clientId: string;
  onClose: () => void;
  onAssign: () => void;
}

function AssignProgramModal({ clientId, onClose, onAssign }: AssignProgramModalProps) {
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
      onAssign();
    } catch (error) {
      console.error('Error assigning program:', error);
      alert('Error assigning program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Assigner un Programme</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Choisir un programme</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="" className="bg-[#1e293b]">Sélectionner un programme</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id} className="bg-[#1e293b]">
                    {program.name} ({program.duration_weeks} semaines)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!selectedProgram || loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientDetails;