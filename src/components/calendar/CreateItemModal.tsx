import React, { useState, useEffect } from 'react';
import { X, Dumbbell, StickyNote, Moon, Activity, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SessionSelector } from '../library/SessionSelector';
import { supabase } from '../../lib/supabase';

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    clientId: string;
    onCreate: (item: any) => Promise<void>;
    onUpdate?: (id: string, item: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    itemToEdit?: any;
    onOpenBuilder: (builderData?: any) => void;
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
                title: type === 'rest' ? 'Jour de repos' : (type === 'metric' && !title ? 'Jour de Pesée' : title),
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

        const tempItemData = {
            id: itemToEdit?.id,
            title: title || (type === 'rest' ? 'Jour de repos' : ''),
            content: { text: content },
            scheduled_date: date,
            session_id: sessionId
        };

        onOpenBuilder(tempItemData);
    };

    const types: { id: ItemType; label: string; icon: any; color: string }[] = [
        { id: 'session', label: 'Séance', icon: Dumbbell, color: 'bg-blue-500' },
        { id: 'note', label: 'Note', icon: StickyNote, color: 'bg-amber-500' },
        { id: 'rest', label: 'Repos', icon: Moon, color: 'bg-indigo-500' },
        { id: 'metric', label: 'Pesée / Biométrie', icon: Activity, color: 'bg-green-500' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            {/* Modal Container */}
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-scale-in">
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {itemToEdit ? 'Modifier' : 'Ajouter un élément'}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">
                                    {format(date, 'd MMMM yyyy', { locale: fr })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type Selection - Segmented Control Style */}
                        <div className="flex bg-[#1e293b] p-1.5 rounded-2xl border border-white/5 relative">
                            {types.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setType(t.id);
                                        if (t.id === 'metric') {
                                            setTitle('Jour de Pesée');
                                        } else if (t.id === 'rest') {
                                            setTitle('Jour de repos');
                                        } else {
                                            setTitle(itemToEdit?.title || '');
                                        }
                                    }}
                                    className={`
                                        flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 relative z-10
                                        ${type === t.id
                                            ? 'text-white'
                                            : 'text-gray-500 hover:text-gray-300'}
                                    `}
                                >
                                    {type === t.id && (
                                        <div className={`absolute inset-0 rounded-xl shadow-lg border border-white/10 z-0 bg-[#0f172a]`}></div>
                                    )}
                                    <t.icon className={`w-5 h-5 relative z-10 ${type === t.id ? `text-${t.color.replace('bg-', '')}` : ''} transition-colors`} />
                                    <span className={`text-[11px] font-semibold relative z-10 transition-colors uppercase tracking-wider ${type === t.id ? 'text-white' : ''}`}>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Builder CTA */}
                        {type === 'session' && (
                            <div
                                className="group relative bg-[#1e293b] border border-blue-500/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e293b]/80 transition-all hover:border-blue-500/30 overflow-hidden"
                                onClick={handleOpenBuilder}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Dumbbell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm tracking-wide">{itemToEdit ? "Modifier la séance" : "Créer une séance"}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Éditeur avancé d'exercices</p>
                                    </div>
                                </div>
                                <div className="relative z-10 px-4 py-2 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors text-xs font-bold rounded-xl whitespace-nowrap">
                                    {itemToEdit ? 'Ouvrir' : 'Nouveau'}
                                </div>
                            </div>
                        )}

                        {/* Import from Library Button */}
                        {!itemToEdit && type === 'session' && (
                            <div
                                className="group relative bg-[#1e293b] border border-purple-500/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e293b]/80 transition-all hover:border-purple-500/30 overflow-hidden mt-3"
                                onClick={() => setShowSessionSelector(true)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm tracking-wide">Bibliothèque</h3>
                                        <p className="text-xs text-slate-400 mt-1">Importer un template</p>
                                    </div>
                                </div>
                                <div className="relative z-10 px-4 py-2 bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors text-xs font-bold rounded-xl whitespace-nowrap">
                                    Choisir
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {!itemToEdit && type === 'session' && (
                            <div className="relative flex items-center py-1">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold tracking-widest uppercase">Ou ajout rapide</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>
                        )}

                        {/* Fields */}
                        {type !== 'rest' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2 ml-1">Titre</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={type === 'session' ? "Ex: Renforcement Haut du corps" : "Titre de l'élément"}
                                        required
                                        autoFocus
                                        className="w-full rounded-2xl bg-[#1e293b] border border-white/5 text-white p-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                {(type === 'note' || type === 'session' || type === 'metric') && (
                                    <div>
                                        <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2 ml-1">
                                            {type === 'session' ? 'Description (Optionnel)' : 'Contenu'}
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={3}
                                            placeholder={type === 'session' ? "Détails supplémentaires..." : "Saisissez les informations..."}
                                            className="w-full rounded-2xl bg-[#1e293b] border border-white/5 text-white p-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-600"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-6 mt-4">
                            {itemToEdit ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 transition-colors font-bold text-sm tracking-wide"
                                >
                                    Supprimer
                                </button>
                            ) : <div></div>}

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (!title && type !== 'rest')}
                                    className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:shadow-none"
                                >
                                    {loading ? 'Patientez...' : (itemToEdit ? 'Enregistrer' : 'Créer')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showSessionSelector && (
                <SessionSelector
                    onSelect={(session) => {
                        setTitle(session.name);
                        setSessionId(session.id);
                        if (session.description) {
                            setContent(session.description);
                        }
                        setShowSessionSelector(false);
                    }}
                    onClose={() => setShowSessionSelector(false)}
                />
            )}
        </div>
    );
}
