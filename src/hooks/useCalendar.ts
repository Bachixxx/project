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

    // Generate aligned range: Start on Monday, 2 weeks back, 2 weeks forward
    const startDate = startOfWeek(addWeeks(currentDate, -2), { weekStartsOn: 1 });
    const endDate = endOfWeek(addWeeks(currentDate, 2), { weekStartsOn: 1 });

    // Helper to refresh data
    const fetchItems = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);

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
                .gte('scheduled_date', format(startDate, 'yyyy-MM-dd'))
                .lte('scheduled_date', format(endDate, 'yyyy-MM-dd'))
                .order('scheduled_date', { ascending: true })
                .order('position', { ascending: true });

            if (error) throw error;
            setItems(data as any || []);
        } catch (err) {
            console.error('Error fetching calendar items:', err);
        } finally {
            setLoading(false);
        }
    }, [clientId, currentDate]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const moveItem = async (itemId: string, newDate: Date, newPosition: number) => {
        // Optimistic Update
        const oldItems = [...items];
        const itemToMove = items.find(i => i.id === itemId);
        if (!itemToMove) return;

        // Filter out item from old position
        const otherItems = items.filter(i => i.id !== itemId);

        // Create new item state
        const updatedItem = {
            ...itemToMove,
            scheduled_date: format(newDate, 'yyyy-MM-dd'), // Time component usually stripped for day-view items
            position: newPosition
        };

        // Re-insert into local state (simplified logic, real reorder is complex)
        // We'll just rely on fetching or rudimentary splice for now.
        // Ideally, we re-sort the whole day locally.
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

            // Optionally refetch to ensure consistency with DB triggers/sorts
            // fetchItems(); 
        } catch (err) {
            console.error('Error moving item:', err);
            setItems(oldItems); // Revert
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

            // Replace optimistic item with real one
            setItems(prev => prev.map(i => i.id === tempId ? (data as any) : i));
        } catch (err) {
            console.error('Error creating item:', err);
            // Revert
            setItems(prev => prev.filter(i => i.id !== tempId));
        }
    };

    return {
        items,
        loading,
        startDate,
        endDate,
        currentDate,
        setCurrentDate,
        fetchItems,
        moveItem,
        createItem
    };
}
