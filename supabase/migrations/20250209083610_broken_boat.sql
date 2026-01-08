-- Create function to call Edge Function
CREATE OR REPLACE FUNCTION handle_new_coach()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := CONCAT(current_setting('app.settings.edge_function_base_url'), '/welcome-email'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_coach_created ON coaches;
CREATE TRIGGER on_coach_created
  AFTER INSERT ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_coach();