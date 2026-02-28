-- Drop the trigger that enforces program limits
DROP TRIGGER IF EXISTS check_program_limit_trigger ON programs;

-- Drop the function
DROP FUNCTION IF EXISTS check_program_limit();
