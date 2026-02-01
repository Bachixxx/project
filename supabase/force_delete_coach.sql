-- EMERGENCY SCRIPT: FORCE DELETE COACH
-- Replace 'COACH_UUID_HERE' with the actual Coach ID you want to delete.

BEGIN;

-- 1. Variables
DO $$
DECLARE
    target_coach_id UUID := 'COACH_UUID_HERE'; -- <--- PUT ID HERE
BEGIN
    -- 2. Delete Child Data First (Manual Cascade)
    
    -- Delete Payments related to coach's appointments
    DELETE FROM payments 
    WHERE appointment_id IN (SELECT id FROM appointments WHERE coach_id = target_coach_id);

    -- Delete Workout Sessions related to coach's clients
    DELETE FROM workout_sessions 
    WHERE client_program_id IN (
        SELECT cp.id FROM client_programs cp
        JOIN clients c ON c.id = cp.client_id
        WHERE c.coach_id = target_coach_id
    );

    -- Delete Client Programs
    DELETE FROM client_programs 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- Delete Program Exercises
    DELETE FROM program_exercises 
    WHERE program_id IN (SELECT id FROM programs WHERE coach_id = target_coach_id);

    -- Delete Appointments
    DELETE FROM appointments WHERE coach_id = target_coach_id;

    -- Delete Subscription History
    DELETE FROM subscription_history WHERE coach_id = target_coach_id;

    -- Delete Clients
    DELETE FROM clients WHERE coach_id = target_coach_id;

    -- Delete Programs
    DELETE FROM programs WHERE coach_id = target_coach_id;

    -- Delete Exercises
    DELETE FROM exercises WHERE coach_id = target_coach_id;

    -- Delete Coach Profile
    DELETE FROM coaches WHERE id = target_coach_id;

    -- Finally: Delete from Auth (This usually requires Super Admin / Dashboard)
    -- If running in SQL Editor, this deletion in 'public' schema should suffice to clear the app state.
    -- The auth.users deletion might need to be done via the Supabase Dashboard "Authentication" tab 
    -- or using the `delete-account` Edge Function.
    
    RAISE NOTICE 'Coach % data successfully cleaned up from public schema.', target_coach_id;
END $$;

COMMIT;
