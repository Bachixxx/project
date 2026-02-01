-- RPC Function to cleanup all data for a specific coach
-- Usage: SELECT cleanup_coach_data('user_uuid_here');

CREATE OR REPLACE FUNCTION cleanup_coach_data(target_coach_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Payments (Appointments & Clients)
    DELETE FROM payments 
    WHERE appointment_id IN (SELECT id FROM appointments WHERE coach_id = target_coach_id)
       OR client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- 2. Workout Logs (linked to clients)
    DELETE FROM workout_logs 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- 3. Session Registrations (linked to coach or their clients)
    DELETE FROM session_registrations 
    WHERE coach_id = target_coach_id
       OR client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- 4. Scheduled Sessions
    DELETE FROM scheduled_sessions 
    WHERE coach_id = target_coach_id;

    -- 5. Workout Sessions (linked to client_programs)
    DELETE FROM workout_sessions 
    WHERE client_program_id IN (
        SELECT cp.id FROM client_programs cp
        JOIN clients c ON c.id = cp.client_id
        WHERE c.coach_id = target_coach_id
    );

    -- 6. Program Exercises (linked to programs)
    DELETE FROM program_exercises 
    WHERE program_id IN (SELECT id FROM programs WHERE coach_id = target_coach_id);

    -- 7. Client Programs (linked to clients)
    DELETE FROM client_programs 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- 8. Body Scans & Photos & Weight History (linked to clients)
    DELETE FROM body_scans 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);
    
    DELETE FROM client_photos 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);
    
    DELETE FROM client_weight_history 
    WHERE client_id IN (SELECT id FROM clients WHERE coach_id = target_coach_id);

    -- 9. Appointments
    DELETE FROM appointments WHERE coach_id = target_coach_id;

    -- 10. Subscription History
    DELETE FROM subscription_history WHERE coach_id = target_coach_id;

    -- 11. Clients
    DELETE FROM clients WHERE coach_id = target_coach_id;

    -- 12. Programs & Exercises
    DELETE FROM programs WHERE coach_id = target_coach_id;
    DELETE FROM exercises WHERE coach_id = target_coach_id;
    
    -- 13. Notifications (Logs & Queue if exists)
    -- (Assuming no direct FK, but good to clean if tied to user)

    -- 14. Coach Profile
    DELETE FROM coaches WHERE id = target_coach_id;
    
    -- Note: We generally NOT delete from auth.users here as that requires special privileges
    -- or different context. This function cleans the PUBLIC schema to unblock auth deletion.

END;
$$;
