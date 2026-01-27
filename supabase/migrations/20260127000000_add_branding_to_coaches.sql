/*
  # Add Branding Settings to Coaches

  1. Changes
    - Add `branding_settings` JSONB column to `coaches` table
    - Structure: {
        primaryColor: string,
        logoUrl: string | null,
        theme: 'dark' | 'light',
        welcomeMessage: string | null
      }
    - Default: null (stores nothing until set)
  
  2. Security
    - Existing RLS policies cover update/select for coaches
*/

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT NULL;

-- Add checking constraint to ensure it's an object if not null
ALTER TABLE coaches
ADD CONSTRAINT branding_settings_check 
CHECK (jsonb_typeof(branding_settings) = 'object' OR branding_settings IS NULL);
