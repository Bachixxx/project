-- Update the marketplace policy to show all programs, not just those with prices
DROP POLICY IF EXISTS "Public can read programs for marketplace" ON programs;
CREATE POLICY "Public can read programs for marketplace"
  ON programs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant necessary permissions for marketplace
GRANT SELECT ON programs TO anon;
GRANT SELECT ON coaches TO anon;
GRANT SELECT ON exercises TO anon;
GRANT SELECT ON program_exercises TO anon;