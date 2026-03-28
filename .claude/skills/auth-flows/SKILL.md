# Auth Flows — Coachency

## Two Completely Separate Systems

- **Coaches**: `AuthContext` + `src/lib/supabase.ts` (VITE env vars, localStorage)
- **Clients**: `ClientAuthContext` + `native-app/src/lib/supabase.ts` (EXPO env vars, AsyncStorage)

Never mix the two contexts. A coach using the client login is **actively rejected**: `signIn()` in `ClientAuthContext` checks if `auth.uid()` exists in the `coaches` table and calls `supabase.auth.signOut()` if so.

## coaches vs clients Identity

- `coaches.id = auth.uid()` — direct match
- `clients.id ≠ auth.uid()` — clients have a separate `auth_id` column

All queries for client data use:
```typescript
.eq('auth_id', user.id)   // NOT .eq('id', user.id)
```

## Client Fetch: auth_id → email Fallback

`fetchClientData()` in `ClientAuthContext` does two queries:
1. Tries `clients` table by `auth_id = user.id`
2. If no match, tries by `email = user.email` → on success, **writes `auth_id` back** to the DB row

This covers clients created before they had an auth account (coach-side invite flow). If the email update fails, `setClient(null)` is called even though Supabase auth state is valid — the user appears logged out.

## Token Refresh Errors (Silent Handling)

Both contexts catch `"refresh_token_not_found"` and `"Invalid Refresh Token"` silently and call `supabase.auth.signOut()` without throwing. Other refresh errors are logged but may leave state inconsistent.

`AuthContext` also manually clears a hardcoded localStorage key on logout:
```typescript
localStorage.removeItem('sb-timbwznomvhlgkaljerb-auth-token')
```
This key is project-specific — if the Supabase project changes, this line must be updated.

## OneSignal: Fire-and-Forget

`login(user.id)` (OneSignal) is called after successful auth but **not awaited**. Errors are swallowed. Failing silently means push notifications won't work but auth still succeeds.

## Route Protection

- Coach routes: `CoachPrivateRoute` checks `AuthContext`
- Client routes: `ClientPrivateRoute` checks `ClientAuthContext`
- Separate layouts: `Layout` (coach) vs `ClientLayout` (client)
