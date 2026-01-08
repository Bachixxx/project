/*
  # Fix Security and Performance Issues
  
  This migration addresses multiple security and performance issues:
  
  1. **Add Missing Indexes for Foreign Keys**
  2. **Remove Duplicate and Unused Indexes**
  3. **Enable RLS on registration_queue**
  4. **Fix Function Search Paths**
*/

-- ============================================
-- 1. Add Missing Indexes for Foreign Keys
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_coach_id ON public.appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_programs_client_id ON public.client_programs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_programs_program_id ON public.client_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_coach_ok_auth_id ON public.coach_ok(auth_id);
CREATE INDEX IF NOT EXISTS idx_coaches_subscription_plan_id ON public.coaches(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_program_exercises_exercise_id_new ON public.program_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_program_exercises_program_id_new ON public.program_exercises(program_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_session_id_new ON public.scheduled_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_coach_id_new ON public.subscription_history(coach_id);

-- ============================================
-- 2. Remove Duplicate and Unused Indexes
-- ============================================

DROP INDEX IF EXISTS public.idx_coaches_id;
DROP INDEX IF EXISTS public.idx_exercise_groups_session_id;
DROP INDEX IF EXISTS public.idx_session_exercises_group_id;
DROP INDEX IF EXISTS public.idx_coaches_specialization;
DROP INDEX IF EXISTS public.idx_exercises_category;
DROP INDEX IF EXISTS public.idx_program_sessions_order;
DROP INDEX IF EXISTS public.idx_programs_difficulty;
DROP INDEX IF EXISTS public.idx_programs_price;
DROP INDEX IF EXISTS public.idx_session_exercises_exercise_id;
DROP INDEX IF EXISTS public.idx_sessions_created_at;
DROP INDEX IF EXISTS public.idx_subscription_plans_interval;
DROP INDEX IF EXISTS public.idx_subscription_plans_price_id;
DROP INDEX IF EXISTS public.payments_client_id_idx;
DROP INDEX IF EXISTS public.idx_scheduled_sessions_coach;
DROP INDEX IF EXISTS public.idx_session_registrations_coach;
DROP INDEX IF EXISTS public.idx_appointment_participants_appointment;
DROP INDEX IF EXISTS public.idx_appointment_participants_client;

-- ============================================
-- 3. Enable RLS on registration_queue
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'registration_queue') THEN
    ALTER TABLE public.registration_queue ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Service role can manage registration queue" ON public.registration_queue;
    CREATE POLICY "Service role can manage registration queue"
      ON public.registration_queue FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 4. Fix Function Search Paths
-- ============================================

ALTER FUNCTION public.calculate_appointment_end() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_client_limit() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_client_registration(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_coach_ok(uuid, text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_payment_for_appointment() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_payment_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;