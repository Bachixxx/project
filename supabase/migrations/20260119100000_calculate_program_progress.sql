-- Function to calculate and update client program progress
CREATE OR REPLACE FUNCTION update_client_program_progress()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  total_sessions INTEGER;
  completed_sessions INTEGER;
BEGIN
  -- Iterate through all active client programs that contain this session
  FOR rec IN
    SELECT cp.id, cp.program_id
    FROM client_programs cp
    JOIN program_sessions ps ON ps.program_id = cp.program_id
    WHERE cp.client_id = NEW.client_id
    AND ps.session_id = NEW.session_id
  LOOP
    -- Calculate total sessions in the program
    SELECT count(*) INTO total_sessions
    FROM program_sessions
    WHERE program_id = rec.program_id;

    -- Calculate completed sessions for this client in this program
    -- We look for completed scheduled_sessions that match sessions in this program
    SELECT count(DISTINCT s.session_id) INTO completed_sessions
    FROM scheduled_sessions s
    JOIN program_sessions ps ON ps.session_id = s.session_id
    WHERE s.client_id = NEW.client_id
    AND ps.program_id = rec.program_id
    AND s.status = 'completed';

    -- Avoid division by zero
    IF total_sessions > 0 THEN
      -- Update the progress
      UPDATE client_programs
      SET progress = ROUND((completed_sessions::numeric / total_sessions::numeric) * 100, 2),
          updated_at = now()
      WHERE id = rec.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to fire on scheduled_sessions changes (completion or un-completion)
DROP TRIGGER IF EXISTS trigger_update_program_progress ON scheduled_sessions;

CREATE TRIGGER trigger_update_program_progress
AFTER INSERT OR UPDATE OF status, session_id, client_id
ON scheduled_sessions
FOR EACH ROW
EXECUTE FUNCTION update_client_program_progress();

-- Backfill: Recalculate progress for all existing client programs
UPDATE client_programs cp
SET progress = COALESCE((
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT ps.session_id) = 0 THEN 0
      ELSE ROUND((COUNT(DISTINCT s.session_id)::numeric / COUNT(DISTINCT ps.session_id)::numeric) * 100, 2)
    END
  FROM program_sessions ps
  LEFT JOIN scheduled_sessions s ON s.session_id = ps.session_id 
    AND s.client_id = cp.client_id 
    AND s.status = 'completed'
  WHERE ps.program_id = cp.program_id
), 0);
