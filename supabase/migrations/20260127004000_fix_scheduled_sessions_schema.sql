
-- Fix missing columns in scheduled_sessions table
DO $$
BEGIN
    -- Add 'status' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'status') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN status text DEFAULT 'scheduled';
    END IF;

    -- Add 'payment_method' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'payment_method') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN payment_method text DEFAULT 'in_person';
    END IF;

    -- Add 'payment_status' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'payment_status') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN payment_status text DEFAULT 'pending';
    END IF;
END $$;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_scheduled_session_created ON public.scheduled_sessions;

-- Re-create the trigger for push notifications
CREATE TRIGGER on_scheduled_session_created
  AFTER INSERT ON public.scheduled_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_push_notification();
