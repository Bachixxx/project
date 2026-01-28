-- Create a debug log table to track notification attempts
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    table_name TEXT,
    event_type TEXT,
    record JSONB,
    status TEXT,
    response_id TEXT,
    error_message TEXT
);

-- Enable RLS (optional, but good practice)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read/write for all" ON public.notification_logs FOR ALL USING (true);


-- Update the handle_push_notification function to LOG everything
CREATE OR REPLACE FUNCTION public.handle_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  url text := 'https://sbfalzkgizeaixligtfa.supabase.co/functions/v1/send-push';
  headers jsonb := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZmFsemtnaXplYWl4bGlndGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTkwNzUsImV4cCI6MjA1NDY3NTA3NX0.TDTXh-0WkCgV5ojlM01zU83SZz4Kd72LgZsCMGfyH8M"}'::jsonb;
  payload jsonb;
  request_id text; 
BEGIN
  -- Log the start of execution
  INSERT INTO public.notification_logs (table_name, event_type, record, status)
  VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW)::jsonb, 'STARTED');

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  -- Perform the request and capture the request_id (works with pg_net >= 0.2)
  -- For basic fire-and-forget:
  SELECT net.http_post(
      url,
      payload,
      headers
  ) INTO request_id;

  -- Log success
  INSERT INTO public.notification_logs (table_name, event_type, status, response_id)
  VALUES (TG_TABLE_NAME, TG_OP, 'SENT_REQUEST', request_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO public.notification_logs (table_name, event_type, status, error_message)
  VALUES (TG_TABLE_NAME, TG_OP, 'ERROR', SQLERRM);
  RETURN NEW;
END;
$$;
