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