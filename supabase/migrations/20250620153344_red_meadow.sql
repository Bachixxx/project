/*
  # Add marketplace support

  1. Changes
    - Add price column to programs table if it doesn't exist
    - Add is_test column to subscription_plans if it doesn't exist
    - Create indexes for better marketplace performance

  2. Security
    - Add RLS policy for public program access
*/

-- Add price column to programs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'price'
  ) THEN
    ALTER TABLE programs ADD COLUMN price DECIMAL(10,2);
  END IF;
END $$;

-- Add is_test column to subscription_plans if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'is_test'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN is_test BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create policy for public program access (marketplace)
DROP POLICY IF EXISTS "Public can read programs for marketplace" ON programs;
CREATE POLICY "Public can read programs for marketplace"
  ON programs
  FOR SELECT
  TO anon, authenticated
  USING (price IS NOT NULL);

-- Create policy for public coach access (marketplace)
DROP POLICY IF EXISTS "Public can read coaches for marketplace" ON coaches;
CREATE POLICY "Public can read coaches for marketplace"
  ON coaches
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for public exercise access (marketplace)
DROP POLICY IF EXISTS "Public can read exercises for marketplace" ON exercises;
CREATE POLICY "Public can read exercises for marketplace"
  ON exercises
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for public program_exercises access (marketplace)
DROP POLICY IF EXISTS "Public can read program exercises for marketplace" ON program_exercises;
CREATE POLICY "Public can read program exercises for marketplace"
  ON program_exercises
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better marketplace performance
CREATE INDEX IF NOT EXISTS idx_programs_price ON programs(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_programs_difficulty ON programs(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_coaches_specialization ON coaches(specialization);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);

-- Grant necessary permissions for marketplace
GRANT SELECT ON programs TO anon;
GRANT SELECT ON coaches TO anon;
GRANT SELECT ON exercises TO anon;
GRANT SELECT ON program_exercises TO anon;