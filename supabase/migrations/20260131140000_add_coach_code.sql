ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS coach_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_coaches_coach_code ON public.coaches(coach_code);
