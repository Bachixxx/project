-- Drop the old simple policy
DROP POLICY IF EXISTS "Coaches can manage own exercises" ON public.exercises;

-- 1. READ POLICY: Everyone can read their own exercises AND system exercises (coach_id IS NULL)
CREATE POLICY "Users can view own and system exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (
    coach_id = auth.uid() OR coach_id IS NULL
  );

-- 2. WRITE POLICY (Standard Coaches): Can only manage their OWN exercises
CREATE POLICY "Coaches can insert own exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
  );

CREATE POLICY "Coaches can update own exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- 3. WRITE POLICY (Admins): Can manage SYSTEM exercises (coach_id IS NULL)
-- Note: We check against the public.coaches table to see if the user is an admin.
CREATE POLICY "Admins can insert system exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.coaches
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update system exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (
    coach_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.coaches
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    coach_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.coaches
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete system exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (
    coach_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.coaches
      WHERE id = auth.uid() AND is_admin = true
    )
  );
