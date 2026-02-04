CREATE TABLE IF NOT EXISTS public.coach_switch_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    previous_coach_id uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
    new_coach_id uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
    switched_at timestamptz DEFAULT now(),
    CONSTRAINT coach_switch_logs_pkey PRIMARY KEY (id)
);

ALTER TABLE public.coach_switch_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.log_coach_switch()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.coach_id IS DISTINCT FROM NEW.coach_id) THEN
        INSERT INTO public.coach_switch_logs (client_id, previous_coach_id, new_coach_id)
        VALUES (NEW.id, OLD.coach_id, NEW.coach_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_client_coach_change ON public.clients;
CREATE TRIGGER on_client_coach_change
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.log_coach_switch();
