import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dumbbell, StickyNote, Moon, Activity, GripVertical, CheckCircle, Clock, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CalendarItemProps {
    item: {
        id: string;
        item_type?: 'session' | 'note' | 'rest' | 'metric';
        title: string;
        content?: any;
        status: string;
        session?: {
            duration_minutes: number;
            difficulty_level?: string;
        } | null;
        start?: Date; // For time-specific items
    };
    attributes?: any;
    listeners?: any;
    isOverlay?: boolean;
    onCopy?: (item: any) => void;
    onClick?: (item: any) => void;
    onDelete?: (id: string) => void;
}

export function CalendarItem({ item, isOverlay, onCopy, onClick, onDelete }: CalendarItemProps) {
    const {
        setNodeRef,
        transform,
        transition,
        isDragging,
        attributes,
        listeners,
    } = useSortable({
        id: item.id,
        data: item
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'border-l-green-500 bg-green-500/5';
            case 'missed': return 'border-l-red-500 bg-red-500/5';
            default: return 'border-l-blue-500 bg-blue-500/5';
        }
    };

    const renderContent = () => {
        switch (item.item_type) {
            case 'note':
                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-amber-500 mb-0.5">
                            <StickyNote className="w-3.5 h-3.5" />
                            <span className="font-semibold text-xs uppercase tracking-wide">Note</span>
                        </div>
                        <p className="text-sm font-medium text-white/90 leading-snug truncate">{item.title}</p>
                    </div>
                );

            case 'rest':
                return (
                    <div className="flex items-center gap-2.5 py-0.5">
                        <div className="w-7 h-7 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Moon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-white/90 text-sm">Repos</span>
                            <span className="text-[11px] text-gray-400 font-medium">Récupération active</span>
                        </div>
                    </div>
                );

            case 'metric':
                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-green-500 mb-0.5">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="font-semibold text-xs uppercase tracking-wide">Pesée / Biométrie</span>
                        </div>
                        <p className="text-sm font-medium text-white/90 leading-snug truncate">{item.title}</p>
                    </div>
                );

            case 'session':
            default:
                // Default to session view
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between min-h-[20px]">
                            <h4 className="font-semibold text-white/95 text-sm leading-tight line-clamp-2 pr-1">{item.title}</h4>
                            {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-1 mt-0.5" />}
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] font-medium text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span>{item.session?.duration_minutes || 60} min</span>
                            </div>
                            {item.start && (
                                <div className="flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                    <span>{format(new Date(item.start), 'HH:mm')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    const baseClasses = `
    relative group rounded-md px-3 py-2.5 border border-white/5 
    hover:border-white/10 hover:bg-white/10 transition-all duration-200
    cursor-pointer select-none mb-2 shadow-sm
  `;

    const typeClasses = item.item_type === 'note'
        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50'
        : item.item_type === 'rest'
            ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50'
            : item.item_type === 'metric'
                ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50'
                : 'bg-[#1e293b] border-l-4';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${baseClasses} ${typeClasses} ${item.item_type === 'session' ? getStatusColor(item.status) : ''}`}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if (isDragging) return;
                // Don't trigger click if we clicked an action button
                if ((e.target as HTMLElement).closest('button')) return;
                onClick?.(item);
            }}
        >
            {/* Actions (Visible on Hover) */}
            {!isOverlay && (
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {onCopy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(item); }}
                            className="p-1.5 bg-[#0f172a]/80 hover:bg-blue-600 rounded-md text-gray-300 hover:text-white shadow-sm transition-colors backdrop-blur-sm"
                            title="Dupliquer"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Supprimer cet élément ?')) onDelete(item.id);
                            }}
                            className="p-1.5 bg-[#0f172a]/80 hover:bg-red-500 rounded-md text-gray-300 hover:text-white shadow-sm transition-colors backdrop-blur-sm"
                            title="Supprimer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
            {renderContent()}
        </div>
    );
}
