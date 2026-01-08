-- Drop existing function
DROP FUNCTION IF EXISTS public.check_client_registration(text);

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
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE clients
  SET auth_id = p_auth_id
  WHERE email = p_email
  AND auth_id IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_client_registration(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_auth_id(text, uuid) TO authenticated;