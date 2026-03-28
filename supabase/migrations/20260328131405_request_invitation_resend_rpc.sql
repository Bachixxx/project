-- Simplified RPC: just opens registration window, always returns {success: true}.
-- No pg_net, no email sending, no information leak.
-- Email sending is handled by the resend-invitation edge function.

CREATE OR REPLACE FUNCTION request_invitation_resend(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_client RECORD;
BEGIN
  SELECT c.id, c.auth_id
  INTO v_client
  FROM clients c
  WHERE c.email = p_email
  LIMIT 1;

  IF v_client IS NOT NULL AND v_client.auth_id IS NULL THEN
    UPDATE clients SET registration_access_until = now() + interval '24 hours'
    WHERE id = v_client.id;
  END IF;

  -- Always return the same response
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION request_invitation_resend(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION request_invitation_resend(TEXT) TO authenticated;
