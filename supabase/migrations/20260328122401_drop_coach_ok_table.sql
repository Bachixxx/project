-- Drop the coach_ok table which had an open RLS policy USING(true)
-- allowing any authenticated user to read all rows.
DROP TABLE IF EXISTS coach_ok;
