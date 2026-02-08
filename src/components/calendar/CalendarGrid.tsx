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
import { eachDayOfInterval, format, isSameDay, parseISO, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WorkoutBuilderDrawer } from './WorkoutBuilderDrawer';
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
        updateItem,
        deleteItem,
        loadMorePast,
        loadMoreFuture
    } = useCalendar(clientId);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [addingToDate, setAddingToDate] = useState<Date | null>(null);
    const [copiedItem, setCopiedItem] = useState<CalendarItem | null>(null);

    // active builder state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [builderDate, setBuilderDate] = useState<Date | null>(null);

    // Visible Month State
    const [visibleMonth, setVisibleMonth] = useState<string>('');

    // Infinite Scroll State
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const prevScrollHeightRef = useRef(0);
    const prevStartDateRef = useRef<Date | null>(null);
    const hasScrolledToTodayRef = useRef(false);

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

    // Initial Scroll to Today
    useEffect(() => {
        if (!loading && items.length > 0 && !hasScrolledToTodayRef.current && scrollRef.current) {
            // Find the element for today or start of this week
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            // We use data-date attribute to find the element
            const todayEl = scrollRef.current.querySelector(`[data-date="${todayStr}"]`);

            if (todayEl) {
                // Scroll to align top of today with top of container
                // We subtract a bit of padding if needed, or align to start
                todayEl.scrollIntoView({ block: 'start' });
                hasScrolledToTodayRef.current = true;

                // Set initial visible month
                setVisibleMonth(format(today, 'MMMM yyyy', { locale: fr }));
            }
        }
    }, [loading, items]);

    const handleScroll = useCallback(async () => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        // Update Visible Month Badge
        const gridContainer = scrollRef.current.querySelector('.grid-container');
        if (gridContainer) {
            const estimatedRowIndex = Math.floor(scrollTop / 200);
            const estimatedDayIndex = estimatedRowIndex * 7;
            const days = eachDayOfInterval({ start: startDate, end: endDate });

            if (days[estimatedDayIndex]) {
                const monthStr = format(days[estimatedDayIndex], 'MMMM yyyy', { locale: fr });
                setVisibleMonth(monthStr.charAt(0).toUpperCase() + monthStr.slice(1));
            }
        }

        if (isLoadingMore) return;

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
    }, [isLoadingMore, loadMorePast, loadMoreFuture, startDate, endDate]);


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
    const today = new Date();

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

    // --- Edit / Delete Logic ---
    const [itemToEdit, setItemToEdit] = useState<any>(null);

    const [builderInitialData, setBuilderInitialData] = useState<any>(null);

    // --- Updated handleItemClick ---
    const handleItemClick = (item: any) => {
        // Check if it's a builder session
        const isBuilderSession = item.item_type === 'session' && item.content?.modules;

        if (isBuilderSession) {
            setBuilderDate(new Date(item.scheduled_date));
            setBuilderInitialData(item);
            setIsBuilderOpen(true);
        } else {
            // Open standard modal
            setItemToEdit(item);
            setAddingToDate(new Date(item.scheduled_date));
        }
    };

    // --- Builder Logic ---
    const handleOpenBuilderFromModal = () => {
        if (addingToDate) {
            setBuilderDate(addingToDate);
            setAddingToDate(null); // Close modal
            setIsBuilderOpen(true);
        }
    };

    const handleSaveWorkout = async (workoutData: any) => {
        if (!builderDate) return;

        // Check if workoutData has a specific scheduled_date (with time)
        const dateToUse = workoutData.scheduled_date
            ? (workoutData.scheduled_date instanceof Date ? workoutData.scheduled_date.toISOString() : workoutData.scheduled_date)
            : format(builderDate, 'yyyy-MM-dd');

        await createItem({
            client_id: clientId,
            scheduled_date: dateToUse,
            item_type: 'session',
            title: workoutData.title,
            content: workoutData.content || {}, // ensure content is passed
            position: 0,
            status: 'scheduled'
        });

        setIsBuilderOpen(false);
        setBuilderDate(null);
    };

    if (loading && !items.length) {
        return (
            <div className="flex items-center justify-center p-12 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const activeItem = activeId ? items.find(i => i.id === activeId) : null;

    return (
        <div className="flex flex-col h-full bg-[#0b1121] text-white overflow-hidden relative">
            {/* Floating Month Badge */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full shadow-lg text-sm font-medium text-white transition-all duration-300">
                    {visibleMonth || format(today, 'MMMM yyyy', { locale: fr })}
                </div>
            </div>

            {/* Minimal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0f172a] z-30">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Planning</h2>
                    {copiedItem && (
                        <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg flex items-center gap-2">
                            <span>Élément copié : {copiedItem.title}</span>
                            <button onClick={() => setCopiedItem(null)} className="hover:text-white">✕</button>
                        </div>
                    )}
                </div>
                <div className="text-sm text-gray-400">
                    <button
                        onClick={() => {
                            if (scrollRef.current) {
                                const todayStr = format(new Date(), 'yyyy-MM-dd');
                                const todayEl = scrollRef.current.querySelector(`[data-date="${todayStr}"]`);
                                if (todayEl) todayEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
                            }
                        }}
                        className="hover:text-white transition-colors"
                    >
                        Aujourd'hui
                    </button>
                </div>
            </div>

            {/* Sticky Day Headers */}
            <div className="hidden md:grid grid-cols-7 border-b border-white/10 bg-[#0f172a] flex-shrink-0 z-10 shadow-sm">
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
                >
                    {/* Padding top for "load more" */}
                    {isLoadingMore && <div className="w-full h-8 flex items-center justify-center opacity-50 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>}

                    <div className="grid grid-cols-1 md:grid-cols-7 min-h-full border-l border-white/5 grid-container">
                        {days.map((day) => {
                            const dayItems = items.filter(i => isSameDay(parseISO(i.scheduled_date), day));
                            const isCurrentWeek = isSameWeek(day, today, { weekStartsOn: 1 });
                            const dayStr = format(day, 'yyyy-MM-dd');

                            return (
                                <div
                                    key={day.toISOString()}
                                    data-date={dayStr}
                                    className={`
                                        min-h-[200px] border-b border-white/5 relative
                                        md:border-r md:border-b-0
                                        ${isCurrentWeek ? 'bg-blue-900/[0.03]' : ''}
                                    `}
                                >
                                    {/* Current Week Sideline Indicator (Optional, maybe on Monday) */}
                                    {isCurrentWeek && day.getDay() === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/20 -ml-[1px]" />
                                    )}

                                    <DayColumn
                                        date={day}
                                        items={dayItems}
                                        onAddItem={(d) => setAddingToDate(d)}
                                        hasCopiedItem={!!copiedItem}
                                        onPaste={handlePasteItem}
                                        onCopyItem={handleCopyItem}
                                        onItemClick={handleItemClick}
                                        onDeleteItem={deleteItem}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {isLoadingMore && <div className="w-full h-8 flex items-center justify-center opacity-50 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                </div>

                <DragOverlay>
                    {activeItem ? (
                        <CalendarItemComponent item={activeItem as any} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Add/Edit Item Modal */}
            {(addingToDate || itemToEdit) && (
                <CreateItemModal
                    isOpen={true}
                    onClose={() => {
                        setAddingToDate(null);
                        setItemToEdit(null);
                    }}
                    date={addingToDate || new Date(itemToEdit.scheduled_date)}
                    clientId={clientId}
                    onCreate={createItem}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                    itemToEdit={itemToEdit}
                    onOpenBuilder={handleOpenBuilderFromModal}
                />
            )}

            {/* Workout Builder Drawer */}
            <WorkoutBuilderDrawer
                isOpen={isBuilderOpen}
                onClose={() => {
                    setIsBuilderOpen(false);
                    setBuilderDate(null);
                    setBuilderInitialData(null);
                }}
                onSave={handleSaveWorkout}
                onDelete={deleteItem}
                initialDate={builderDate || new Date()}
                clientId={clientId}
                initialData={builderInitialData}
            />
        </div>
    );
}
