-- Create net schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS net;

-- Create http_post function
CREATE OR REPLACE FUNCTION net.http_post(
    url text,
    headers jsonb DEFAULT '{}'::jsonb,
    body jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    status int,
    content text,
    response_headers jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Cette fonction est un stub qui ne fait rien
    -- Elle existe juste pour éviter l'erreur "schema net does not exist"
    RETURN QUERY SELECT 
        200::int as status,
        ''::text as content,
        '{}'::jsonb as response_headers;
END;
$$;

-- Grant usage on net schema
GRANT USAGE ON SCHEMA net TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, authenticated, anon, service_role;