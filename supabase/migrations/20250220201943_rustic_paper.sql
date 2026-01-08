-- Ajout de la colonne auth_id à la table clients si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN auth_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Fonction pour vérifier si un email est autorisé à s'inscrire
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
      ELSE true
    END as valid,
    CASE
      WHEN c.auth_id IS NOT NULL THEN 'Email déjà associé à un compte'
      ELSE 'Email autorisé'
    END as message
  FROM clients c
  WHERE c.email = p_email;
END;
$$;

-- Fonction pour lier un compte client à son auth_id
CREATE OR REPLACE FUNCTION link_client_account(
  p_email TEXT,
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
  -- Vérifier si l'email est autorisé
  SELECT client_id, valid INTO v_client_id, v_valid
  FROM check_client_email(p_email);

  IF NOT v_valid THEN
    RETURN false;
  END IF;

  -- Mettre à jour le client avec l'auth_id
  UPDATE clients
  SET auth_id = p_auth_id
  WHERE id = v_client_id;

  RETURN true;
END;
$$;

-- Mettre à jour les politiques RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

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
GRANT EXECUTE ON FUNCTION check_client_email TO authenticated;
GRANT EXECUTE ON FUNCTION link_client_account TO authenticated;