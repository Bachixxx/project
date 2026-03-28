# Native App Architecture — Coachency

## Navigation Structure (React Navigation v7)
```
Stack
├── Login → LoginScreen
└── Main → Tab Navigator
    ├── Dashboard → DashboardScreen
    ├── Workouts → WorkoutsStack
    │   ├── WorkoutsList → WorkoutsScreen
    │   ├── WorkoutDetail → WorkoutDetailScreen
    │   └── LiveWorkout → LiveWorkoutScreen (hides tab bar)
    ├── Appointments → AppointmentsScreen
    ├── Progress → ProgressScreen
    ├── BodyComposition → BodyCompositionScreen
    └── Profile → ProfileScreen
```

## State Management
**No Zustand** — `src/store/` is empty despite the dependency. State is: Context API for auth, `useState` in custom hooks for business data. No global store.

## Auth (differs from web app)
`src/lib/supabase.ts` uses `EXPO_PUBLIC_SUPABASE_URL` and `AsyncStorage` for session persistence.
```typescript
createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })
```

## Styling — Two Coexisting Patterns
- **Modern screens** (e.g. `BodyCompositionScreen`): NativeWind `className="flex-1 bg-[#020617]"`
- **Legacy screens** (e.g. `DashboardScreen`): inline `style` with design token object at file top (`const T = { bg: '#020617', card: 'rgba(...)' }`)
Don't mix within a single screen.

## OneSignal Push Notifications
App ID: `4554f523-0919-4c97-9df2-acdd2f459914`. Initialized twice (root + navigator — intentional). After auth: `OneSignal.login(session.user.id)` to link Supabase user.

## Xcode Cloud CI (`ios/ci_scripts/ci_post_clone.sh`)
```sh
brew install node
cd ../../ && npm install --legacy-peer-deps   # resolves React 19/lucide conflict
cd ios && pod install
```

## Key Differences vs Web App
- Bundle ID: `ch.coachency.app` (NOT `com.coachency.app` which is the Capacitor wrapper)
- Env vars: `EXPO_PUBLIC_*` prefix (not `VITE_*`)
- No React Query — direct Supabase calls in hooks
- French tab labels in `TabNavigator.tsx`
