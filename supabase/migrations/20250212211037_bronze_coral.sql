-- Create net schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS net;

-- Create http_post function with proper parameters and return type
CREATE OR REPLACE FUNCTION net.http_post(
    url text,
    headers jsonb DEFAULT '{}'::jsonb,
    body jsonb DEFAULT '{}'::jsonb,
    timeout_ms integer DEFAULT 1000
)
RETURNS table (
    status integer,
    content text,
    response_headers jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = net
AS $$
BEGIN
    -- Cette fonction est un stub qui simule une réponse HTTP réussie
    RETURN QUERY SELECT 
        200::integer as status,
        'success'::text as content,
        headers as response_headers;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION net.http_post(text, jsonb, jsonb, integer) TO postgres, authenticated, anon, service_role;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_auth_users_id ON auth.users(id);