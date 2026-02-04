-- Add is_template column to sessions table
-- Default to true so existing sessions remain visible in the library
-- New ad-hoc live sessions can be created with is_template = false to hide them

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT true;

-- Update RLS policies if necessary (usually not needed for just adding a column if generic policies exist)
-- But ensuring the column is accessible is good practice. 
-- Existing policies likely cover "all columns" or specific operations.

COMMENT ON COLUMN public.sessions.is_template IS 'If true, this session appears in the library. If false, it is a hidden/historical record only.';
