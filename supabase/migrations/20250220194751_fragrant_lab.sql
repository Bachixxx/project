/*
  # Ajout de l'authentification client

  1. Modifications de tables
    - Ajout de auth_id dans la table clients
    - Ajout de champs pour l'invitation

  2. Sécurité
    - Politiques RLS pour les clients
    - Politiques RLS pour les invitations

  3. Fonctions
    - Fonction pour créer une invitation
    - Fonction pour valider une invitation
*/

-- Ajout des colonnes nécessaires à la table clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS invitation_token UUID,
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

-- Table pour les invitations
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id),
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(email, coach_id)
);

-- Enable RLS
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Policies pour les invitations
CREATE POLICY "Coaches can manage their invitations"
  ON client_invitations
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

-- Fonction pour créer une invitation
CREATE OR REPLACE FUNCTION create_client_invitation(
  p_client_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_id UUID;
  v_token UUID;
BEGIN
  -- Get coach_id from client
  SELECT coach_id INTO v_coach_id
  FROM clients
  WHERE id = p_client_id;

  -- Generate invitation token
  v_token := gen_random_uuid();

  -- Create invitation
  INSERT INTO client_invitations (
    client_id,
    coach_id,
    email,
    token
  ) VALUES (
    p_client_id,
    v_coach_id,
    p_email,
    v_token
  );

  RETURN v_token;
END;
$$;

-- Fonction pour valider une invitation
CREATE OR REPLACE FUNCTION validate_client_invitation(
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

-- Fonction pour accepter une invitation
CREATE OR REPLACE FUNCTION accept_client_invitation(
  p_token UUID,
  p_auth_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
  v_valid BOOLEAN;
BEGIN
  -- Check if invitation is valid
  SELECT 
    client_id,
    valid INTO v_client_id, v_valid
  FROM validate_client_invitation(p_token);

  IF NOT v_valid THEN
    RETURN false;
  END IF;

  -- Update client with auth_id
  UPDATE clients
  SET auth_id = p_auth_id
  WHERE id = v_client_id;

  -- Mark invitation as accepted
  UPDATE client_invitations
  SET accepted_at = now()
  WHERE token = p_token;

  RETURN true;
END;
$$;

-- Update client RLS policies
DROP POLICY IF EXISTS "Coaches can manage own clients" ON clients;

CREATE POLICY "Coaches can manage their clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_client_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION validate_client_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_client_invitation TO authenticated;