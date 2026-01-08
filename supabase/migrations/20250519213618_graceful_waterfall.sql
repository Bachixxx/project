-- Add function to check program limit
CREATE OR REPLACE FUNCTION check_program_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_count INTEGER;
  v_subscription_type TEXT;
BEGIN
  -- Get coach's subscription type and current program count
  SELECT 
    c.subscription_type,
    COUNT(p.id)
  INTO 
    v_subscription_type,
    v_program_count
  FROM coaches c
  LEFT JOIN programs p ON p.coach_id = c.id
  WHERE c.id = NEW.coach_id
  GROUP BY c.subscription_type;

  -- Check if free plan has reached limit
  IF v_subscription_type = 'free' AND v_program_count >= 5 THEN
    RAISE EXCEPTION 'Free plan is limited to 5 programs. Please upgrade to create more programs.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to check limit before insert
DROP TRIGGER IF EXISTS check_program_limit_trigger ON programs;
CREATE TRIGGER check_program_limit_trigger
  BEFORE INSERT ON programs
  FOR EACH ROW
  EXECUTE FUNCTION check_program_limit();