-- Add archived_at to sessions table for Soft Delete
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.sessions.archived_at IS 'If set, the session is considered "soft deleted" and hidden from the coach library, but preserved for client history.';
