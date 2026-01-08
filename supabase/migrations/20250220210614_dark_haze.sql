-- Drop existing functions
DROP FUNCTION IF EXISTS public.check_client_registration(text);
DROP FUNCTION IF EXISTS public.update_client_auth_id(text, uuid);

-- Create function to check client registration
CREATE OR REPLACE FUNCTION public.check_client_registration(
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
      'message', 'Email non trouvé dans notre base de données'
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
    'client_id', v_client.id
  );
END;
$$;

-- Create function to update client auth_id
CREATE OR REPLACE FUNCTION public.update_client_auth_id(
  p_email text,
  p_auth_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Update client and get id
  UPDATE clients
  SET auth_id = p_auth_id
  WHERE email = p_email
  AND auth_id IS NULL
  RETURNING id INTO v_client_id;
  
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de lier le compte'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compte lié avec succès',
    'client_id', v_client_id
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_client_registration(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_auth_id(text, uuid) TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow public email check" ON clients;
CREATE POLICY "Allow public email check"
  ON clients
  FOR SELECT
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);