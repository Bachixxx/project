# CLAUDE.md - Coachency

## Project Overview

Coachency is an all-in-one SaaS platform for sports coaches. It provides coach dashboards, client management, training program creation, workout tracking, payment processing (Stripe), and a client-facing mobile app. The web app also ships as a native iOS app via Capacitor.

## Tech Stack

- **Frontend:** React 18 + TypeScript (strict mode)
- **Build:** Vite 5
- **Styling:** Tailwind CSS 3.4 (dark theme primary, custom design tokens)
- **Routing:** React Router v6
- **Server State:** TanStack React Query (5min stale, 24h GC, 1 retry)
- **Global State:** React Context (Auth, Theme, Language, Notifications, LiveSession, Terminal)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments:** Stripe (web + native terminal)
- **Native:** Capacitor 8 (iOS), OneSignal (push), Adapty (subscriptions)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion
- **i18n:** Custom implementation (French, Spanish)
- **Deployment:** Netlify (SPA with `/*` -> `/index.html` redirect)

## Directory Structure

```
src/
  components/       # Reusable UI components
    client/         # Client-facing components (dashboard, workout, biometrics)
    coach/          # Coach-specific components
    library/        # Exercise/session library
    calendar/       # Calendar components
    dashboard/      # Dashboard widgets
  pages/            # Route-level page components
    client/         # Client-facing pages
  contexts/         # React Context providers
  hooks/            # Custom data-fetching hooks (useCoach*, useClient*)
  lib/              # Core libraries (supabase.ts, stripe.ts, react-query.ts)
  utils/            # Helpers (pdfGenerator.ts)
  i18n/             # Translations (fr.ts, es.ts)
supabase/
  functions/        # Supabase Edge Functions
  migrations/       # Database migrations
ios/                # Capacitor iOS project
native-app/         # Separate React Native app
```

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build (outputs to dist/)
npm run lint      # ESLint (flat config, TS + React hooks rules)
npm run preview   # Preview production build
npm run ios       # Build + sync + open Xcode
```

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key

## Code Conventions

### Naming
- **Components/Pages:** PascalCase files and exports (`Dashboard.tsx`, `ClientLayout.tsx`)
- **Hooks:** camelCase with `use` prefix (`useCoachDashboard.ts`)
- **Utilities/Libs:** camelCase (`supabase.ts`, `pdfGenerator.ts`)

### Patterns
- Functional components with hooks only (no class components)
- Custom hooks encapsulate data fetching per domain (`useCoachDashboard`, `useClientDashboard`, etc.)
- Dual auth contexts: `AuthContext` (coach) and `ClientAuthContext` (client)
- React Query for all server state; Context for UI state only
- Lazy loading for non-critical pages; eager loading for core pages (Dashboard, Clients, Calendar, Sessions, Programs, Profile)
- `ResponsiveModal` component for all modals (full-screen on mobile)

### Styling
- Tailwind utility classes throughout; avoid inline styles
- Dark theme is the primary theme (background `#0f172a`)
- Primary color: `#4f44e9` (indigo/purple), Accent: `#22d3ee` (cyan)
- Custom font: Space Grotesk for display text
- Custom utilities defined in `src/index.css`: `glass`, `glass-card`, `glass-button`, `primary-button`, `input-field`, `touch-target`
- Minimum 44px touch targets for interactive elements
- Use `xs:` breakpoint (475px) for small mobile; standard Tailwind breakpoints otherwise

### TypeScript
- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Target ES2020, module ESNext
- Fix all type errors before committing

### Comments
- Some code comments are in French (original developer language)
- New comments should be in English

## Architecture Notes

- **Authentication:** Supabase Auth with auto-refresh tokens. Coach and client have separate auth flows and contexts.
- **Data Fetching:** React Query with 5-minute stale time means pages show cached data instantly with background refetch. Custom hooks in `src/hooks/` wrap Supabase queries.
- **Mobile:** Capacitor bridges web to native iOS. Touch-friendly design with responsive modals, sticky footers, and proper spacing. OneSignal for push notifications, Adapty for in-app subscriptions.
- **Payments:** Stripe JS for web payments, Stripe Terminal plugin for physical card readers.
- **i18n:** Custom `t()` function from `src/i18n/index.ts`. Translations keyed by dot-notation. Language stored in localStorage with browser detection fallback.

## Testing

No testing framework is currently configured. No test files exist in the codebase.

## Linting

ESLint 9 with flat config (`eslint.config.js`):
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` (enforces rules of hooks)
- `eslint-plugin-react-refresh` (validates fast refresh compatibility)

No Prettier configuration. Run `npm run lint` before committing.
