-- Function to update participant count
CREATE OR REPLACE FUNCTION update_appointment_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE appointments
    SET current_participants = (
      SELECT count(*)
      FROM appointment_registrations
      WHERE appointment_id = NEW.appointment_id
      AND status = 'registered'
    )
    WHERE id = NEW.appointment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE appointments
    SET current_participants = (
      SELECT count(*)
      FROM appointment_registrations
      WHERE appointment_id = OLD.appointment_id
      AND status = 'registered'
    )
    WHERE id = OLD.appointment_id;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status != OLD.status THEN
      UPDATE appointments
      SET current_participants = (
        SELECT count(*)
        FROM appointment_registrations
        WHERE appointment_id = NEW.appointment_id
        AND status = 'registered'
      )
      WHERE id = NEW.appointment_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointment_registrations
DROP TRIGGER IF EXISTS update_appointment_participants_count_trigger ON appointment_registrations;
CREATE TRIGGER update_appointment_participants_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON appointment_registrations
FOR EACH ROW
EXECUTE FUNCTION update_appointment_participants_count();

-- Recalculate all existing counts to fix current discrepancies
UPDATE appointments a
SET current_participants = (
  SELECT count(*)
  FROM appointment_registrations ar
  WHERE ar.appointment_id = a.id
  AND ar.status = 'registered'
);
