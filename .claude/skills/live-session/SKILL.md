# Live Session — Coachency

## Two Separate Implementations

- **Coach-side (web)**: `LiveSessionContext` + `LiveSessionMode.tsx` — tracks which client session is active
- **Client-side (native)**: `useLiveWorkout.ts` — the full workout execution engine

They do not share state directly. The coach starts a session via `LiveSessionContext`; the client sees it via their assigned `scheduled_session_id` or `appointment_id`.

## LiveSessionContext: startTime is Serialized as String

State is persisted to localStorage:
```typescript
startTime: new Date()  // saved as JSON → becomes a string on retrieval
```
After a page reload, `sessionState.startTime` is a **string**, not a `Date`. Always wrap it:
```typescript
new Date(sessionState.startTime)  // safe
sessionState.startTime.getTime()  // TypeError — string has no getTime()
```

## useLiveWorkout: Three Independent Timers

Four timer states run simultaneously:
- `elapsedTime` — global session clock (always ticking)
- `groupTimer` — countdown for AMRAP/interval groups
- `restTimer` — rest between sets
- `activeTimer` — intra-set countdown (duration exercises)

Each runs in its own `useEffect` interval. `restTimer` reaching 0 calls `handleAutoAdvance()` which changes `currentExerciseIndex` — this can trigger `groupTimer` logic in the same render cycle. Avoid setting multiple timers from the same user action.

## Ghost Sets

On load, `useLiveWorkout` fetches previous workout logs for the same exercises and pre-fills sets with `isGhost: true`. These are read-only hints — they display previous weight/reps but count as uncompleted until the user confirms. Check `isGhost` before treating set data as submitted.

## handleAutoAdvance: repetitions vs sets

For grouped exercises, auto-advance uses `group.repetitions` to determine how many rounds. If `group.repetitions` is `null`, it falls back to `exercise.sets`. These are different units (rounds vs. sets) — the fallback can cause the workout to end too early or too late.

## Dual ID Pattern

`useLiveWorkout(scheduledSessionId?, appointmentId?)` accepts either identifier. Historical logs are fetched with an OR filter:
```typescript
.eq('scheduled_session_id', scheduledSessionId)
// OR
.eq('appointment_id', appointmentId)
```
If a client has both for the same exercise, ghost sets may double-load. Always pass only one ID.
