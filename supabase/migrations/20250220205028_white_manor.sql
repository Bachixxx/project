-- Simplifier la table client_invitations
DROP TABLE IF EXISTS client_invitations;

-- Nettoyer les colonnes d'invitation dans la table clients
ALTER TABLE clients
  DROP COLUMN IF EXISTS invitation_token,
  DROP COLUMN IF EXISTS invitation_expires_at,
  DROP COLUMN IF EXISTS invitation_accepted_at;

-- Ajouter une colonne pour l'accès temporaire
ALTER TABLE clients
  ADD COLUMN registration_access_until TIMESTAMPTZ;

-- Fonction pour donner l'accès à la création de compte
CREATE OR REPLACE FUNCTION allow_client_registration(
  p_client_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le client existe et n'a pas déjà un compte
  IF NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE id = p_client_id 
    AND auth_id IS NULL
  ) THEN
    RETURN false;
  END IF;

  -- Donner l'accès pour 10 minutes
  UPDATE clients
  SET registration_access_until = now() + interval '10 minutes'
  WHERE id = p_client_id;

  RETURN true;
END;
$$;

-- Fonction pour vérifier si un email peut créer un compte
CREATE OR REPLACE FUNCTION check_client_registration(
  p_email TEXT
)
RETURNS TABLE (
  client_id UUID,
  coach_id UUID,
  can_register BOOLEAN,
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
      WHEN c.registration_access_until IS NULL THEN false
      WHEN c.registration_access_until < now() THEN false
      ELSE true
    END as can_register,
    CASE
      WHEN c.auth_id IS NOT NULL THEN 'Email déjà associé à un compte'
      WHEN c.registration_access_until IS NULL THEN 'Accès non autorisé'
      WHEN c.registration_access_until < now() THEN 'Accès expiré'
      ELSE 'Création de compte autorisée'
    END as message
  FROM clients c
  WHERE c.email = p_email;
END;
$$;

-- Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Coaches can manage their clients" ON clients;
DROP POLICY IF EXISTS "Clients can read own data" ON clients;

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

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION allow_client_registration TO authenticated;
GRANT EXECUTE ON FUNCTION check_client_registration TO authenticated;