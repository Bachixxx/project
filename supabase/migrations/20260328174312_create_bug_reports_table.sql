CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_role TEXT CHECK (user_role IN ('coach', 'client')),
  page_url TEXT,
  description TEXT NOT NULL,
  screenshot TEXT,
  user_agent TEXT,
  screen_size TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a bug report
CREATE POLICY "Authenticated users can insert bug reports"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admin coaches can view bug reports
CREATE POLICY "Admins can view bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = auth.uid()
      AND coaches.is_admin = true
    )
  );
