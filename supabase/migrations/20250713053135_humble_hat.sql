/*
  # Fix check_client_registration function

  1. Function Updates
    - Fix the check_client_registration RPC function to properly handle timestamp comparisons
    - Ensure all timestamp comparisons use compatible types
    - Add proper error handling and return structure

  2. Changes Made
    - Drop and recreate the check_client_registration function
    - Fix timestamp comparison by ensuring both sides use timestamp with time zone
    - Use NOW() for current timestamp comparisons
    - Return proper JSON structure with success/error messages
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS check_client_registration(text);

-- Create the corrected check_client_registration function
CREATE OR REPLACE FUNCTION check_client_registration(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    client_record RECORD;
    result json;
BEGIN
    -- Check if a client exists with this email
    SELECT id, coach_id, registration_access_until, auth_id
    INTO client_record
    FROM clients
    WHERE email = p_email;

    -- If no client found with this email
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Aucun client trouvé avec cet email. Contactez votre coach pour obtenir une invitation.'
        );
    END IF;

    -- If client already has an auth_id (already registered)
    IF client_record.auth_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Un compte existe déjà pour cet email. Utilisez la page de connexion.'
        );
    END IF;

    -- Check if registration access has expired (only if registration_access_until is set)
    IF client_record.registration_access_until IS NOT NULL AND 
       client_record.registration_access_until < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Le lien d''inscription a expiré. Contactez votre coach pour un nouveau lien.'
        );
    END IF;

    -- All checks passed
    RETURN json_build_object(
        'success', true,
        'message', 'Email valide pour l''inscription',
        'client_id', client_record.id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erreur lors de la vérification: ' || SQLERRM
        );
END;
$$;