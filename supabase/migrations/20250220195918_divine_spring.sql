-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates
CREATE POLICY "Allow read access to email templates"
  ON email_templates FOR SELECT
  USING (true);

-- Insert default client invitation template
INSERT INTO email_templates (name, subject, body)
VALUES (
  'client_invitation',
  'Invitation à rejoindre votre espace client',
  '
Bonjour {{client_name}},

{{coach_name}} vous invite à rejoindre votre espace client sur Coachency.

Pour activer votre compte, cliquez sur le lien suivant :
{{invitation_url}}

Ce lien est valable pendant 7 jours.

À bientôt !
L''équipe Coachency
  '
) ON CONFLICT (name) DO UPDATE
SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = now();

-- Function to send email using template
CREATE OR REPLACE FUNCTION send_templated_email(
  p_template_name TEXT,
  p_to TEXT,
  p_vars JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template email_templates;
  v_subject TEXT;
  v_body TEXT;
  v_var TEXT;
  v_value TEXT;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM email_templates
  WHERE name = p_template_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_name;
  END IF;

  -- Replace variables in subject and body
  v_subject := v_template.subject;
  v_body := v_template.body;

  FOR v_var, v_value IN SELECT * FROM jsonb_each_text(p_vars)
  LOOP
    v_subject := replace(v_subject, '{{' || v_var || '}}', v_value);
    v_body := replace(v_body, '{{' || v_var || '}}', v_value);
  END LOOP;

  -- Send email using Edge Function
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_base_url') || '/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'to', p_to,
      'subject', v_subject,
      'body', v_body
    )
  );

  RETURN true;
END;
$$;

-- Update create_client_invitation to send email
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

  -- Send invitation email
  PERFORM send_templated_email(
    'client_invitation',
    p_email,
    jsonb_build_object(
      'client_name', v_client_name,
      'coach_name', v_coach_name,
      'invitation_url', current_setting('app.settings.site_url') || '/client/register?token=' || v_token
    )
  );

  RETURN v_token;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_client_invitation: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_templated_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_client_invitation TO authenticated;