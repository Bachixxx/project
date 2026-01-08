-- Drop existing functions
DROP FUNCTION IF EXISTS allow_client_registration;
DROP FUNCTION IF EXISTS check_client_registration;

-- Drop registration access column
ALTER TABLE clients
  DROP COLUMN IF EXISTS registration_access_until;

-- Create new function to check if email can register
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
      'message', 'Email non trouvé'
    );
  END IF;

  -- Check if client already has an account
  IF v_client.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Un compte existe déjà pour cet email'
    );
  END IF;

  -- Client can register
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Inscription autorisée',
    'client_id', v_client.id,
    'coach_id', v_client.coach_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_client_registration TO authenticated, anon;

-- Update RLS policies
DROP POLICY IF EXISTS "Coaches can manage their clients" ON clients;
DROP POLICY IF EXISTS "Clients can read own data" ON clients;

CREATE POLICY "Coaches can manage their clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);