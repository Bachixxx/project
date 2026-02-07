import React, { useState } from 'react';
import { X, Dumbbell, StickyNote, Moon, Activity, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    clientId: string;
    onCreate: (item: any) => Promise<void>;
    onOpenBuilder: () => void; // New prop
}

type ItemType = 'session' | 'note' | 'rest' | 'metric';

export function CreateItemModal({ isOpen, onClose, date, clientId, onCreate, onOpenBuilder }: CreateItemModalProps) {
    const [type, setType] = useState<ItemType>('session');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title && type !== 'rest') return;

        setLoading(true);
        try {
            await onCreate({
                client_id: clientId,
                scheduled_date: format(date, 'yyyy-MM-dd'),
                item_type: type,
                title: type === 'rest' ? 'Jour de repos' : title,
                content: content ? { text: content } : {},
                position: 0,
                status: 'scheduled'
            });
            onClose();
            setTitle('');
            setContent('');
            setType('session');
        } catch (error) {
            console.error('Error creating item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBuilder = () => {
        onClose();
        onOpenBuilder();
    };

    const types: { id: ItemType; label: string; icon: any; color: string }[] = [
        { id: 'session', label: 'Séance', icon: Dumbbell, color: 'bg-blue-500' },
        { id: 'note', label: 'Note', icon: StickyNote, color: 'bg-amber-500' },
        { id: 'rest', label: 'Repos', icon: Moon, color: 'bg-indigo-500' },
        { id: 'metric', label: 'Métrique', icon: Activity, color: 'bg-green-500' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Ajouter</h2>
                            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                                <Calendar className="w-4 h-4" />
                                {format(date, 'd MMMM yyyy', { locale: fr })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-4 gap-2">
                            {types.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                    ${type === t.id
                                            ? `${t.color}/20 border-${t.color.replace('bg-', '')} text-white ring-1 ring-${t.color.replace('bg-', '')}`
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}
                                >
                                    <t.icon className={`w-6 h-6 ${type === t.id ? `text-${t.color.replace('bg-', '')}` : ''}`} />
                                    <span className="text-xs font-medium">{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Builder CTA */}
                        {type === 'session' && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-blue-500/20 transition-colors" onClick={handleOpenBuilder}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Créer une séance complète</h3>
                                        <p className="text-xs text-blue-200">Constructeur d'exercices & sets</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-500/20">
                                    Ouvrir
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {type === 'session' && (
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Ou ajout rapide</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>
                        )}

                        {/* Fields */}
                        {type !== 'rest' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={type === 'session' ? "Ex: Haut du corps" : "Titre de la note"}
                                        required
                                        autoFocus
                                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>

                                {(type === 'note' || type === 'session') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {type === 'session' ? 'Description (Optionnel)' : 'Contenu'}
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

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
                                disabled={loading || (!title && type !== 'rest')}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : (type === 'session' ? 'Créer Simple' : 'Créer')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
