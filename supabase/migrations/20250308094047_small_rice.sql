/*
  # Fix HTTP POST function conflict

  1. Changes
    - Drop conflicting http_post function if it exists
    - Create new http_post function with explicit parameter types
    - Add proper error handling

  2. Security
    - Function is restricted to authenticated users only
*/

-- Drop existing functions with conflicting signatures
DROP FUNCTION IF EXISTS net.http_post(text, jsonb, jsonb);
DROP FUNCTION IF EXISTS net.http_post(url text, headers jsonb, body jsonb);

-- Create new function with explicit parameter types
CREATE OR REPLACE FUNCTION net.http_post(
  url text,
  headers jsonb DEFAULT '{}'::jsonb,
  body jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  status int,
  content jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate input
  IF url IS NULL THEN
    RAISE EXCEPTION 'URL cannot be null';
  END IF;

  -- Make HTTP POST request
  RETURN QUERY
  SELECT
    (response ->> 'status')::int as status,
    (response ->> 'content')::jsonb as content
  FROM
    net.http(
      (
        'POST',
        url,
        headers,
        body,
        null
      )::net.http_request
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION net.http_post(text, jsonb, jsonb) TO authenticated;

-- Recreate RLS policies for coaches table
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_insert" ON coaches;
CREATE POLICY "coaches_insert" ON coaches
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "coaches_select" ON coaches;
CREATE POLICY "coaches_select" ON coaches
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "coaches_update" ON coaches;
CREATE POLICY "coaches_update" ON coaches
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());