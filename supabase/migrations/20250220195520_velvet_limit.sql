-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.create_client_invitation;
DROP FUNCTION IF EXISTS public.validate_client_invitation;
DROP FUNCTION IF EXISTS public.accept_client_invitation;

-- Create function to handle client invitations
CREATE OR REPLACE FUNCTION public.create_client_invitation(
  p_client_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id UUID;
  v_token UUID;
  v_client_email TEXT;
BEGIN
  -- Get client email and coach_id
  SELECT email, coach_id INTO v_client_email, v_coach_id
  FROM clients
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  -- Verify email matches
  IF v_client_email != p_email THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  -- Generate invitation token
  v_token := gen_random_uuid();

  -- Create or update invitation
  INSERT INTO client_invitations (
    client_id,
    coach_id,
    email,
    token,
    expires_at
  ) VALUES (
    p_client_id,
    v_coach_id,
    p_email,
    v_token,
    now() + interval '7 days'
  )
  ON CONFLICT (email, coach_id)
  DO UPDATE SET
    token = EXCLUDED.token,
    expires_at = EXCLUDED.expires_at,
    accepted_at = NULL;

  -- Update client with invitation token
  UPDATE clients
  SET 
    invitation_token = v_token,
    invitation_expires_at = now() + interval '7 days',
    invitation_accepted_at = NULL
  WHERE id = p_client_id;

  RETURN v_token;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error in create_client_invitation: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Function to validate invitation token
CREATE OR REPLACE FUNCTION public.validate_client_invitation(
  p_token UUID
)
RETURNS TABLE (
  client_id UUID,
  email TEXT,
  valid BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.client_id,
    i.email,
    CASE
      WHEN i.accepted_at IS NOT NULL THEN false
      WHEN i.expires_at < now() THEN false
      ELSE true
    END as valid,
    CASE
      WHEN i.accepted_at IS NOT NULL THEN 'Invitation already used'
      WHEN i.expires_at < now() THEN 'Invitation expired'
      ELSE 'Valid invitation'
    END as message
  FROM client_invitations i
  WHERE i.token = p_token;
END;
$$;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_client_invitation(
  p_token UUID,
  p_auth_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_valid BOOLEAN;
BEGIN
  -- Check if invitation is valid
  SELECT 
    i.client_id,
    CASE
      WHEN i.accepted_at IS NOT NULL THEN false
      WHEN i.expires_at < now() THEN false
      ELSE true
    END INTO v_client_id, v_valid
  FROM client_invitations i
  WHERE i.token = p_token;

  IF NOT v_valid THEN
    RETURN false;
  END IF;

  -- Update client with auth_id and mark invitation as accepted
  UPDATE clients
  SET 
    auth_id = p_auth_id,
    invitation_accepted_at = now()
  WHERE id = v_client_id;

  -- Mark invitation as accepted
  UPDATE client_invitations
  SET accepted_at = now()
  WHERE token = p_token;

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_client_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_client_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_client_invitation TO authenticated;

-- Ensure tables have proper indexes
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email_coach ON client_invitations(email, coach_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON clients(auth_id);