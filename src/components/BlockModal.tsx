import React, { useState } from 'react';
import { ResponsiveModal } from './ResponsiveModal';
import { Dumbbell, Clock, Zap, Repeat } from 'lucide-react';
import { SessionBlock } from './BlockManager';

interface BlockModalProps {
    block?: SessionBlock | null;
    onClose: () => void;
    onSave: (blockData: any) => void;
}

export function BlockModal({ block, onClose, onSave }: BlockModalProps) {
    const [type, setType] = useState<'regular' | 'circuit' | 'amrap' | 'interval'>(block?.type || 'regular');
    const [name, setName] = useState(block?.name || '');
    const [rounds, setRounds] = useState(block?.rounds || 3);
    const [durationMinutes, setDurationMinutes] = useState(block?.duration_seconds ? block.duration_seconds / 60 : 10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name || (type === 'circuit' ? 'Circuit' : type === 'amrap' ? 'AMRAP' : type === 'interval' ? 'Intervalle' : 'Bloc Standard'),
            type,
            rounds: type === 'circuit' ? rounds : 1,
            duration_seconds: (type === 'amrap' || type === 'interval') ? durationMinutes * 60 : null,
        });
    };

    const types = [
        { id: 'regular', label: 'Standard', icon: Dumbbell, desc: 'Séries classiques, échauffement, retour au calme.', color: 'emerald' },
        { id: 'interval', label: 'Intervalle', icon: Clock, desc: 'Entraînement par intervalles (HIIT, Tabata).', color: 'blue' },
        { id: 'amrap', label: 'AMRAP', icon: Zap, desc: 'Autant de tours que possible dans un temps imparti.', color: 'orange' },
        { id: 'circuit', label: 'Circuit', icon: Repeat, desc: 'Enchaînement d’exercices sur plusieurs tours.', color: 'purple' },
    ];

    return (
        <ResponsiveModal isOpen={true} onClose={onClose} title={block ? "Modifier le bloc" : "Ajouter un bloc"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!block && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {types.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setType(t.id as any)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${type === t.id
                                        ? `border-${t.color}-500 bg-${t.color}-500/10`
                                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${type === t.id ? `bg-${t.color}-500 text-white` : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <t.icon className="w-5 h-5" />
                                </div>
                                <h4 className={`font-bold ${type === t.id ? 'text-white' : 'text-gray-300'}`}>{t.label}</h4>
                                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom du bloc</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nom personnalisé..."
                        className="input-field"
                    />
                </div>

                {type === 'circuit' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de tours</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={rounds}
                            onChange={(e) => setRounds(parseInt(e.target.value))}
                            className="input-field"
                        />
                    </div>
                )}

                {(type === 'amrap' || type === 'interval') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Durée (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                            className="input-field"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="primary-button">{block ? 'Sauvegarder' : 'Ajouter le bloc'}</button>
                </div>
            </form>
        </ResponsiveModal>
    );
}
