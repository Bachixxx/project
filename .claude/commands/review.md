Review all current changes in this repository.

1. Run `git diff HEAD` and `git diff --staged` to get the full diff.
2. Analyze every changed file against the following checklist:

**Conventions (from CLAUDE.md)**
- Components/pages use `export default`; hooks, interfaces, utilities use named exports
- Import order: React → third-party → `../lib/supabase` → contexts → local components
- Supabase queries live in hooks only, never in components
- File naming: PascalCase for components, camelCase for hooks
- `clients.id ≠ auth.uid()` — client queries must use `auth_id`
- Never edit an existing migration; create a new one

**Security**
- No API keys, secrets, or tokens hardcoded in source files
- No `.env` values committed
- Stripe secret key (`sk_`) never in frontend code

**Correctness**
- reps/weight fields in workout builder are strings — check they're parsed before arithmetic
- `startTime` from LiveSessionContext localStorage is a string after reload — not a Date
- New RLS policies don't create circular table references

**Architecture**
- New pages added as lazy imports in App.tsx (not eager, unless core coach pages)
- New edge functions follow the Deno CORS + auth boilerplate from supabase-patterns skill
- No business logic added directly to components (should be in hooks)

3. Output a structured summary:
   - ✅ What looks correct
   - ⚠️ Issues to fix (with file:line references)
   - 🚨 Blockers (security, broken conventions, data bugs)
