import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Loader2 } from 'lucide-react';

interface CalendarGridProps {
    clientId: string;
}

export function CalendarGrid({ clientId }: CalendarGridProps) {
    const {
        items,
        loading,
        startDate,
        endDate,
        moveItem,
        createItem,
        loadMorePast,
        loadMoreFuture
    } = useCalendar(clientId);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [addingToDate, setAddingToDate] = useState<Date | null>(null);
    const [copiedItem, setCopiedItem] = useState<CalendarItem | null>(null);

    // Infinite Scroll State
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const prevScrollHeightRef = useRef(0);
    const prevStartDateRef = useRef<Date | null>(null);

    // Scroll preservation when loading past items
    useEffect(() => {
        if (prevStartDateRef.current && startDate < prevStartDateRef.current && scrollRef.current) {
            // Start date moved back, meaning we loaded past items
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                scrollRef.current.scrollTop += diff;
            }
        }
        prevStartDateRef.current = startDate;
    }, [startDate]);

    const handleScroll = useCallback(async () => {
        if (!scrollRef.current || isLoadingMore) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const THRESHOLD = 300; // Trigger load when within 300px of edge

        // Load Past
        if (scrollTop < THRESHOLD) {
            setIsLoadingMore(true);
            prevScrollHeightRef.current = scrollHeight; // Capture height before update
            await loadMorePast();
            setIsLoadingMore(false);
        }

        // Load Future
        else if (scrollTop + clientHeight > scrollHeight - THRESHOLD) {
            setIsLoadingMore(true);
            await loadMoreFuture();
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, loadMorePast, loadMoreFuture]);


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
                position: 0,
                status: 'scheduled'
            });
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
            {/* Minimal Header */}
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
                {/* Scroll Indicator / Date Range Display if needed */}
                <div className="text-sm text-gray-400">
                    {format(startDate, 'dd MMM')} - {format(endDate, 'dd MMM')}
                </div>
            </div>

            {/* Sticky Day Headers */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-[#0f172a] flex-shrink-0 z-10 shadow-sm">
                {['Lun', 'Mar', 'Mer', ' Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Scrollable Grid Container */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b1121] relative scroll-smooth"
                    style={{ scrollBehavior: 'auto' }} // auto for smooth preservation JS hacks, smooth for user
                >
                    {/* Padding top/bottom for "load more" spinners? */}
                    {isLoadingMore && <div className="w-full h-8 flex items-center justify-center opacity-50"><Loader2 className="w-4 h-4 animate-spin" /></div>}

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

                    {isLoadingMore && <div className="w-full h-8 flex items-center justify-center opacity-50"><Loader2 className="w-4 h-4 animate-spin" /></div>}
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
                    onCreate={createItem} // createItem from hook matches signature
                />
            )}
        </div>
    );
}
