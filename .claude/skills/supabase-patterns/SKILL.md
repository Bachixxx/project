# Supabase Patterns — Coachency

## RLS Conventions

**Coach access:** `coach_id = auth.uid()` — `coaches.id` IS `auth.uid()` directly.

**Client access:** `clients.id ≠ auth.uid()` — clients have a separate `auth_id` column.
Always use:
```sql
client_id IN (SELECT id FROM public.clients WHERE auth_id = auth.uid())
```
Never use `client_id = auth.uid()` for clients — this was the root cause of the original broken policies (see `fix_rls.sql`).

**Two-way access (coach sees client data):**
```sql
USING (
  client_id IN (SELECT id FROM clients WHERE auth_id = auth.uid())
  OR auth.uid() IN (SELECT coach_id FROM clients WHERE id = table.client_id)
)
```

**Storage paths:** folder name = `client_id` as text.
```sql
(storage.foldername(name))[1] IN (SELECT id::text FROM clients WHERE auth_id = auth.uid())
```

## Avoiding RLS Recursion
If two tables' policies reference each other → infinite loop. Fix: wrap the cross-table check in a `SECURITY DEFINER` function.
```sql
CREATE OR REPLACE FUNCTION check_access(target_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM session_registrations sr
    JOIN clients c ON c.id = sr.client_id
    WHERE sr.session_id = target_id AND c.auth_id = auth.uid());
$$;
```
Then use `USING (check_access(id))` in the policy.

## Migrations
227 files, applied in timestamp order. Never edit existing migrations — add a new one.
Name format: `YYYYMMDDHHMMSS_description.sql`.

## Deno Edge Function Boilerplate
```typescript
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (error || !user) throw new Error('Invalid token')
    // logic here
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
```
Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for admin DB operations inside edge functions.
