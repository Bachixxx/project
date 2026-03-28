# Workout Builder — Coachency

## Terminology (Critical)

Two overloaded terms in the codebase:
- **Block** (`BlockManager.tsx`) = a structural unit of a session with a type: `'regular' | 'circuit' | 'amrap' | 'interval'`
- **Group** (`ExerciseGroup`) = a set of exercises grouped within a session (can be inside a block)

These are different concepts. `BlockManager` manages blocks; `ExerciseGroupManager` manages groups inside them.

## Data Hierarchy

```
Program
└── ProgramSession (ordered list of sessions)
    └── Session
        ├── SessionExercise (standalone)
        └── ExerciseGroup
            └── SessionExercise (grouped, has group.type, group.repetitions)
```

`exercise_id` points to the exercise catalog. `id` (UUID) is the instance — the same catalog exercise can appear multiple times in one session with distinct `id` values (intentional: different set schemes).

## useWorkoutBuilder — Key Behaviors

`reps` and `weight` are **strings**, not numbers:
```typescript
{ id: uuidv4(), reps: '10', weight: '' }  // weight starts empty, not '0'
```
Parse before DB insert — empty string causes NaN in calculations.

Adding a set copies the last set's reps/weight. The first set always defaults to `reps: '10'`, `weight: ''`.

**Reorder via drag-and-drop (`arrayMove`) is local state only** — it is NOT automatically persisted to DB. The calling component must trigger a save after reorder.

## Ghost Sets (Live Workout — native-app)

In `useLiveWorkout`, sets are pre-filled from the last matching workout log (`isGhost: true`). Ghost sets appear as hints but are marked uncompleted. If the previous log has bad data it propagates — check `isGhost` before treating a set as user-confirmed.

## BlockManager vs Programs.tsx

`Programs.tsx` (59 KB) owns the full program CRUD. `BlockManager.tsx` (38 KB) is the exercise-editing sub-component used inside it. Changes to block/exercise structure in `BlockManager` must be manually saved back up through `Programs.tsx` — there is no auto-save.
