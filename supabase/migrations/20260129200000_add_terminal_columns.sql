-- Add terminal subscription columns to coaches table
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS has_terminal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terminal_subscription_id text;

-- Add comment
COMMENT ON COLUMN coaches.has_terminal IS 'Whether the coach has subscribed to the Contactless Terminal add-on';
