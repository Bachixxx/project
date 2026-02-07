import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dumbbell, StickyNote, Moon, Activity, GripVertical, CheckCircle, Clock, Copy } from 'lucide-react';
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
}

export function CalendarItem({ item, isOverlay, onCopy }: CalendarItemProps) {
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
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                            <StickyNote className="w-4 h-4" />
                            <span className="font-bold text-sm">Note</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-snug">{item.title}</p>
                    </div>
                );

            case 'rest':
                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Moon className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-300 text-sm">Repos</span>
                            <div className="text-xs text-gray-500">Récupération active</div>
                        </div>
                    </div>
                );

            case 'session':
            default:
                // Default to session view
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                            <h4 className="font-bold text-white text-sm line-clamp-2">{item.title}</h4>
                            {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.session?.duration_minutes || 60} min</span>
                            </div>
                            {item.start && (
                                <div className="flex items-center gap-1 text-gray-500">
                                    <span>•</span>
                                    <span>{format(new Date(item.start), 'HH:mm')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    const baseClasses = `
    relative group rounded-lg p-3 border border-white/5 
    hover:border-white/10 hover:bg-white/10 transition-all 
    cursor-pointer select-none mb-2 shadow-sm
  `;

    const typeClasses = item.item_type === 'note'
        ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
        : item.item_type === 'rest'
            ? 'bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10'
            : 'bg-[#1e293b] border-l-4';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${baseClasses} ${typeClasses} ${item.item_type === 'session' ? getStatusColor(item.status) : ''}`}
            {...attributes}
            {...listeners}
        >
            {/* Actions (Visible on Hover) */}
            {!isOverlay && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onCopy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(item); }}
                            className="p-1 hover:bg-white/20 rounded text-gray-400 hover:text-white"
                            title="Dupliquer"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                    )}
                    <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-white p-1">
                        <GripVertical className="w-3 h-3" />
                    </div>
                </div>
            )}
            {renderContent()}
        </div>
    );
}
