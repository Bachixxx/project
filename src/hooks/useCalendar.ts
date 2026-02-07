import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO } from 'date-fns';

export interface CalendarItem {
    id: string;
    client_id: string;
    item_type: 'session' | 'note' | 'rest' | 'metric';
    title: string;
    position: number;
    content: any;
    scheduled_date: string;
    status: string;
    session?: {
        id: string;
        name: string;
        duration_minutes: number;
        difficulty_level?: string;
    } | null;
}

export function useCalendar(clientId: string, initialDate: Date = new Date()) {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(initialDate);

    // Dynamic Loaded Range
    const [loadedStart, setLoadedStart] = useState(() => startOfWeek(addWeeks(initialDate, -2), { weekStartsOn: 1 }));
    const [loadedEnd, setLoadedEnd] = useState(() => endOfWeek(addWeeks(initialDate, 2), { weekStartsOn: 1 }));

    // Helper to fetch range
    const fetchRange = async (start: Date, end: Date) => {
        if (!clientId) return [];

        try {
            const { data, error } = await supabase
                .from('scheduled_sessions')
                .select(`
          id,
          client_id,
          item_type,
          title,
          position,
          content,
          scheduled_date,
          status,
          session:sessions (
            id,
            name,
            duration_minutes,
            difficulty_level
          )
        `)
                .eq('client_id', clientId)
                .gte('scheduled_date', format(start, 'yyyy-MM-dd'))
                .lte('scheduled_date', format(end, 'yyyy-MM-dd'))
                .order('scheduled_date', { ascending: true })
                .order('position', { ascending: true });

            if (error) throw error;
            return data as any || [];
        } catch (err) {
            console.error('Error fetching range:', err);
            return [];
        }
    };

    // Initial Load
    const loadInitial = useCallback(async () => {
        setLoading(true);
        const data = await fetchRange(loadedStart, loadedEnd);
        setItems(data);
        setLoading(false);
    }, [clientId, loadedStart, loadedEnd]);

    // We only run initial load once (or when clientId changes significantly), 
    // but here we depend on loadedStart keys. 
    // To strictly control "initial" vs "updates", we might want a ref, but simple useEffect is fine for now.
    useEffect(() => {
        loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);
    // Only fetch on mount/clientId change. Subsequent fetches are manual loadMore.

    const loadMorePast = useCallback(async () => {
        const newStart = addWeeks(loadedStart, -2);
        const endOfBlock = new Date(loadedStart.getTime() - 1); // just before current start

        const newItems = await fetchRange(newStart, endOfBlock);

        setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const filteredNew = newItems.filter((i: CalendarItem) => !existingIds.has(i.id));
            return [...filteredNew, ...prev];
        });
        setLoadedStart(newStart);
    }, [clientId, loadedStart]);

    const loadMoreFuture = useCallback(async () => {
        const newEnd = addWeeks(loadedEnd, 2);
        const startOfBlock = new Date(loadedEnd.getTime() + 1); // just after current end

        const newItems = await fetchRange(startOfBlock, newEnd);

        setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const filteredNew = newItems.filter((i: CalendarItem) => !existingIds.has(i.id));
            return [...prev, ...filteredNew];
        });
        setLoadedEnd(newEnd);
    }, [clientId, loadedEnd]);

    // Refresh current view
    const fetchItems = useCallback(async () => {
        // Reloads everything in current window
        setLoading(true);
        const data = await fetchRange(loadedStart, loadedEnd);
        setItems(data);
        setLoading(false);
    }, [clientId, loadedStart, loadedEnd]);

    const moveItem = async (itemId: string, newDate: Date, newPosition: number) => {
        const oldItems = [...items];
        const itemToMove = items.find(i => i.id === itemId);
        if (!itemToMove) return;

        const otherItems = items.filter(i => i.id !== itemId);
        const updatedItem = {
            ...itemToMove,
            scheduled_date: format(newDate, 'yyyy-MM-dd'),
            position: newPosition
        };

        setItems([...otherItems, updatedItem]);

        try {
            const { error } = await supabase
                .from('scheduled_sessions')
                .update({
                    scheduled_date: updatedItem.scheduled_date,
                    position: newPosition
                })
                .eq('id', itemId);

            if (error) throw error;
        } catch (err) {
            console.error('Error moving item:', err);
            setItems(oldItems);
        }
    };

    const createItem = async (newItem: Omit<CalendarItem, 'id'>) => {
        const tempId = crypto.randomUUID();
        const optimisticItem = { ...newItem, id: tempId };

        setItems([...items, optimisticItem as CalendarItem]);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('scheduled_sessions')
                .insert([{
                    coach_id: user.id,
                    client_id: newItem.client_id,
                    scheduled_date: newItem.scheduled_date,
                    item_type: newItem.item_type,
                    title: newItem.title,
                    content: newItem.content,
                    position: newItem.position,
                    status: newItem.status
                }])
                .select()
                .single();

            if (error) throw error;

            setItems(prev => prev.map(i => i.id === tempId ? (data as any) : i));
        } catch (err) {
            console.error('Error creating item:', err);
            setItems(prev => prev.filter(i => i.id !== tempId));
        }
    };

    return {
        items,
        loading,
        startDate: loadedStart,
        endDate: loadedEnd,
        currentDate,
        setCurrentDate,
        fetchItems,
        moveItem,
        createItem,
        loadMorePast,
        loadMoreFuture
    };
}
