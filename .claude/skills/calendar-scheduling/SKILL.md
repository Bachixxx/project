# Calendar & Scheduling — Coachency

## Table vs UI Terminology

The calendar UI calls items "appointments" but `useCalendar` queries the **`scheduled_sessions`** table exclusively. `appointments` is a separate table used elsewhere (Stripe payment links, live sessions). Don't confuse them.

## Virtual Windowing

`useCalendar` loads ±2 weeks from today on init. Extending the range:
```typescript
loadMorePast()    // adds 2 weeks before loadedStart
loadMoreFuture()  // adds 2 weeks after loadedEnd
```
New items are deduplicated by `id` before merging into state. If a temp UUID is still in state when real data arrives, the dedup will miss it — the item appears twice until refresh.

## Optimistic Updates — moveItem has no rollback

`moveItem()` updates local state first, then writes to Supabase:
```typescript
setItems([...otherItems, updatedItem]);   // immediate
await supabase.from('scheduled_sessions').update(...)  // then
```
On error, `setItems(oldItems)` restores state. **But** if the component unmounts between the optimistic update and the error, the rollback never fires — the user sees the item in the wrong position until next refresh.

## Temp UUID Pattern in createItem

`createItem()` inserts an item with a `crypto.randomUUID()` temp ID, then swaps it for the real DB id on success:
```typescript
const tempId = crypto.randomUUID();
setItems([...items, { ...newItem, id: tempId }]);
// on success:
setItems(prev => prev.map(i => i.id === tempId ? data : i));
```
If the insert fails and the user retries, the temp ID is still in state — retry creates a second optimistic item. Always call `fetchItems()` to reset state after a failed creation.

## Position Ordering

Items are ordered by `scheduled_date` then `position` (integer). There is no uniqueness constraint on `(client_id, scheduled_date, position)` — two items can have the same position on the same day; order between them is undefined.

## ScheduleSessionModal Modes

The modal (`ScheduleSessionModal.tsx`, 72 KB) has three modes: `'new'` | `'existing'` | `'program'`. Each mode builds a different payload for `createItem()`. Switching modes mid-form resets internal state but does NOT clear the `CalendarItem` fields already staged — validate the full item shape before passing to `createItem`.
