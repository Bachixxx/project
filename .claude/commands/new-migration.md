Create a new SQL migration file for: "$ARGUMENTS".

1. Generate the current timestamp in format YYYYMMDDHHmmss using the Bash tool: `date +%Y%m%d%H%M%S`
2. Slugify the description from $ARGUMENTS (lowercase, underscores). If $ARGUMENTS is empty, ask for a description.
3. Create `supabase/migrations/{timestamp}_{slug}.sql` with an appropriate SQL skeleton.
4. Before writing, remind yourself of these rules:
   - NEVER edit an existing migration file — always create a new one.
   - If the migration adds RLS policies that query another table, wrap the cross-table check in a SECURITY DEFINER function to avoid infinite recursion (see the supabase-patterns skill).
   - `clients.id ≠ auth.uid()` — use `WHERE auth_id = auth.uid()` for client policies.
   - Test with `supabase db push` locally before deploying.
5. Show the full file path and content to the user.
