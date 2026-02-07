import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarItem } from './CalendarItem';
import { format, isToday } from 'date-fns';
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

    return (
        <div
            ref={setNodeRef}
            className={`
        w-full h-full min-h-[150px] flex flex-col transition-colors relative group
        ${isCurrentDay ? 'bg-blue-900/5' : 'hover:bg-white/[0.02]'}
      `}
        >
            {/* Header (Date Number) */}
            <div className={`p-2 text-right text-xs font-bold mb-1 ${isCurrentDay ? 'text-blue-400' : 'text-gray-500'}`}>
                {format(date, 'd')}
            </div>

            {/* Items List */}
            <div className="flex-1 px-2 pb-2 space-y-2">
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
                <div className="flex flex-col gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasCopiedItem && onPaste && (
                        <button
                            onClick={() => onPaste(date)}
                            className="w-full py-1 border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 gap-1 transition-all"
                        >
                            <ClipboardPaste className="w-3 h-3" />
                            <span className="text-xs font-medium">Coller</span>
                        </button>
                    )}

                    <button
                        onClick={() => onAddItem(date)}
                        className={`
                w-full py-2 border border-dashed border-white/5 rounded-lg flex items-center justify-center
                text-gray-600 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all
            `}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
