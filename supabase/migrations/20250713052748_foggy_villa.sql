/*
  # Fix check_client_registration function
  
  1. Changes
    - Drop existing function first to avoid return type conflict
    - Recreate function with proper JSON return type
    - Handle all client registration scenarios
    
  2. Security
    - Function is security definer to ensure proper access control
*/

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS check_client_registration(text);

-- Create the function with proper return type
CREATE OR REPLACE FUNCTION check_client_registration(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record clients%ROWTYPE;
  current_time timestamptz := now();
BEGIN
  -- Check if email exists in clients table
  SELECT * INTO client_record
  FROM clients
  WHERE email = p_email;

  -- If no client record found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email non autorisé. Contactez votre coach pour obtenir une invitation.'
    );
  END IF;

  -- If client already has an auth_id (already registered)
  IF client_record.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Un compte existe déjà pour cet email. Utilisez la page de connexion.'
    );
  END IF;

  -- Check if registration access has expired
  IF client_record.registration_access_until IS NOT NULL 
     AND client_record.registration_access_until < current_time THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'L''invitation a expiré. Contactez votre coach pour une nouvelle invitation.'
    );
  END IF;

  -- Email is valid for registration
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email autorisé pour la création de compte.',
    'client_id', client_record.id
  );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION check_client_registration(text) TO anon, authenticated;