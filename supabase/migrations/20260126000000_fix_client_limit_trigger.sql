-- Fix user client limit trigger to respect subscription_type
CREATE OR REPLACE FUNCTION check_client_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  coach_record RECORD;
BEGIN
  -- Get coach info
  SELECT * INTO coach_record FROM coaches WHERE id = NEW.coach_id;

  -- If coach is paid, no limit enforcement
  IF coach_record.subscription_type = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Count current clients
  SELECT COUNT(*) INTO current_count 
  FROM clients 
  WHERE coach_id = NEW.coach_id;

  -- Check limit for free users
  IF current_count >= coach_record.client_limit THEN
    RAISE EXCEPTION 'Client limit reached. Please upgrade your subscription.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
