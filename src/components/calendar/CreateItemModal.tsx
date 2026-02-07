import React, { useState, useEffect } from 'react';
import { X, Dumbbell, StickyNote, Moon, Activity, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SessionSelector } from '../library/SessionSelector';

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    clientId: string;
    onCreate: (item: any) => Promise<void>;
    onUpdate?: (id: string, item: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    itemToEdit?: any;
    onOpenBuilder: () => void;
}

type ItemType = 'session' | 'note' | 'rest' | 'metric';

export function CreateItemModal({ isOpen, onClose, date, clientId, onCreate, onUpdate, onDelete, itemToEdit, onOpenBuilder }: CreateItemModalProps) {
    const [type, setType] = useState<ItemType>(itemToEdit?.item_type || 'session');
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content?.text || '');
    const [sessionId, setSessionId] = useState<string | null>(itemToEdit?.session?.id || null);
    const [showSessionSelector, setShowSessionSelector] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setType(itemToEdit.item_type || 'session');
            setTitle(itemToEdit.title || '');
            setContent(itemToEdit.content?.text || '');
            setSessionId(itemToEdit.session?.id || null);
        } else {
            setType('session');
            setTitle('');
            setContent('');
            setSessionId(null);
        }
    }, [itemToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title && type !== 'rest') return;

        setLoading(true);
        try {
            const itemData = {
                client_id: clientId,
                scheduled_date: format(date, 'yyyy-MM-dd'),
                item_type: type,
                title: type === 'rest' ? 'Jour de repos' : title,
                content: content ? { text: content } : {},
                position: itemToEdit?.position || 0,
                status: itemToEdit?.status || 'scheduled',
                session_id: sessionId
            };

            if (itemToEdit && onUpdate) {
                await onUpdate(itemToEdit.id, itemData);
            } else {
                await onCreate(itemData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToEdit || !onDelete || !window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
        setLoading(true);
        try {
            await onDelete(itemToEdit.id);
            onClose();
        } catch (error) {
            console.error('Error deleting item:', error);
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
                            <h2 className="text-2xl font-bold text-white">{itemToEdit ? 'Modifier' : 'Ajouter'}</h2>
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
                        {/* Type Selection - Disable if editing? Maybe allow changing type for simple items */}
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

                        {/* Builder CTA - Only show if not editing or if we want to allow converting to builder? Let's hide for now on edit to keep simple */}
                        {!itemToEdit && type === 'session' && (
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

                        {/* Import from Library Button */}
                        {!itemToEdit && type === 'session' && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-purple-500/20 transition-colors mt-2" onClick={() => setShowSessionSelector(true)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Importer de la bibliothèque</h3>
                                        <p className="text-xs text-purple-200">Choisir un template existant</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-500/20">
                                    Choisir
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {!itemToEdit && type === 'session' && (
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

                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            {itemToEdit ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium text-sm"
                                >
                                    Supprimer
                                </button>
                            ) : <div></div>}

                            <div className="flex gap-3">
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
                                    {loading ? 'Enregistrement...' : (itemToEdit ? 'Modifier' : (type === 'session' ? 'Créer Simple' : 'Créer'))}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div >

            {showSessionSelector && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <SessionSelector
                        onSelect={(session) => {
                            setTitle(session.name);
                            setSessionId(session.id);
                            // Optional: load description into content?
                            if (session.description) {
                                setContent(session.description);
                            }
                            setShowSessionSelector(false);
                        }}
                        onClose={() => setShowSessionSelector(false)}
                    />
                </div>
            )
            }
        </div >
    );
}
