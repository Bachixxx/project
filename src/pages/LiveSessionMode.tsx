import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveSession } from '../contexts/LiveSessionContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Play, Pause } from 'lucide-react';

export default function LiveSessionMode() {
    const { sessionId } = useParams();
    const { sessionState, endSession } = useLiveSession();
    const navigate = useNavigate();

    const [session, setSession] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchSessionDetails();
        }
    }, [sessionId]);

    useEffect(() => {
        let interval: any;
        if (sessionState.isActive && !isPaused) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sessionState.isActive, isPaused]);

    const fetchSessionDetails = async () => {
        const { data } = await supabase
            .from('sessions')
            .select(`
        *,
        session_exercises (
          *,
          exercise:exercises(*)
        )
      `)
            .eq('id', sessionId)
            .single();

        if (data) setSession(data);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinish = () => {
        // Logic to save workout log would go here
        const confirmEnd = window.confirm("Terminer la séance ? Cela la marquera comme complétée.");
        if (confirmEnd) {
            endSession();
            navigate('/clients/' + sessionState.clientId);
        }
    };

    if (!session) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>;

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#0f172a]">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-400">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="font-mono text-2xl font-bold text-blue-400 tracking-wider">
                    {formatTime(elapsedTime)}
                </div>
                <button
                    onClick={handleFinish}
                    className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold border border-red-500/20"
                >
                    TERMINER
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-2">{session.name}</h1>
                <p className="text-gray-400 mb-6">{session.description}</p>

                <div className="space-y-4 max-w-2xl mx-auto">
                    {session.session_exercises?.sort((a: any, b: any) => a.order_index - b.order_index).map((ex: any, idx: number) => (
                        <div key={ex.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-lg">{ex.exercise.name}</div>
                                <div className="text-gray-400 text-sm mb-3">
                                    {ex.sets} séries x {ex.reps} reps • Repos: {ex.rest_time}s
                                </div>
                                {/* Interactive Sets */}
                                <div className="flex gap-2">
                                    {Array.from({ length: ex.sets }).map((_, sIdx) => (
                                        <button key={sIdx} className="w-10 h-10 rounded-lg border border-white/20 hover:bg-green-500/20 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-all">
                                            {sIdx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-24 border-t border-white/10 bg-[#0f172a] px-6 flex items-center justify-center gap-6">
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                </button>
            </div>
        </div>
    );
}
