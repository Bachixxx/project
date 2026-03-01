import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Calendar, CheckCircle, Clock, Dumbbell, Award, ChevronLeft, RotateCcw } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';

function ClientWorkout() {
  const { clientProgramId } = useParams();
  const { client } = useClientAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [sessionsStatus, setSessionsStatus] = useState<Record<string, any>>({});
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (client && clientProgramId) {
      fetchProgramDetails();
    }
  }, [client, clientProgramId]);

  const fetchProgramDetails = async () => {
    try {
      // 1. Fetch Program Details with Sessions
      const { data: programData, error: programError } = await supabase
        .from('client_programs')
        .select(`
          id,
          status,
          progress,
          scheduling_type,
          program:programs!inner (
            id,
            name,
            description,
            difficulty_level,
            duration_weeks,
            coach_id,
            coach:coaches (
              full_name,
              profile_image_url
            ),
            program_sessions!inner (
              id,
              order_index,
              session:sessions!inner (
                id,
                name,
                description,
                duration_minutes,
                difficulty_level,
                session_exercises ( count )
              )
            )
          )
        `)
        .eq('id', clientProgramId)
        .single();

      if (programError) throw programError;
      setProgram(programData);

      // 2. Fetch Completion Status for these sessions
      // We look for any scheduled_sessions for this client and these session_ids
      const prog = programData.program as any;
      const sessionIds = prog.program_sessions.map((ps: any) => ps.session.id);

      const { data: historyData, error: historyError } = await supabase
        .from('scheduled_sessions')
        .select('session_id, status, scheduled_date, id')
        .eq('client_id', client.id)
        .in('session_id', sessionIds)
        .order('scheduled_date', { ascending: false });

      if (historyError) throw historyError;

      // Map history to session IDs (keeping the most recent status)
      const statusMap: Record<string, any> = {};
      historyData?.forEach(h => {
        if (!statusMap[h.session_id]) {
          statusMap[h.session_id] = h;
        }
      });
      setSessionsStatus(statusMap);

    } catch (error) {
      console.error('Error fetching program details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (session: any) => {
    if (!client || !program) return;
    setStartingSessionId(session.id);

    try {
      const today = new Date().toISOString().split('T')[0];
      const prog = program.program as any;

      if (program.scheduling_type === 'coach_led') {
        // MUST use an existing scheduled session
        const { data: existingSession } = await supabase
          .from('scheduled_sessions')
          .select('id')
          .eq('client_id', client.id)
          .eq('session_id', session.id)
          .eq('status', 'scheduled') // Only pick explicitly scheduled ones
          .order('scheduled_date', { ascending: true }) // Get the earliest scheduled one
          .limit(1)
          .maybeSingle();

        if (existingSession) {
          navigate(`/client/live-workout/${existingSession.id}`);
          return;
        } else {
          // In theory, the UI should prevent clicking here, but safeguard:
          throw new Error("Cette séance n'a pas été planifiée.");
        }
      } else {
        // Self-paced logic (Autonomie)
        // Look for an existing scheduled session for today that isn't completed
        const { data: existingSession } = await supabase
          .from('scheduled_sessions')
          .select('id')
          .eq('client_id', client.id)
          .eq('session_id', session.id)
          .gte('scheduled_date', today) // Simplification: any session from today onwards or just "recent"
          .neq('status', 'completed')
          .maybeSingle();

        if (existingSession) {
          navigate(`/client/live-workout/${existingSession.id}`);
          return;
        }

        // Create NEW Scheduled Session (Unified Engine)
        const { data: newSession, error: createError } = await supabase
          .from('scheduled_sessions')
          .insert([{
            client_id: client.id,
            coach_id: prog.coach_id, // Use Program Author as Coach
            session_id: session.id,
            scheduled_date: new Date().toISOString(),
            status: 'scheduled',
            notes: `Séance du programme: ${prog.name}`
          }])
          .select()
          .single();

        if (createError) throw createError;

        navigate(`/client/live-workout/${newSession.id}`);
      }

    } catch (error) {
      console.error('Error starting session:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors du lancement de la séance');
      setStartingSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!program) return null;

  const sortedSessions = program.program.program_sessions.sort((a: any, b: any) => a.order_index - b.order_index);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 font-sans relative overflow-hidden">

      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-teal-600/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Massive Background Image (Native Hero Vibe) */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity grayscale-[10%] pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none"></div>

        {/* Floating Header */}
        <div className="absolute top-0 w-full px-4 pt-4 pb-2 z-10 flex items-center justify-between mt-[env(safe-area-inset-top)]">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-lg active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 ml-[-2px]" />
          </button>
        </div>

        {/* Floating Title Container */}
        <div className="absolute bottom-24 left-0 right-0 px-6 z-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
              Programme
            </span>
            {program.program.difficulty_level && (
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium text-gray-200 capitalize">
                {program.program.difficulty_level}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight text-shadow-lg mb-1">{program.program.name}</h1>
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Par {program.program.coach?.full_name || 'Coach'}</p>
        </div>
      </div>

      {/* The Native "Sheet" Content Container */}
      <div className="relative z-20 mt-[35vh] bg-slate-950 rounded-t-[3rem] px-4 pt-8 min-h-[65vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5">
        <div className="max-w-3xl mx-auto space-y-6 pb-24">

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex items-center gap-3 shadow-lg border-t-white/10">
              <div className="p-2.5 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/20">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Durée</p>
                <p className="text-lg font-bold text-white">{program.program.duration_weeks} semaines</p>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex items-center gap-3 shadow-lg border-t-white/10">
              <div className="p-2.5 bg-teal-500/10 backdrop-blur-sm rounded-xl border border-teal-500/20">
                <Dumbbell className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Séances</p>
                <p className="text-lg font-bold text-white">{sortedSessions.length} total</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {program.program.description && (
            <div className="bg-slate-900/30 backdrop-blur-lg border border-white/5 p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">À propos</h3>
              <p className="text-slate-300 text-sm leading-relaxed relative z-10">{program.program.description}</p>
            </div>
          )}

          {/* Sessions List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 px-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Votre Parcours
            </h3>

            <div className="space-y-4">
              {sortedSessions.map((item: any, index: number) => {
                const session = item.session;
                const status = sessionsStatus[session.id]; // { status, scheduled_date }
                const isCompleted = status?.status === 'completed';
                const isScheduled = status?.status === 'scheduled';

                return (
                  <div
                    key={session.id}
                    className={`relative group bg-slate-900/60 backdrop-blur-xl border ${isCompleted ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5'} hover:border-emerald-500/30 rounded-3xl p-5 transition-all duration-300 border-t-white/10`}
                  >
                    {/* Subtle Hover Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>

                    {/* Connector Line */}
                    {index < sortedSessions.length - 1 && (
                      <div className="absolute left-[2.25rem] bottom-[-20px] w-[2px] h-[20px] bg-slate-800 shadow-[0_0_5px_rgba(255,255,255,0.05)] -z-10" />
                    )}

                    <div className="flex items-start gap-4 relative z-10">
                      {/* Number / Status Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border backdrop-blur-md ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                        'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="text-lg font-bold">{index + 1}</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-lg truncate pr-2 ${isCompleted ? 'text-slate-300' : 'text-white'}`}>
                            {session.name}
                          </h4>
                          {isCompleted && (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">Fait</span>
                          )}
                          {program.scheduling_type === 'coach_led' && !isScheduled && !isCompleted && (
                            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">Non planifié</span>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                          {session.description || 'Séance complète'}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-4">
                          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-lg backdrop-blur-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-lg backdrop-blur-sm">
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>{session.session_exercises[0]?.count || 0} exos</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {isCompleted ? (
                          <button
                            onClick={() => {
                              if (program.scheduling_type === 'coach_led' && (!isScheduled || status?.status === 'completed')) {
                                alert("Cette séance doit être planifiée par votre coach avant de pouvoir la refaire.");
                                return;
                              }
                              handleStartSession(session);
                            }}
                            disabled={startingSessionId === session.id || (program.scheduling_type === 'coach_led' && !isScheduled)}
                            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/5 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                          >
                            {startingSessionId === session.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Refaire la séance
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (program.scheduling_type === 'coach_led' && !isScheduled) {
                                alert("En attente de planification par votre coach.");
                                return;
                              }
                              handleStartSession(session);
                            }}
                            disabled={startingSessionId === session.id || (program.scheduling_type === 'coach_led' && !isScheduled)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 disabled:from-slate-800 disabled:to-slate-800 disabled:shadow-none disabled:cursor-not-allowed disabled:text-slate-500 group active:scale-[0.98] border border-emerald-400/30 disabled:border-white/5"
                          >
                            {startingSessionId === session.id ? (
                              <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                {program.scheduling_type === 'coach_led' && !isScheduled ? (
                                  <Clock className="w-4 h-4 drop-shadow-md" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current drop-shadow-md group-disabled:fill-slate-500 group-disabled:drop-shadow-none" />
                                )}
                                <span className="drop-shadow-md group-disabled:drop-shadow-none">
                                  {program.scheduling_type === 'coach_led' && !isScheduled ? 'En attente' : (isScheduled ? 'Reprendre' : 'Commencer')}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Action Bar for Next Session (Optional, can be used if we want a global Start button) */}
          {/* We keep the individual buttons inside the session cards for now, as that's how the logic is tightly bound. */}

        </div>
      </div>
    </div>
  );
}

export default ClientWorkout;