import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import { DayColumn } from './DayColumn';
import { CalendarItem as CalendarItemComponent } from './CalendarItem';
import { CreateItemModal } from './CreateItemModal';
import { useCalendar, CalendarItem } from '../../hooks/useCalendar';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CalendarGridProps {
    clientId: string;
}

export function CalendarGrid({ clientId }: CalendarGridProps) {
    const {
        items,
        loading,
        startDate,
        endDate,
        setCurrentDate,
        moveItem,
        createItem
    } = useCalendar(clientId);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [addingToDate, setAddingToDate] = useState<Date | null>(null);
    const [copiedItem, setCopiedItem] = useState<CalendarItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Visual feedback
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        let containerDateStr = '';
        if (overId.startsWith('day-')) {
            containerDateStr = overId.replace('day-', '');
        } else {
            const overItem = items.find(i => i.id === overId);
            if (overItem) {
                containerDateStr = overItem.scheduled_date;
            }
        }

        if (!containerDateStr) return;

        const draggedItem = items.find(i => i.id === activeId);
        if (!draggedItem) return;

        const newDate = parseISO(containerDateStr);

        // If dropped effectively on the same day, we might want to reorder
        // But for now, just moveItem handles date update.
        if (draggedItem.scheduled_date !== containerDateStr) {
            moveItem(activeId, newDate, draggedItem.position);
        }
    };

    const handleCopyItem = (item: any) => {
        setCopiedItem(item);
    };

    const handlePasteItem = async (date: Date) => {
        if (!copiedItem) return;

        try {
            await createItem({
                client_id: clientId,
                scheduled_date: format(date, 'yyyy-MM-dd'),
                item_type: copiedItem.item_type,
                title: copiedItem.title + (copiedItem.title.includes('(Copie)') ? '' : ' (Copie)'),
                content: copiedItem.content,
                position: 0, // Should find max position + 1
                status: 'scheduled'
            });
            // Optional: clear clipboard or keep it for multiple pastes
            // setCopiedItem(null); 
        } catch (error) {
            console.error('Failed to paste item', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const activeItem = activeId ? items.find(i => i.id === activeId) : null;

    return (
        <div className="flex flex-col h-full bg-[#0b1121] text-white overflow-hidden">
            {/* Navigation Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0f172a]">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Planning</h2>
                    {copiedItem && (
                        <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg flex items-center gap-2">
                            <span>Élément copié : {copiedItem.title}</span>
                            <button onClick={() => setCopiedItem(null)} className="hover:text-white">✕</button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentDate(d => new Date(new Date(d).setDate(d.getDate() - 7)))}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-mono text-gray-400 capitalize">
                        {format(startDate, 'dd MMM', { locale: (window as any).navigator?.language === 'fr' ? undefined : undefined })} - {format(endDate, 'dd MMM')}
                    </span>
                    <button
                        onClick={() => setCurrentDate(d => new Date(new Date(d).setDate(d.getDate() + 7)))}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-[#0f172a] flex-shrink-0">
                {['Lun', 'Mar', 'Mer', ' Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Container */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b1121]">
                    <div className="grid grid-cols-7 min-h-full border-l border-white/5">
                        {days.map((day) => {
                            const dayItems = items.filter(i => isSameDay(parseISO(i.scheduled_date), day));
                            return (
                                <div key={day.toISOString()} className="min-h-[200px] border-r border-b border-white/5">
                                    <DayColumn
                                        date={day}
                                        items={dayItems}
                                        onAddItem={(d) => setAddingToDate(d)}
                                        hasCopiedItem={!!copiedItem}
                                        onPaste={handlePasteItem}
                                        onCopyItem={handleCopyItem}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DragOverlay>
                    {activeItem ? (
                        <CalendarItemComponent item={activeItem as any} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Add Item Modal */}
            {addingToDate && (
                <CreateItemModal
                    isOpen={true}
                    onClose={() => setAddingToDate(null)}
                    date={addingToDate}
                    clientId={clientId}
                    onCreate={createItem}
                />
            )}
        </div>
    );
}
