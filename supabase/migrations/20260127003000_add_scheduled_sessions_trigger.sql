
-- Add trigger for scheduled_sessions table to handle push notifications
-- This ensures that sessions created via the Client Details modal also send notifications

CREATE TRIGGER on_scheduled_session_created
  AFTER INSERT ON public.scheduled_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_push_notification();
