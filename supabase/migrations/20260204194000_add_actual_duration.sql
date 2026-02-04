-- Add actual_duration_seconds to scheduled_sessions table
ALTER TABLE public.scheduled_sessions 
ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN public.scheduled_sessions.actual_duration_seconds IS 'The actual duration of the session in seconds, recorded when the client completes the workout.';
