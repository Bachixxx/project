-- Add branding tracking columns to coaches table
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS has_branding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS branding_subscription_id TEXT;
