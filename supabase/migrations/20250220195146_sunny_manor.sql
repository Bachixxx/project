-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_client_invitation;

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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_invitation TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies
DROP POLICY IF EXISTS "Coaches can manage their invitations" ON client_invitations;
CREATE POLICY "Coaches can manage their invitations"
  ON client_invitations
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());