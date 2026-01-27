-- Create the trigger function that calls the Edge Function
create or replace function public.handle_push_notification()
returns trigger as $$
declare
  response_status int;
  response_body text;
begin
  select
    status,
    content
  into
    response_status,
    response_body
  from
    net.http_post(
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

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger: New Appointment (Class)
drop trigger if exists on_new_appointment_push on public.appointments;
create trigger on_new_appointment_push
  after insert on public.appointments
  for each row execute procedure public.handle_push_notification();

-- Trigger: Workout Completed
-- Triggering on 'client_programs' status change
drop trigger if exists on_workout_completed_push on public.client_programs;
create trigger on_workout_completed_push
  after update on public.client_programs
  for each row
  when (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  execute procedure public.handle_push_notification();

-- Trigger: New Payment
-- Assuming 'payments' table exists, verify first if running manually
drop trigger if exists on_new_payment_push on public.payments;
create trigger on_new_payment_push
  after insert on public.payments
  for each row execute procedure public.handle_push_notification();
