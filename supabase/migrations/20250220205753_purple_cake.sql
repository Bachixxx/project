-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can manage their clients" ON clients;
DROP POLICY IF EXISTS "Clients can read own data" ON clients;
DROP POLICY IF EXISTS "Allow anonymous registration check" ON clients;

-- Create new policies with proper permissions
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

CREATE POLICY "Allow email check for registration"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Update check_client_registration function
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_client_registration TO anon, authenticated;
GRANT SELECT ON clients TO anon, authenticated;