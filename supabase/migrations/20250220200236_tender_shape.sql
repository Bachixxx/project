-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_client_invitation;

-- Create simplified function for client invitations
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
  v_client_name TEXT;
  v_coach_name TEXT;
BEGIN
  -- Get client and coach info
  SELECT 
    c.email,
    c.coach_id,
    c.full_name,
    co.full_name INTO v_client_email, v_coach_id, v_client_name, v_coach_name
  FROM clients c
  JOIN coaches co ON co.id = c.coach_id
  WHERE c.id = p_client_id;

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

  -- Send invitation email via Edge Function
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_base_url') || '/send-invitation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'token', v_token,
      'clientId', p_client_id
    )
  );

  RETURN v_token;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_client_invitation: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Ensure RLS is properly configured
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Coaches can manage their invitations" ON client_invitations;
CREATE POLICY "Coaches can manage their invitations"
  ON client_invitations
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_client_invitation(UUID, TEXT) TO authenticated;
GRANT ALL ON client_invitations TO authenticated;