-- Make session_id nullable to allow for non-workout items (notes, rest days)
ALTER TABLE scheduled_sessions ALTER COLUMN session_id DROP NOT NULL;

-- Add usage context (item_type)
ALTER TABLE scheduled_sessions 
ADD COLUMN item_type text NOT NULL DEFAULT 'session' 
CHECK (item_type IN ('session', 'rest', 'note', 'metric', 'nutrition'));

-- Add ordering capability
ALTER TABLE scheduled_sessions 
ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Add generic container for non-session data (e.g. Note text, Rest day type)
ALTER TABLE scheduled_sessions 
ADD COLUMN content jsonb DEFAULT '{}'::jsonb;

-- Add explicit title for items that don't inherit from a session template
ALTER TABLE scheduled_sessions 
ADD COLUMN title text;

-- Add index for efficient day-view querying with ordering
CREATE INDEX idx_scheduled_sessions_date_position 
ON scheduled_sessions(client_id, scheduled_date, position);
