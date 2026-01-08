-- Drop existing function
DROP FUNCTION IF EXISTS public.create_client_invitation;

-- Create or replace the function to use Supabase email
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

  -- Send email using Supabase's email service
  PERFORM supabase.send_email(
    p_email,
    'Invitation à rejoindre votre espace client',
    format(
      'Bonjour %s,

      %s vous invite à rejoindre votre espace client sur Coachency.
      
      Pour activer votre compte, cliquez sur le lien suivant :
      %s/client/register?token=%s
      
      Ce lien est valable pendant 7 jours.
      
      À bientôt !
      L''équipe Coachency',
      v_client_name,
      v_coach_name,
      current_setting('app.settings.site_url'),
      v_token
    )
  );

  RETURN v_token;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_client_invitation: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_client_invitation TO authenticated;