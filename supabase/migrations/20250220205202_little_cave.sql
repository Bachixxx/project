-- Drop existing functions
DROP FUNCTION IF EXISTS allow_client_registration;
DROP FUNCTION IF EXISTS check_client_registration;

-- Create function to allow client registration
CREATE OR REPLACE FUNCTION allow_client_registration(
  p_client_id uuid
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
  WHERE id = p_client_id
  RETURNING registration_access_until;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration access granted',
    'expires_at', registration_access_until
  );
END;
$$;

-- Create function to check registration access
CREATE OR REPLACE FUNCTION check_client_registration(
  p_email text
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
  WHERE email = p_email;

  -- Check if client exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email not found'
    );
  END IF;

  -- Check if client already has an account
  IF v_client.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email already has an account'
    );
  END IF;

  -- Check if registration access is valid
  IF v_client.registration_access_until IS NULL OR v_client.registration_access_until < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Registration access not granted or expired'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration access valid',
    'client_id', v_client.id,
    'coach_id', v_client.coach_id,
    'expires_at', v_client.registration_access_until
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION allow_client_registration TO authenticated;
GRANT EXECUTE ON FUNCTION check_client_registration TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_registration_access ON clients(registration_access_until) WHERE registration_access_until IS NOT NULL;