import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Play, Calendar, CheckCircle, Clock, Dumbbell, User, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function CoachProgramDetails() {
    const { clientProgramId } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [program, setProgram] = useState<any>(null);
    const [sessionsStatus, setSessionsStatus] = useState<Record<string, any>>({});
    const [clientProfile, setClientProfile] = useState<any>(null);

    useEffect(() => {
        if (user && clientProgramId) {
            fetchProgramDetails();
        }
    }, [user, clientProgramId]);

    const fetchProgramDetails = async () => {
        try {
            // 1. Fetch Program Details with Sessions
            const { data: programData, error: programError } = await supabase
                .from('client_programs')
                .select(`
          id,
          status,
          progress,
          client_id,
          client:clients (
            id,
            full_name
          ),
          program:programs!inner (
            id,
            name,
            description,
            difficulty_level,
            duration_weeks,
            coach_id,
            coach:coaches (
              full_name
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
            setClientProfile(programData.client);

            // 2. Fetch Completion Status for these sessions
            const prog = programData.program as any;
            const sessionIds = prog.program_sessions.map((ps: any) => ps.session.id);

            const { data: historyData, error: historyError } = await supabase
                .from('scheduled_sessions')
                .select('session_id, status, scheduled_date, id')
                .eq('client_id', programData.client_id)
                .in('session_id', sessionIds)
                .order('scheduled_date', { ascending: false });

            if (historyError) throw historyError;

            // Map history to session IDs
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!program) return null;

    const sortedSessions = program.program.program_sessions.sort((a: any, b: any) => a.order_index - b.order_index);

    return (
        <div className="min-h-screen bg-[#09090b] text-white pb-24 font-sans">

            {/* Header */}
            <div className="relative h-64 overflow-hidden bg-gray-900 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 z-0" />

                <div className="relative z-10 max-w-7xl mx-auto p-6 flex flex-col justify-between h-full">
                    <Link
                        to={`/clients/${clientProfile?.id}`}
                        className="self-start inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Retour au client
                    </Link>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-bold text-blue-400 uppercase">
                                Programme Client
                            </span>
                            <span className="text-sm text-gray-400">
                                Assigné à {clientProfile?.full_name}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{program.program.name}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20 space-y-8">

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium">Progression</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-bold text-white">{program.progress || 0}%</p>
                                <div className="mb-1.5 w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${program.progress || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium">Status</p>
                            <span className={`px-2 py-0.5 rounded text-sm font-bold capitalize ${program.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-gray-400 bg-gray-500/10'}`}>
                                {program.status}
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Dumbbell className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium">Séances</p>
                            <p className="text-2xl font-bold text-white">{sortedSessions.length} <span className="text-sm text-gray-500 font-normal">total</span></p>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6">Détail des séances</h2>
                    <div className="grid gap-4">
                        {sortedSessions.map((item: any, index: number) => {
                            const session = item.session;
                            const status = sessionsStatus[session.id];
                            const isCompleted = status?.status === 'completed';

                            return (
                                <div
                                    key={session.id}
                                    className={`bg-[#1e293b]/50 border ${isCompleted ? 'border-green-500/20' : 'border-white/5'} p-5 rounded-2xl flex items-center gap-5`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isCompleted
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-white/5 border-white/10 text-gray-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold text-lg ${isCompleted ? 'text-gray-300' : 'text-white'}`}>{session.name}</h3>
                                            {status?.scheduled_date && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(status.scheduled_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration_minutes} min</span>
                                            <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {session.session_exercises[0]?.count || 0} exos</span>
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

export default CoachProgramDetails;
