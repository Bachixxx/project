-- Atomic subscription event processing: UPDATE coaches + INSERT subscription_history
-- in a single transaction to prevent inconsistent state.

CREATE OR REPLACE FUNCTION process_subscription_event(
  p_coach_id UUID,
  p_action TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_action = 'activate' THEN
    IF p_type = 'branding_addon' THEN
      UPDATE coaches SET has_branding = true, branding_subscription_id = p_subscription_id
      WHERE id = p_coach_id;

    ELSIF p_type = 'terminal_addon' THEN
      UPDATE coaches SET has_terminal = true, terminal_subscription_id = p_subscription_id
      WHERE id = p_coach_id;

    ELSE
      UPDATE coaches SET
        subscription_type = 'paid', client_limit = NULL,
        stripe_subscription_id = p_subscription_id,
        subscription_end_date = now() + interval '30 days'
      WHERE id = p_coach_id;

      INSERT INTO subscription_history (coach_id, previous_type, new_type, payment_id, notes)
      VALUES (p_coach_id, 'free', 'paid', p_payment_id, 'Subscription upgraded via Stripe checkout');
    END IF;

  ELSIF p_action = 'deactivate' THEN
    IF p_type = 'branding_addon' THEN
      UPDATE coaches SET has_branding = false, branding_subscription_id = NULL
      WHERE id = p_coach_id;

    ELSIF p_type = 'terminal_addon' THEN
      UPDATE coaches SET has_terminal = false, terminal_subscription_id = NULL
      WHERE id = p_coach_id;

    ELSE
      UPDATE coaches SET
        subscription_type = 'free', client_limit = 5,
        stripe_subscription_id = NULL, subscription_end_date = NULL
      WHERE id = p_coach_id;

      INSERT INTO subscription_history (coach_id, previous_type, new_type, notes)
      VALUES (p_coach_id, 'paid', 'free', 'Subscription cancelled');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
