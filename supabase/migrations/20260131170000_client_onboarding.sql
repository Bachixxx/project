-- Add onboarding_completed column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Optional: Update existing clients to have onboarding_completed = true to avoid forcing them into the flow
-- UNCOMMENT the line below if you want existing users to skip onboarding
-- UPDATE clients SET onboarding_completed = TRUE;
