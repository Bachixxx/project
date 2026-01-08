/*
  # Create function to update client auth_id

  1. New Functions
    - update_client_auth_id - Links a client record to an auth user

  2. Security
    - Function is security definer to ensure proper access control
    - Only updates clients without an existing auth_id
*/

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
  v_updated boolean;
BEGIN
  -- Update client and get id
  UPDATE clients
  SET 
    auth_id = p_auth_id,
    updated_at = now()
  WHERE 
    email = p_email
    AND (auth_id IS NULL OR auth_id = p_auth_id)
  RETURNING id INTO v_client_id;
  
  -- Check if update was successful
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de lier le compte. Vérifiez que l''email est correct et que le compte n''est pas déjà lié.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compte lié avec succès',
    'client_id', v_client_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_client_auth_id(text, uuid) TO authenticated;