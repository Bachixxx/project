-- 1. Function to safely switch coach for a client
DROP FUNCTION IF EXISTS public.link_client_to_coach(text);

CREATE OR REPLACE FUNCTION link_client_to_coach(coach_code_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to update coach_id
SET search_path = public
AS $$
DECLARE
  target_coach_id uuid;
BEGIN
  -- Find the coach by unique code (case insensitive)
  SELECT id INTO target_coach_id
  FROM public.coaches
  WHERE coach_code = upper(trim(coach_code_input));

  IF target_coach_id IS NULL THEN
    RAISE EXCEPTION 'Code coach invalide. Veuillez vérifier le code.';
  END IF;

  -- Update the client's coach_id
  -- We rely on RLS/Auth to ensure 'auth.uid()' is the current user
  UPDATE public.clients
  SET coach_id = target_coach_id
  WHERE auth_id = auth.uid(); 

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Profil client non trouvé.';
  END IF;

  RETURN true;
END;
$$;

-- 2. Update RLS policies to allow "Inherited Access" for Programs
-- Allow a coach to read a program if ONE of their clients is assigned to it
-- This allows a substitute coach to see the program details even if they didn't create it.

DROP POLICY IF EXISTS "Coaches can CRUD own programs" ON programs;
DROP POLICY IF EXISTS "Coaches can read assigned programs" ON programs; -- Safety drop

-- Re-create Creator Policy (Full Access)
DROP POLICY IF EXISTS "Coaches can CRUD own programs" ON programs;
CREATE POLICY "Coaches can CRUD own programs"
  ON programs FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id);

-- Create Inherited Read Policy (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'programs' 
        AND policyname = 'Coaches can read assigned programs'
    ) THEN
        CREATE POLICY "Coaches can read assigned programs"
          ON programs FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM client_programs cp
              JOIN clients c ON c.id = cp.client_id
              WHERE cp.program_id = programs.id
              AND c.coach_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 3. Update RLS policies for Exercises (Optional but recommended)

DROP POLICY IF EXISTS "Coaches can CRUD own exercises" ON exercises;
CREATE POLICY "Coaches can CRUD own exercises"
  ON exercises FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id);

-- Create Inherited Read Policy for Exercises (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'exercises' 
        AND policyname = 'Coaches can read assigned exercises'
    ) THEN
        CREATE POLICY "Coaches can read assigned exercises"
          ON exercises FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              -- Is this exercise part of a program...
              SELECT 1 FROM program_exercises pe
              JOIN programs p ON p.id = pe.program_id
              -- ...that is assigned to one of my clients?
              JOIN client_programs cp ON cp.program_id = p.id
              JOIN clients c ON c.id = cp.client_id
              WHERE pe.exercise_id = exercises.id
              AND c.coach_id = auth.uid()
            )
          );
    END IF;
END $$;
