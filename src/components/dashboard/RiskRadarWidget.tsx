import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, MessageCircle, ChevronRight, Clock, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

interface RiskClient {
    id: string;
    full_name: string;
    email: string;
    last_activity_date: string | null;
    days_inactive: number;
}

export function RiskRadarWidget() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [riskClients, setRiskClients] = useState<RiskClient[]>([]);

    useEffect(() => {
        if (user) {
            fetchRiskClients();
        }
    }, [user]);

    const fetchRiskClients = async () => {
        try {
            setLoading(true);

            // 1. Get all clients for this coach
            const { data: clients, error: clientsError } = await supabase
                .from('clients')
                .select('id, full_name, email, created_at')
                .eq('coach_id', user?.id)
                .eq('status', 'active');

            if (clientsError) throw clientsError;

            if (!clients || clients.length === 0) {
                setRiskClients([]);
                setLoading(false);
                return;
            }

            // 2. Prepare analysis list
            const clientsAnalysis: RiskClient[] = [];
            const now = new Date();

            // 3. Check activity for each client (Parallel fetches for speed)
            await Promise.all(clients.map(async (client) => {
                // Fetch last completed session
                const { data: lastSession, error: sessionError } = await supabase
                    .from('scheduled_sessions')
                    .select('completed_at')
                    .eq('client_id', client.id)
                    .eq('status', 'completed')
                    .order('completed_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let lastActivity = lastSession?.completed_at ? parseISO(lastSession.completed_at) : null;

                // If no session, check creation date (for new clients who haven't started)
                let daysInactive = 0;

                if (lastActivity) {
                    daysInactive = differenceInDays(now, lastActivity);
                } else {
                    // No sessions yet.
                    const createdDate = parseISO(client.created_at);
                    const daysSinceJoin = differenceInDays(now, createdDate);
                    if (daysSinceJoin > 7) {
                        daysInactive = daysSinceJoin; // Risk: Inactive since join
                    } else {
                        daysInactive = 0; // Safe: Just joined
                    }
                }

                if (daysInactive > 7) {
                    // Debug log for specific cases
                    if (client.full_name.toLowerCase().includes('gerald')) {
                        console.log('Gerald Risk Debug:', { lastActivity, daysInactive, lastSession });
                    }

                    clientsAnalysis.push({
                        id: client.id,
                        full_name: client.full_name,
                        email: client.email,
                        last_activity_date: lastActivity ? lastActivity.toISOString() : null,
                        days_inactive: daysInactive
                    });
                }
            }));

            // Sort by inactivity (most inactive first)
            clientsAnalysis.sort((a, b) => b.days_inactive - a.days_inactive);

            setRiskClients(clientsAnalysis.slice(0, 5)); // Top 5 urgent cases

        } catch (error) {
            console.error('Error fetching risk clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContact = (email: string, name: string) => {
        window.location.href = `mailto:${email}?subject=Des nouvelles ! 🏋️‍♂️&body=Salut ${name}, comment vas-tu ? J'ai vu que ça faisait un moment que tu n'avais pas validé de séance. Tout va bien ?`;
    };

    if (loading) return (
        <div className="glass-card p-6 h-full flex items-center justify-center animate-pulse">
            <div className="h-6 w-24 bg-white/10 rounded mb-4"></div>
        </div>
    );

    return (
        <div className="glass-card p-6 h-full flex flex-col border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400 animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Clients à Risque</h3>
                        <p className="text-xs text-red-400 font-medium">Inactifs {'>'} 7 jours</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRiskClients}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Actualiser la liste"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                    <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2 py-1 rounded-full border border-red-500/20">
                        {riskClients.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {riskClients.length > 0 ? (
                    riskClients.map((client) => (
                        <div key={client.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                            <div>
                                <Link to={`/clients/${client.id}`} className="font-semibold text-white text-sm hover:text-primary-400 transition-colors">
                                    {client.full_name}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3 text-red-400" />
                                    <span className="text-red-300 font-medium">{client.days_inactive} jours</span>
                                    <span>sans séance</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleContact(client.email, client.full_name)}
                                className="p-2 bg-primary-500/10 hover:bg-primary-500 text-primary-400 hover:text-white rounded-lg transition-all"
                                title="Relancer par email"
                            >
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-3">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <p className="text-white font-medium text-sm">Aucun client à risque !</p>
                        <p className="text-xs text-gray-500 mt-1">Tous vos clients sont actifs ou nouveaux.</p>
                    </div>
                )}
            </div>

            {riskClients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <Link to="/clients" className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
                        Voir tous les clients <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}
