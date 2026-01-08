-- Drop existing function
DROP FUNCTION IF EXISTS public.check_client_registration(text);

-- Create function to check client registration with proper permissions
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

-- Grant execute permission to ANON role
GRANT EXECUTE ON FUNCTION public.check_client_registration(text) TO anon;

-- Ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to allow anonymous access for email check
DROP POLICY IF EXISTS "Allow public email check" ON clients;
CREATE POLICY "Allow public email check"
  ON clients
  FOR SELECT
  TO anon
  USING (auth_id IS NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);