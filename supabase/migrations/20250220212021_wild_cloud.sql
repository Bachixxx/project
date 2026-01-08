-- Drop existing function
DROP FUNCTION IF EXISTS public.check_client_registration(text);

-- Create function with proper schema and permissions
CREATE OR REPLACE FUNCTION public.check_client_registration(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'success', CASE 
        WHEN c.id IS NULL THEN false
        WHEN c.auth_id IS NOT NULL THEN false
        ELSE true
      END,
      'message', CASE
        WHEN c.id IS NULL THEN 'Email non trouvé dans notre base de données'
        WHEN c.auth_id IS NOT NULL THEN 'Un compte existe déjà pour cet email'
        ELSE 'Inscription autorisée'
      END,
      'client_id', c.id
    )
    FROM clients c
    WHERE c.email = p_email
  );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_client_registration(text) TO anon, authenticated;

-- Ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow public email check" ON clients;
CREATE POLICY "Allow public email check"
  ON clients
  FOR SELECT
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);