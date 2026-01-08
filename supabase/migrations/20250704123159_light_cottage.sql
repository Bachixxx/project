/*
  # Create allow_client_registration function

  1. Changes
    - Create a simplified function for client registration without edge function dependency
    - Add registration_access_until column if it doesn't exist
    
  2. Security
    - Function is security definer to ensure proper permissions
    - Proper error handling and validation
*/

-- Add registration_access_until column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'registration_access_until'
  ) THEN
    ALTER TABLE clients ADD COLUMN registration_access_until TIMESTAMPTZ;
  END IF;
END $$;

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