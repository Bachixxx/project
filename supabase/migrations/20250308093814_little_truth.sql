/*
  # Fix HTTP POST function ambiguity

  1. Changes
    - Drop existing http_post function
    - Recreate with explicit type casts to resolve ambiguity
    
  2. Notes
    - This fixes the "function is not unique" error
    - Ensures proper type handling for URL, headers, and body parameters
*/

-- First drop any existing http_post functions
DROP FUNCTION IF EXISTS net.http_post(text, jsonb, jsonb);
DROP FUNCTION IF EXISTS net.http_post(url text, headers jsonb, body jsonb);

-- Recreate the function with explicit type definitions
CREATE OR REPLACE FUNCTION net.http_post(
  url text,
  headers jsonb DEFAULT '{}'::jsonb,
  body jsonb DEFAULT '{}'::jsonb
) RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN net.http((
    'POST',
    url::text,
    headers::jsonb,
    body::jsonb,
    NULL
  )::net.http_request)::text;
END;
$$;

-- Add proper grants
GRANT EXECUTE ON FUNCTION net.http_post(text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION net.http_post(text, jsonb, jsonb) TO service_role;