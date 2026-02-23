-- Add scheduling_type to client_programs
ALTER TABLE client_programs 
ADD COLUMN IF NOT EXISTS scheduling_type text DEFAULT 'self_paced';

-- Update existing records to have a scheduling_type if they don't
UPDATE client_programs 
SET scheduling_type = 'self_paced' 
WHERE scheduling_type IS NULL;
