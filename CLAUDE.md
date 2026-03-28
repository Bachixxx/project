# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coachency is a coaching platform with two frontends (web + React Native mobile) sharing a Supabase backend. Coaches manage clients, workouts, programs, payments, and live sessions. Clients view assigned workouts, track progress, and join live sessions.

## Commands

### Web App (root directory)
```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build to /dist
npm run lint         # ESLint (flat config, TS + React)
npm run preview      # Preview production build
npm run ios          # Build web + sync + open Xcode (Capacitor)
```

### Native App (`native-app/`)
```bash
cd native-app
npm run start        # Expo dev server
npm run ios          # Build & run iOS simulator
npm run android      # Build & run Android emulator
```

### Supabase
```bash
supabase functions serve <function-name> --env-file .env  # Local edge function
supabase db push                                           # Push migrations
supabase functions deploy <function-name>                  # Deploy single function
```

## Architecture

### Three codebases in one repo

1. **Web app** (`src/`) — React 18 + Vite + Tailwind CSS SPA, deployed to Netlify
2. **Native app** (`native-app/`) — React Native 0.81 + Expo 54, separate package.json and node_modules
3. **Backend** (`supabase/`) — PostgreSQL migrations (227 files) + 23 Deno edge functions

The web app also has a Capacitor bridge (`capacitor.config.json`, `ios/`) for wrapping the web build as a native iOS app — separate from the React Native app.

### Web App (`src/`)

- **Routing**: React Router v6 in `App.tsx`. Two parallel route trees: coach routes (protected by `CoachPrivateRoute`) and client routes (protected by `ClientPrivateRoute` under `/client/*`).
- **State**: React Context for auth/theme/language/notifications/live-sessions + React Query (TanStack) for server state. No Redux.
- **Auth**: Two separate auth contexts — `AuthContext` for coaches (email/password) and `ClientAuthContext` for clients (magic link invitations).
- **Styling**: Tailwind CSS 3 with custom theme in `tailwind.config.js` (primary: #4f44e9, font: Space Grotesk). Dark mode via `ThemeContext`.
- **Code splitting**: Landing page (`Home`) eagerly loaded for LCP; core coach pages eagerly loaded for "native feel"; everything else lazy-loaded.
- **i18n**: French and Spanish translations in `src/i18n/`.

### Native App (`native-app/`)

- **Navigation**: React Navigation v7 with bottom tabs (Workouts, Appointments, Progress, Profile).
- **State**: Zustand for local state, AsyncStorage for persistence, Supabase JS SDK for backend.
- **Styling**: NativeWind (Tailwind for React Native).
- **Payments**: Stripe React Native SDK for native payment sheets.
- **Notifications**: OneSignal (`react-native-onesignal`).
- Shares the same Supabase backend but has its own hooks and components — no code sharing with web app.

### Backend (`supabase/`)

- **Edge Functions** (`supabase/functions/`): Deno TypeScript. Key categories:
  - Payments: `create-checkout-session`, `create-native-payment-sheet`, `create-terminal-payment`, `webhook` (Stripe webhooks)
  - Auth: `create-login-link` (magic links), `delete-account`
  - Comms: `send-email` (Resend API with templates), `send-invitation`, `send-push` (OneSignal)
  - Stripe Connect: `create-connect-account`, `create-portal-session`
- **Migrations** (`supabase/migrations/`): 227 SQL files defining tables, RLS policies, triggers.
- **RLS**: All tables use Row Level Security. Coaches see only their clients; clients see only their assigned content. Use service role for admin operations.

### Key Data Model

Coach → has many Clients (via `coach_clients`) → assigned Programs → containing Blocks → containing Exercise Groups → containing Exercises. Appointments represent scheduled sessions. `workout_logs` track client completion.

### Payment Flow

Coach creates payment link → Stripe checkout → Stripe webhook (`supabase/functions/webhook/`) → database update → real-time update to client.

## Environment Variables

Web app uses `VITE_` prefixed vars (loaded by Vite):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase connection
- `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key

Edge functions use Deno env vars:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe server-side
- `RESEND_API_KEY` — Email service
- `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` — Push notifications

## Deployment

- **Web**: Netlify (config in `netlify.toml`), SPA with `/*` → `/index.html` redirect
- **iOS web wrapper**: Capacitor builds from `/dist` (appId: `com.coachency.app`)
- **Native iOS**: Expo + Xcode Cloud (see `native-app/ios/ci_scripts/`)
- **Edge Functions**: Deployed to Supabase (auto-deploy or `supabase functions deploy`)

## Testing

No test suite configured — verify changes manually by running the app.

## Gotchas

- **Dual app IDs**: The Capacitor web wrapper (`capacitor.config.json`) uses `com.coachency.app`; the React Native app (`native-app/app.json`) uses `ch.coachency.app`. These are separate identities — different provisioning profiles and App Store listings.
- **Hardcoded auth token key**: `AuthContext.tsx:201` manually clears `sb-timbwznomvhlgkaljerb-auth-token` from localStorage. If the Supabase project changes, logout will silently fail to clear the session.
- **Webhook has no idempotency guard**: `supabase/functions/webhook/index.ts` processes Stripe events with direct DB updates and no duplicate-event check. A retried webhook will double-apply subscription/branding changes.
- **Migrations are immutable once pushed**: 227 migration files are applied in timestamp order. Never edit an existing migration — create a new one. Several "fix_recursion" migrations exist because RLS policies with nested selects caused infinite loops in the past.
- **Two separate Supabase clients**: Web uses `VITE_SUPABASE_URL`; native app uses `EXPO_PUBLIC_SUPABASE_URL`. Both point to the same project but must be kept in sync independently.
- **`npm install --legacy-peer-deps` in CI**: `native-app/ios/ci_scripts/ci_post_clone.sh` suppresses a React 19 / lucide-react-native peer conflict. Don't remove this flag without first resolving the underlying version mismatch.

## Compaction Instructions

When compacting, always preserve: list of modified files, current task context, architecture decisions made during the session, and any failing tests or errors being debugged.

## Code Conventions

- Components and pages use `export default`; hooks, interfaces, and utility functions use named exports.
- Interfaces co-located with their hook/component file and exported from there (no central `types/` directory).
- Supabase queries live directly in custom hooks — never in components or pages.
- Hook files: `use[Feature].ts` (camelCase), return an object `{ data, loading, error, mutationFn }`.
- Import order: React → third-party libs → `../lib/supabase` → contexts → local components.
- File naming: PascalCase for components/pages/contexts, camelCase for hooks and utilities.
