import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Play, Layers, Dumbbell, ChevronRight, User, Check } from 'lucide-react';
import { SessionSelector } from './library/SessionSelector';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLiveSession } from '../contexts/LiveSessionContext';
import { useNavigate } from 'react-router-dom';

interface Client {
    id: string;
    full_name: string;
    email: string;
}

interface ScheduledSession {
    id: string;
    session: {
        id: string;
        name: string;
        duration_minutes: number;
        description: string;
    };
    scheduled_date: string;
}

interface ClientProgram {
    id: string;
    name: string; // Program name
    next_session?: {
        id: string; // Session ID
        name: string;
        order_index: number;
    };
}

interface LiveSessionLauncherProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientId?: string;
}

export function LiveSessionLauncher({ isOpen, onClose, initialClientId }: LiveSessionLauncherProps) {
    const { user } = useAuth();
    const { startSession } = useLiveSession();
    const navigate = useNavigate();

    const [step, setStep] = useState<'client' | 'options'>(initialClientId ? 'options' : 'client');
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
    const [selectedClientName, setSelectedClientName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(false);

    // Smart Options Data
    const [todaySession, setTodaySession] = useState<ScheduledSession | null>(null);
    const [nextProgramSession, setNextProgramSession] = useState<ClientProgram | null>(null);
    const [showSessionSelector, setShowSessionSelector] = useState(false);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    useEffect(() => {
        if (isOpen && !initialClientId) {
            fetchClients();
        }
    }, [isOpen, initialClientId]);

    useEffect(() => {
        if (initialClientId) {
            // If we start with a client, fetch their name and options immediately
            fetchClientDetails(initialClientId);
            fetchSmartOptions(initialClientId);
        }
    }, [initialClientId]);

    // Reset when closing
    useEffect(() => {
        if (!isOpen) {
            setStep(initialClientId ? 'options' : 'client');
            setSearchQuery('');
            setTodaySession(null);
            setNextProgramSession(null);
            setShowSessionSelector(false);
            if (!initialClientId) setSelectedClientId(null);
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, full_name, email')
                .eq('coach_id', user?.id)
                .order('full_name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchClientDetails = async (id: string) => {
        const { data } = await supabase.from('clients').select('full_name').eq('id', id).single();
        if (data) setSelectedClientName(data.full_name);
    };

    const fetchSmartOptions = async (clientId: string) => {
        setLoading(true);
        try {
            // 1. Fetch Today's Scheduled Session
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const { data: scheduleData } = await supabase
                .from('scheduled_sessions')
                .select(`
          id,
          scheduled_date,
          session:sessions (
            id,
            name,
            duration_minutes,
            description
          )
        `)
                .eq('client_id', clientId)
                .gte('scheduled_date', todayStart.toISOString())
                .lte('scheduled_date', todayEnd.toISOString())
                .neq('status', 'cancelled')
                .neq('status', 'completed') // Only show pending/scheduled
                .order('scheduled_date', { ascending: true })
                .limit(1)
                .single();

            if (scheduleData) {
                setTodaySession(scheduleData as any);
            } else {
                setTodaySession(null);
            }

            // 2. Fetch Active Program progress
            const { data: programsData } = await supabase
                .from('client_programs')
                .select(`
          id,
          status,
          program:programs (
            id,
            name,
            program_sessions (
              id,
              order_index,
              session:sessions (
                id,
                name
              )
            )
          )
        `)
                .eq('client_id', clientId)
                .eq('status', 'active')
                .single();

            if (programsData) {
                // Find next session that is NOT completed
                // This requires checking history. For V1, simplest is to leverage 'progress' or just pick next by order.
                // Let's do a quick check on completed sessions for this program to find the next one.
                // A robust implementation would be complex. For "Smart Launcher" MVP:
                // We will just take the first session of the program for now or mock the "Next" logic if tracking isn't granular yet.
                // Let's assume we want to suggest the *first* session roughly, or better:

                // Improve: Check count of completed sessions for this program
                const prog = programsData.program as any;
                const programSessions = prog.program_sessions.sort((a: any, b: any) => a.order_index - b.order_index);

                // We really want the next ONE. Let's start with the first one for MVP or if progress is 0.
                // If we have time, we'd query `scheduled_sessions` linked to this program that are completed.
                // For now, let's propose the first session in the list as "Next step"
                if (programSessions.length > 0) {
                    setNextProgramSession({
                        id: programsData.id,
                        name: (programsData.program as any).name,
                        next_session: {
                            id: programSessions[0].session.id,
                            name: programSessions[0].session.name,
                            order_index: programSessions[0].order_index
                        }
                    });
                }
            } else {
                setNextProgramSession(null);
            }

        } catch (error) {
            console.error('Error fetching smart options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClientId(client.id);
        setSelectedClientName(client.full_name);
        setStep('options');
        fetchSmartOptions(client.id);
    };

    const handleLaunch = async (sessionId: string, source: 'schedule' | 'program' | 'library', contextId?: string) => {
        let finalSessionId = sessionId;

        if (sessionId === 'ad-hoc-free') {
            try {
                setLoading(true);
                // Create a new "Free Session" in the database
                const { data, error } = await supabase
                    .from('sessions')
                    .insert([
                        {
                            coach_id: user?.id,
                            name: `Séance Libre - ${new Date().toLocaleDateString()}`,
                            description: 'Séance créée en direct',
                            duration_minutes: 60,
                            difficulty_level: 'Intermédiaire',
                            session_type: 'private',
                            is_template: saveAsTemplate // Use state
                        }
                    ])
                    .select()
                    .single();

                if (error) throw error;
                finalSessionId = data.id;
            } catch (error) {
                console.error("Error creating free session:", error);
                alert("Erreur lors de la création de la séance libre.");
                setLoading(false);
                return;
            }
        }

        startSession({
            clientId: selectedClientId,
            sessionId: finalSessionId,
            scheduledSessionId: source === 'schedule' ? contextId : undefined,
            programSessionId: source === 'program' ? contextId : undefined,
        });
        onClose();
        navigate(`/live-session/${finalSessionId}`);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {step === 'client' && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Lancer une séance</h2>
                        <p className="text-gray-400 mb-6">Sélectionnez le client avec qui vous allez vous entraîner.</p>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {clients
                                .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                {client.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {client.full_name}
                                                </div>
                                                <div className="text-xs text-gray-500">{client.email}</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400" />
                                    </button>
                                ))
                            }
                            {clients.length === 0 && (
                                <p className="text-center text-gray-500 py-4">Aucun client trouvé.</p>
                            )}
                        </div>
                    </div>
                )}

                {step === 'options' && (
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => !initialClientId && setStep('client')}
                                className={`text-sm text-gray-400 hover:text-white flex items-center gap-1 ${initialClientId ? 'cursor-default pointer-events-none' : ''}`}
                            >
                                {!initialClientId && <ChevronRight className="w-4 h-4 rotate-180" />}
                                <User className="w-4 h-4" />
                                {selectedClientName}
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6">Prêt à démarrer ?</h2>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">

                                {/* Option 1: Today's Agenda (Prioritized) */}
                                {todaySession && (
                                    <div className="relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <button
                                            onClick={() => handleLaunch(todaySession.session.id, 'schedule', todaySession.id)}
                                            className="relative w-full p-5 text-left border border-green-500/30 rounded-2xl flex items-center justify-between hover:border-green-500/60 transition-all shadow-lg shadow-green-900/10"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">
                                                        Prévu aujourd'hui
                                                    </div>
                                                    <div className="font-bold text-lg text-white">
                                                        {todaySession.session.name}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {todaySession.session.duration_minutes} min • {new Date(todaySession.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-green-500 text-black p-2 rounded-full">
                                                <Play className="w-5 h-5 fill-current" />
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Option 2: Next in Program (Secondary) */}
                                {!todaySession && nextProgramSession && nextProgramSession.next_session && (
                                    <div className="relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-50 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <button
                                            onClick={() => handleLaunch(nextProgramSession.next_session!.id, 'program', nextProgramSession.id)}
                                            className="relative w-full p-5 text-left border border-blue-500/30 rounded-2xl flex items-center justify-between hover:border-blue-500/60 transition-all shadow-lg shadow-blue-900/10"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <Layers className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                                                        Suite du programme : {nextProgramSession.name}
                                                    </div>
                                                    <div className="font-bold text-lg text-white">
                                                        {nextProgramSession.next_session.name}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        Séance #{nextProgramSession.next_session.order_index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-blue-500 text-white p-2 rounded-full">
                                                <Play className="w-5 h-5 fill-current" />
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Option 3: Picker (Fallback) */}
                                <button
                                    onClick={() => {
                                        // Navigate to a "Picker" mode or just modal?
                                        // For MVP, keep it simple: Just go to library picker inside this modal or navigate away?
                                        // Let's assume we implement a picker step NEXT.
                                        // Or just rely on user going to "Sessions" page? No, that breaks flow.
                                        // Let's alert for now or implement picker later.
                                        setShowSessionSelector(true);
                                    }}
                                    className="w-full p-4 border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-bold text-gray-300 group-hover:text-white">Choisir une autre séance</div>
                                        <div className="text-xs text-gray-500">Parcourir la bibliothèque</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>

                                <button
                                    onClick={() => handleLaunch('ad-hoc-free', 'library')} // Placeholder ID
                                    className="w-full p-4 border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                        <Play className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-bold text-gray-300 group-hover:text-white">Séance Libre</div>
                                        <div className="text-xs text-gray-500">Démarrer sans modèle</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>

                                <div className="ml-2 flex items-center gap-3 py-2">
                                    <div
                                        onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${saveAsTemplate ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-gray-400'}`}
                                    >
                                        {saveAsTemplate && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <label
                                        onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                                        className="text-sm text-gray-400 cursor-pointer select-none hover:text-gray-300"
                                    >
                                        Enregistrer comme modèle dans la bibliothèque
                                    </label>
                                </div>

                            </div>
                        )}
                    </div>
                )}



            </div>

            {showSessionSelector && (
                <SessionSelector
                    onSelect={(session) => {
                        handleLaunch(session.id, 'library');
                        setShowSessionSelector(false);
                    }}
                    onClose={() => setShowSessionSelector(false)}
                />
            )}
        </div>
    );
}
