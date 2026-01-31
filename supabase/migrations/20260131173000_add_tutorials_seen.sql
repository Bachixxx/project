-- Add tutorials_seen column to track which progressive onboarding steps have been viewed
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tutorials_seen JSONB DEFAULT '[]'::jsonb;
