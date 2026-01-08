/*
  # Fix edge_function_base_url parameter error
  
  1. Changes
    - Remove references to app.settings.edge_function_base_url from functions
    - Create simplified client invitation function without edge function dependency
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop functions that reference the problematic configuration parameter
DROP FUNCTION IF EXISTS public.create_client_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS public.send_templated_email(TEXT, TEXT, JSONB);

-- Create simplified client invitation function without edge function dependency
CREATE OR REPLACE FUNCTION public.allow_client_registration(
  p_client_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  -- Get client info
  SELECT * INTO v_client
  FROM clients
  WHERE id = p_client_id;

  -- Check if client exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Client not found'
    );
  END IF;

  -- Check if client already has an account
  IF v_client.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Client already has an account'
    );
  END IF;

  -- Update client with registration access
  UPDATE clients
  SET registration_access_until = now() + interval '10 minutes'
  WHERE id = p_client_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration access granted',
    'expires_at', now() + interval '10 minutes'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.allow_client_registration(UUID) TO authenticated;