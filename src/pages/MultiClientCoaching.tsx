import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Users, Maximize2, Minimize2, ChevronRight, Clock, CheckCircle, Minus as MinusIcon, Timer, Play, Dumbbell, Activity, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface ScheduledSession {
  id: string;
  scheduled_date: string;
  status: string;
  session: {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
  };
}

interface SessionExercise {
  id: string;
  sets: number;
  reps: number;
  rest_time: number;
  instructions: string;
  order_index: number;
  exercise: {
    id: string;
    name: string;
    description: string;
    category: string;
    equipment: string[];
  };
}

interface SessionRegistration {
  id: string;
  completed_exercises: Record<string, {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }>;
  notes: string;
}

interface ClientPanel {
  id: string;
  client: Client;
  scheduledSession: ScheduledSession | null;
  exercises: SessionExercise[];
  registration: SessionRegistration | null;
  isExpanded: boolean;
  currentExerciseId: string | null;
  restTimer: number | null;
}

function MultiClientCoaching() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPanels, setClientPanels] = useState<ClientPanel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClientPanels(prev =>
        prev.map(panel => {
          if (panel.restTimer && panel.restTimer > 0) {
            return { ...panel, restTimer: panel.restTimer - 1 };
          }
          return panel;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const fetchClientScheduledSession = async (clientId: string): Promise<ScheduledSession | null> => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select(`
          id,
          scheduled_date,
          status,
          session:sessions!inner (
            id,
            name,
            description,
            duration_minutes
          )
        `)
        .eq('client_id', clientId)
        // .gte('scheduled_date', today) // Show any future or today's session? Or strict today? Strict today is safer for live view.
        // Let's stick to >= today to capture today's sessions clearly.
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching scheduled session:', error);
      return null;
    }
  };

  const fetchSessionExercises = async (sessionId: string): Promise<SessionExercise[]> => {
    try {
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
            equipment
          )
        `)
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session exercises:', error);
      return [];
    }
  };

  const fetchOrCreateRegistration = async (scheduledSessionId: string, clientId: string): Promise<SessionRegistration | null> => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('session_registrations')
        .select('id, completed_exercises, notes')
        .eq('scheduled_session_id', scheduledSessionId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return existing;
      }

      const { data: newReg, error: createError } = await supabase
        .from('session_registrations')
        .insert([{
          scheduled_session_id: scheduledSessionId,
          client_id: clientId,
          coach_id: user?.id,
          completed_exercises: {},
          notes: '',
        }])
        .select('id, completed_exercises, notes')
        .single();

      if (createError) throw createError;
      return newReg;
    } catch (error) {
      console.error('Error fetching/creating registration:', error);
      return null;
    }
  };

  const addClientPanel = async (client: Client) => {
    if (clientPanels.some(panel => panel.client.id === client.id)) {
      return;
    }

    setLoading(true);
    try {
      const scheduledSession = await fetchClientScheduledSession(client.id);
      let exercises: SessionExercise[] = [];
      let registration: SessionRegistration | null = null;

      if (scheduledSession) {
        exercises = await fetchSessionExercises(scheduledSession.session.id);
        registration = await fetchOrCreateRegistration(scheduledSession.id, client.id);
      }

      const newPanel: ClientPanel = {
        id: `panel-${client.id}`,
        client,
        scheduledSession,
        exercises,
        registration,
        isExpanded: false,
        currentExerciseId: exercises.length > 0 ? exercises[0].id : null,
        restTimer: null,
      };

      setClientPanels(prev => [...prev, newPanel]);
      setShowClientSelector(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding client panel:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeClientPanel = (panelId: string) => {
    setClientPanels(prev => prev.filter(panel => panel.id !== panelId));
  };

  const togglePanelExpand = (panelId: string) => {
    setClientPanels(prev =>
      prev.map(panel =>
        panel.id === panelId
          ? { ...panel, isExpanded: !panel.isExpanded }
          : panel
      )
    );
  };

  const setCurrentExercise = (panelId: string, exerciseId: string) => {
    setClientPanels(prev =>
      prev.map(panel =>
        panel.id === panelId
          ? { ...panel, currentExerciseId: exerciseId }
          : panel
      )
    );
  };

  const updateExerciseProgress = async (
    panelId: string,
    exerciseId: string,
    setIndex: number,
    updates: Partial<{ reps: number; weight: number; completed: boolean }>
  ) => {
    const panel = clientPanels.find(p => p.id === panelId);
    if (!panel || !panel.registration) return;

    const exercise = panel.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    try {
      const completedExercises = { ...panel.registration.completed_exercises };

      if (!completedExercises[exerciseId]) {
        completedExercises[exerciseId] = {
          sets: Array(exercise.sets).fill(null).map(() => ({
            reps: exercise.reps,
            weight: 0,
            completed: false,
          })),
        };
      }

      completedExercises[exerciseId].sets[setIndex] = {
        ...completedExercises[exerciseId].sets[setIndex],
        ...updates,
      };

      const { error } = await supabase
        .from('session_registrations')
        .update({ completed_exercises: completedExercises })
        .eq('id', panel.registration.id);

      if (error) throw error;

      setClientPanels(prev =>
        prev.map(p => {
          if (p.id === panelId && p.registration) {
            const updatedPanel = {
              ...p,
              registration: {
                ...p.registration,
                completed_exercises: completedExercises,
              },
            };

            if (updates.completed && exercise.rest_time) {
              updatedPanel.restTimer = exercise.rest_time;
            }

            return updatedPanel;
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Error updating exercise progress:', error);
    }
  };

  const calculateProgress = (panel: ClientPanel) => {
    if (!panel.registration || !panel.exercises.length) return 0;

    const totalSets = panel.exercises.reduce((acc, ex) => acc + ex.sets, 0);
    const completedSets = Object.values(panel.registration.completed_exercises).reduce(
      (acc, ex) => acc + ex.sets.filter(set => set.completed).length,
      0
    );

    // If no progress started, ensure 0
    if (totalSets === 0) return 0;

    return Math.round((completedSets / totalSets) * 100);
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableClients = filteredClients.filter(
    client => !clientPanels.some(panel => panel.client.id === client.id)
  );



  return (
    <div className="p-6 max-w-[2000px] mx-auto animate-fade-in min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Coaching Multi-Client</h1>
          <p className="text-gray-400">Gérez plusieurs sessions en simultané avec une interface optimisée.</p>
        </div>
        <button
          onClick={() => setShowClientSelector(true)}
          className="primary-button flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un client
        </button>
      </div>

      {clientPanels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card p-12 text-center max-w-lg w-full">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Tableau de bord vide</h2>
            <p className="text-gray-400 mb-8">
              Sélectionnez des clients pour afficher leur séance du jour et suivre leur progression en temps réel.
            </p>
            <button
              onClick={() => setShowClientSelector(true)}
              className="primary-button w-full justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Sélectionner un client
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6">
          {clientPanels.map((panel) => {
            const currentExercise = panel.exercises.find(e => e.id === panel.currentExerciseId);
            const progress = calculateProgress(panel);

            return (
              <div
                key={panel.id}
                className={`${panel.isExpanded ? 'col-span-full' : ''} transition-all duration-300`}
              >
                <div className={`glass-card flex flex-col border border-white/10 shadow-2xl ${panel.isExpanded ? 'min-h-[600px]' : 'h-[600px]'}`}>
                  {/* Header Panel */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {panel.client.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white truncate max-w-[150px]">{panel.client.full_name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          {panel.scheduledSession ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <Activity className="w-3 h-3" /> En séance
                            </span>
                          ) : (
                            <span className="text-gray-500">Pas de séance</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePanelExpand(panel.id)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title={panel.isExpanded ? "Réduire" : "Agrandir"}
                      >
                        {panel.isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeClientPanel(panel.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Fermer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {panel.scheduledSession && (
                    <div className="h-1 bg-gray-800 w-full">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {panel.scheduledSession ? (
                      <>
                        {/* Session Info Card */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <h4 className="font-bold text-white mb-1 flex items-center justify-between">
                            {panel.scheduledSession.session.name}
                            <span className="text-xs font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {panel.scheduledSession.session.duration_minutes} min
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {panel.scheduledSession.session.description || "Aucune description"}
                          </p>
                        </div>

                        {panel.exercises.length > 0 ? (
                          <>
                            {/* Exercise Navigation */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                              {panel.exercises.map((exercise, index) => {
                                const exerciseData = panel.registration?.completed_exercises[exercise.id];
                                const completedSets = exerciseData?.sets.filter(s => s.completed).length || 0;
                                const isComplete = completedSets === exercise.sets;
                                const isActive = panel.currentExerciseId === exercise.id;

                                return (
                                  <button
                                    key={exercise.id}
                                    onClick={() => setCurrentExercise(panel.id, exercise.id)}
                                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${isActive
                                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/50'
                                      : isComplete
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                      }`}
                                  >
                                    {isComplete ? <CheckCircle className="w-5 h-5" /> : index + 1}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Active Exercise View */}
                            {currentExercise && panel.registration && (
                              <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-lg text-white">{currentExercise.exercise.name}</h5>
                                  {panel.restTimer && panel.restTimer > 0 ? (
                                    <div className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-sm font-mono flex items-center gap-2 animate-pulse">
                                      <Timer className="w-4 h-4" />
                                      {Math.floor(panel.restTimer / 60)}:{(panel.restTimer % 60).toString().padStart(2, '0')}
                                    </div>
                                  ) : null}
                                </div>

                                {/* Instructions */}
                                {(currentExercise.instructions || currentExercise.exercise.description) && (
                                  <div className="text-sm text-gray-400 bg-white/5 p-3 rounded-lg border-l-2 border-blue-500">
                                    {currentExercise.instructions || currentExercise.exercise.description}
                                  </div>
                                )}

                                {/* Sets Grid */}
                                <div className="grid gap-3">
                                  {Array.from({ length: currentExercise.sets }).map((_, setIndex) => {
                                    const setData = panel.registration?.completed_exercises[currentExercise.id]?.sets[setIndex] || {
                                      reps: currentExercise.reps,
                                      weight: 0,
                                      completed: false,
                                    };

                                    return (
                                      <div
                                        key={setIndex}
                                        className={`p-3 rounded-xl transition-all border ${setData.completed
                                          ? 'bg-green-500/10 border-green-500/20'
                                          : 'bg-white/5 border-white/10'
                                          }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${setData.completed ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'
                                            }`}>
                                            {setIndex + 1}
                                          </div>

                                          <div className="grid grid-cols-2 gap-2 flex-1">
                                            <div>
                                              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">Reps</label>
                                              <input
                                                type="number"
                                                value={setData.reps}
                                                onChange={(e) => updateExerciseProgress(panel.id, currentExercise.id, setIndex, { reps: parseInt(e.target.value) || 0 })}
                                                disabled={setData.completed}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">kg</label>
                                              <input
                                                type="number"
                                                value={setData.weight}
                                                onChange={(e) => updateExerciseProgress(panel.id, currentExercise.id, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                                                disabled={setData.completed}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                              />
                                            </div>
                                          </div>

                                          <button
                                            onClick={() => updateExerciseProgress(panel.id, currentExercise.id, setIndex, { completed: !setData.completed })}
                                            className={`p-3 rounded-xl transition-all ${setData.completed
                                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                              }`}
                                          >
                                            <CheckCircle className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucun exercice dans cette séance</p>
                          </div>
                        )}

                        {progress === 100 && (
                          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-green-400">Séance terminée !</h4>
                              <p className="text-xs text-green-300/70">Tous les exercices ont été validés.</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500 h-full">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium text-white">Aucune séance prévue</p>
                        <p className="text-sm text-gray-500 mt-1 text-center max-w-[200px]">
                          Ce client n'a pas de séance planifiée pour aujourd'hui.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showClientSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Sélectionner un client</h2>
              <button
                onClick={() => {
                  setShowClientSelector(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-white/10 bg-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-full"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : availableClients.length === 0 ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                  <Search className="w-12 h-12 mb-3 opacity-20" />
                  <p>{searchQuery ? 'Aucun client trouvé' : 'Tous vos clients sont déjà affichés'}</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {availableClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => addClientPanel(client)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-blue-600 transition-colors font-bold">
                          {client.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {client.full_name}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiClientCoaching;
