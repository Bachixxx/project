-- Modifier la fonction create_client_invitation pour une expiration de 10 minutes
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

  -- Create or update invitation with 10 minutes expiration
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
    now() + interval '10 minutes'  -- Changé de 7 jours à 10 minutes
  )
  ON CONFLICT (email, coach_id)
  DO UPDATE SET
    token = EXCLUDED.token,
    expires_at = now() + interval '10 minutes',  -- Mise à jour aussi ici
    accepted_at = NULL;

  -- Update client with invitation token
  UPDATE clients
  SET 
    invitation_token = v_token,
    invitation_expires_at = now() + interval '10 minutes',  -- Et ici
    invitation_accepted_at = NULL
  WHERE id = p_client_id;

  RETURN v_token;
END;
$$;

-- Mettre à jour la fonction de validation pour vérifier l'expiration
CREATE OR REPLACE FUNCTION check_client_email(
  p_email TEXT
)
RETURNS TABLE (
  client_id UUID,
  coach_id UUID,
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
    c.id as client_id,
    c.coach_id,
    CASE
      WHEN c.auth_id IS NOT NULL THEN false
      WHEN c.invitation_token IS NULL THEN false
      WHEN c.invitation_expires_at < now() THEN false
      ELSE true
    END as valid,
    CASE
      WHEN c.auth_id IS NOT NULL THEN 'Email déjà associé à un compte'
      WHEN c.invitation_token IS NULL THEN 'Aucune invitation active'
      WHEN c.invitation_expires_at < now() THEN 'Invitation expirée'
      ELSE 'Email autorisé'
    END as message
  FROM clients c
  WHERE c.email = p_email;
END;
$$;