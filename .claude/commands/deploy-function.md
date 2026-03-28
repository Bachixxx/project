Deploy the Supabase edge function named "$ARGUMENTS".

1. Use the Bash tool to check if the directory `supabase/functions/$ARGUMENTS/` exists.
2. If it does NOT exist, stop immediately and output:
   "Error: no function named '$ARGUMENTS' found in supabase/functions/.
   Available functions: [list the subdirectories of supabase/functions/]"
3. If it exists, run: `supabase functions deploy $ARGUMENTS`
4. Report the result (success or error output from the CLI).
