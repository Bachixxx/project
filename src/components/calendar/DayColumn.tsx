import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarItem } from './CalendarItem';
import { format, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, ClipboardPaste } from 'lucide-react';

interface DayColumnProps {
    date: Date;
    items: any[];
    onAddItem: (date: Date) => void;
    hasCopiedItem?: boolean;
    onPaste?: (date: Date) => void;
    onCopyItem?: (item: any) => void;
}

export function DayColumn({ date, items, onAddItem, hasCopiedItem, onPaste, onCopyItem }: DayColumnProps) {
    const { setNodeRef } = useDroppable({
        id: `day-${format(date, 'yyyy-MM-dd')}`,
        data: { date }
    });

    const isCurrentDay = isToday(date);
    const dayName = format(date, 'EEEE', { locale: fr });

    return (
        <div
            ref={setNodeRef}
            className={`
        w-full min-h-[150px] bg-[#0f172a] border border-white/5 rounded-2xl flex flex-col md:flex-row overflow-hidden transition-colors
        ${isCurrentDay ? 'bg-blue-900/10 border-blue-500/20' : ''}
      `}
        >
            {/* Header */}
            <div
                className={`
          flex flex-row md:flex-col items-center md:justify-center justify-between p-4 border-b md:border-b-0 md:border-r border-white/5 md:w-32 bg-black/20
          ${isCurrentDay ? 'text-blue-400' : 'text-gray-400'}
        `}
            >
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">{dayName}</span>
                    <span className={`text-2xl font-black ${isCurrentDay ? 'text-white' : 'text-gray-300'}`}>
                        {format(date, 'd', { locale: fr })}
                    </span>
                    <span className="text-xs font-medium opacity-60 uppercase">{format(date, 'MMM', { locale: fr })}</span>
                </div>

                {/* Mobile Add Button (Visible only on small screens if empty?) - Actually let's keep the main add button in content area */}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <SortableContext
                    id={`sortable-day-${format(date, 'yyyy-MM-dd')}`}
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        <CalendarItem
                            key={item.id}
                            item={item}
                            onCopy={onCopyItem}
                        />
                    ))}
                </SortableContext>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-2">
                    {hasCopiedItem && onPaste && (
                        <button
                            onClick={() => onPaste(date)}
                            className="w-full py-2 border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 gap-2 transition-all"
                        >
                            <ClipboardPaste className="w-4 h-4" />
                            <span className="text-sm font-medium">Coller</span>
                        </button>
                    )}

                    <button
                        onClick={() => onAddItem(date)}
                        className={`
                w-full py-3 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center
                text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all
                ${items.length === 0 ? 'h-32' : ''}
                group
            `}
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
