
-- 1. Fix the Trigger Function (Correct usage of net.http_post)
CREATE OR REPLACE FUNCTION public.handle_push_notification()
RETURNS trigger AS $$
BEGIN
  -- We use PERFORM to call the function without waiting for a result (Fire and Forget)
  PERFORM net.http_post(
      url := 'https://sbfalzkgizeaixligtfa.supabase.co/functions/v1/send-push',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmFsemtnaXplYWl4bGlndGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTkwNzUsImV4cCI6MjA1NDY3NTA3NX0.TDTXh-0WkCgV5ojlM01zU83SZz4Kd72LgZsCMGfyH8M"}'::jsonb,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure scheduled_sessions Schema is Correct
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'status') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN status text DEFAULT 'scheduled';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'payment_method') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN payment_method text DEFAULT 'in_person';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_sessions' AND column_name = 'payment_status') THEN
        ALTER TABLE public.scheduled_sessions ADD COLUMN payment_status text DEFAULT 'pending';
    END IF;
END $$;

-- 3. Re-apply the Trigger
DROP TRIGGER IF EXISTS on_scheduled_session_created ON public.scheduled_sessions;

CREATE TRIGGER on_scheduled_session_created
  AFTER INSERT ON public.scheduled_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_push_notification();
