import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Calendar, CheckCircle, Clock, Dumbbell, Award } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { supabase } from '../../lib/supabase';
import { PageHero } from '../../components/client/shared/PageHero';

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
      // Check if unfinished session exists today
      // (This logic is partly handled by the UI showing "Reprendre", but let's be safe)
      const today = new Date().toISOString().split('T')[0];

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
      const prog = program.program as any;
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

    } catch (error) {
      console.error('Error starting session:', error);
      alert('Erreur lors du lancement de la séance');
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
    <div className="min-h-screen bg-[#0f172a] text-white pb-24 font-sans">

      {/* Page Hero */}
      <PageHero
        title={program.program.name}
        subtitle={`Par ${program.program.coach?.full_name || 'Coach'}`}
        backgroundImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
        showBackButton={true}
        headerContent={
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
              Programme
            </span>
            {program.program.difficulty_level && (
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium text-gray-200 capitalize">
                {program.program.difficulty_level}
              </span>
            )}
          </div>
        }
      />

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-30 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Durée</p>
              <p className="text-lg font-bold">{program.program.duration_weeks} semaines</p>
            </div>
          </div>
          <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Dumbbell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Séances</p>
              <p className="text-lg font-bold">{sortedSessions.length} total</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {program.program.description && (
          <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">À propos</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{program.program.description}</p>
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
              const isLocked = index > 0 && !(sessionsStatus[sortedSessions[index - 1].session.id]?.status === 'completed'); // Simple lock logic? Maybe too strict.

              return (
                <div
                  key={session.id}
                  className={`relative group bg-[#1e293b] border ${isCompleted ? 'border-green-500/30' : 'border-white/5'} hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300`}
                >
                  {/* Connector Line */}
                  {index < sortedSessions.length - 1 && (
                    <div className="absolute left-[2.25rem] bottom-[-20px] w-0.5 h-[20px] bg-white/5 -z-10" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Number / Status Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                      'bg-white/5 border-white/5 text-gray-400'
                      }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="text-lg font-bold">{index + 1}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold text-lg truncate pr-2 ${isCompleted ? 'text-gray-300' : 'text-white'}`}>
                          {session.name}
                        </h4>
                        {isCompleted && (
                          <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Fait</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {session.description || 'Séance complète'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{session.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>{session.session_exercises[0]?.count || 0} exos</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {isCompleted ? (
                        <button
                          onClick={() => handleStartSession(session)}
                          disabled={startingSessionId === session.id}
                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/5"
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
                          onClick={() => handleStartSession(session)}
                          disabled={startingSessionId === session.id}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          {startingSessionId === session.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              {isScheduled ? 'Reprendre' : 'Commencer'}
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

      </div>
    </div>
  );
}

// Helper icon
function RotateCcw({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /><path d="M3 3v9h9" /></svg>
  );
}

export default ClientWorkout;