-- Add onboarding_completed column to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Optional: If you want to force existing coaches to have access without onboarding, uncomment the following line
-- UPDATE coaches SET onboarding_completed = TRUE;
