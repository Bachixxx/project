-- Drop the old INSERT-only trigger
DROP TRIGGER IF EXISTS on_scheduled_session_created ON public.scheduled_sessions;

-- Create the new trigger that fires on INSERT and UPDATE
CREATE OR REPLACE TRIGGER on_scheduled_session_change
AFTER INSERT OR UPDATE ON public.scheduled_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_push_notification();
