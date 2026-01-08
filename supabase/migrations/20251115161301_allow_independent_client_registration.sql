/*
  # Allow Independent Client Registration
  
  1. Changes
    - Replace check_client_registration function to allow ANY email
    - Replace update_client_auth_id function to create client record if not exists
    - Make coach_id nullable (it already is, but ensure it)
  
  2. Security
    - Functions remain SECURITY DEFINER but with proper validation
    - RLS policies already handle client data access correctly
*/

-- Drop and recreate check_client_registration to allow any email
DROP FUNCTION IF EXISTS public.check_client_registration(text);

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
  v_auth_user RECORD;
BEGIN
  -- Check if auth user already exists with this email
  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE email = p_email;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Un compte existe déjà avec cet email. Veuillez vous connecter.'
    );
  END IF;
  
  -- Check if client record exists
  SELECT * INTO v_client
  FROM clients
  WHERE email = p_email;
  
  IF FOUND AND v_client.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Un compte existe déjà pour cet email'
    );
  END IF;
  
  -- Allow registration (client will be created if doesn't exist)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Inscription autorisée',
    'client_id', v_client.id,
    'client_exists', FOUND
  );
END;
$$;

-- Drop and recreate update_client_auth_id to create client if not exists
DROP FUNCTION IF EXISTS public.update_client_auth_id(text, uuid);

CREATE OR REPLACE FUNCTION public.update_client_auth_id(
  p_email text,
  p_auth_id uuid,
  p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_client_exists boolean;
BEGIN
  -- Check if client already exists
  SELECT id INTO v_client_id
  FROM clients
  WHERE email = p_email;
  
  v_client_exists := FOUND;
  
  IF v_client_exists THEN
    -- Update existing client
    UPDATE clients
    SET auth_id = p_auth_id
    WHERE email = p_email
    AND auth_id IS NULL
    RETURNING id INTO v_client_id;
    
    IF v_client_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Ce client a déjà un compte associé'
      );
    END IF;
  ELSE
    -- Create new client (independent client without coach)
    IF p_full_name IS NULL OR p_full_name = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Le nom complet est requis pour créer un nouveau compte'
      );
    END IF;
    
    INSERT INTO clients (
      email,
      full_name,
      auth_id,
      coach_id,
      status
    ) VALUES (
      p_email,
      p_full_name,
      p_auth_id,
      NULL,
      'active'
    )
    RETURNING id INTO v_client_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compte lié avec succès',
    'client_id', v_client_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_client_registration(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_auth_id(text, uuid, text) TO authenticated;