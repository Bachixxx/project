import React, { useState, useEffect } from 'react';
import {
    X, Search, Users, Calendar, Check, AlertTriangle,
    CheckSquare, Square, UserPlus, Clock, Unlock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Client {
    id: string;
    full_name: string;
    email: string;
}

interface Program {
    id: string;
    name: string;
    duration_weeks: number;
}

interface ShareProgramModalProps {
    program: Program;
    onClose: () => void;
    onSuccess: () => void;
}

export function ShareProgramModal({ program, onClose, onSuccess }: ShareProgramModalProps) {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedulingType, setSchedulingType] = useState<'self_paced' | 'coach_led'>('self_paced');
    const [loading, setLoading] = useState(false);
    const [fetchingClients, setFetchingClients] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchClients();
        }
    }, [user]);

    const fetchClients = async () => {
        try {
            setFetchingClients(true);
            const { data, error } = await supabase
                .from('clients')
                .select('id, full_name, email')
                .eq('coach_id', user?.id)
                .order('full_name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setError('Impossible de charger la liste des clients.');
        } finally {
            setFetchingClients(false);
        }
    };

    const handleToggleClient = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSelectAll = () => {
        const filteredClientIds = filteredClients.map(c => c.id);
        const allSelected = filteredClientIds.every(id => selectedClients.includes(id));

        if (allSelected) {
            setSelectedClients(prev => prev.filter(id => !filteredClientIds.includes(id)));
        } else {
            setSelectedClients(prev => [...new Set([...prev, ...filteredClientIds])]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedClients.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + program.duration_weeks * 7);

            const clientsPrograms = selectedClients.map(clientId => ({
                client_id: clientId,
                program_id: program.id,
                start_date: startDate,
                end_date: endDate.toISOString().split('T')[0],
                progress: 0,
                status: 'active',
                scheduling_type: schedulingType, // Add the new field
            }));

            const { error } = await supabase
                .from('client_programs')
                .insert(clientsPrograms);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error assigning program:', error);
            setError('Une erreur est survenue lors de l\'assignation du programme.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Partager "{program.name}"
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Sélectionnez les clients à qui assigner ce programme
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            Date de début
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    {/* Client Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-300">
                                Clients ({selectedClients.length} sélectionné{selectedClients.length !== 1 ? 's' : ''})
                            </label>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                            >
                                {filteredClients.length > 0 && filteredClients.every(c => selectedClients.includes(c.id))
                                    ? 'Tout désélectionner'
                                    : 'Tout sélectionner'}
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="border border-white/10 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto min-h-[100px] bg-black/20 custom-scrollbar">
                            {fetchingClients ? (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                                    <p>Chargement des clients...</p>
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                                    <Search className="w-8 h-8 opacity-50 mb-2" />
                                    <p>{searchQuery ? 'Aucun résultat' : 'Aucun client trouvé'}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredClients.map(client => {
                                        const isSelected = selectedClients.includes(client.id);
                                        return (
                                            <div
                                                key={client.id}
                                                onClick={() => handleToggleClient(client.id)}
                                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${isSelected
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'border-gray-600 bg-transparent'
                                                    }`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                        {client.full_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scheduling Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Mode de planification
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSchedulingType('self_paced')}
                                className={`p-3 rounded-lg border text-left transition-all ${schedulingType === 'self_paced'
                                        ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    } `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Unlock className={`w-4 h-4 ${schedulingType === 'self_paced' ? 'text-blue-400' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${schedulingType === 'self_paced' ? 'text-white' : 'text-gray-300'}`}>
                                        Autonomie
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Le client gère son propre emploi du temps et avance à son rythme via le bouton "Séance suivante".
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSchedulingType('coach_led')}
                                className={`p-3 rounded-lg border text-left transition-all ${schedulingType === 'coach_led'
                                        ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    } `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className={`w-4 h-4 ${schedulingType === 'coach_led' ? 'text-purple-400' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${schedulingType === 'coach_led' ? 'text-white' : 'text-gray-300'}`}>
                                        Planifié / Encadré
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Vous définissez les dates des séances dans le calendrier. Le client voit uniquement ce qui est planifié.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedClients.length === 0}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Traitement...
                            </>
                        ) : (
                            <>
                                <Users className="w-4 h-4" />
                                Assigner
                                {selectedClients.length > 0 && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs ml-1">{selectedClients.length}</span>
                                )}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
