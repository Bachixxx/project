-- RPC to fetch session exercises for a client, bypassing RLS complexity
-- Usage: supabase.rpc('get_client_session_exercises', { p_session_id: '...' })

CREATE OR REPLACE FUNCTION get_client_session_exercises(p_session_id uuid)
RETURNS TABLE (
    id uuid,
    sets integer,
    reps integer,
    rest_time integer,
    instructions text,
    order_index integer,
    duration_seconds integer,
    distance_meters integer,
    exercise_id uuid,
    exercise_name text,
    exercise_description text,
    tracking_type text,
    track_reps boolean,
    track_weight boolean,
    track_duration boolean,
    track_distance boolean,
    video_url text,
    group_id uuid,
    group_type text,
    group_name text,
    group_duration integer,
    group_repetitions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the user has access to this session via appointment or schedule
    -- We can verify this by checking if the user is the client of a scheduled_session with this session_id
    -- OR if they have an appointment for it.
    
    IF NOT EXISTS (
        SELECT 1 
        FROM scheduled_sessions ss
        WHERE ss.session_id = p_session_id
        AND ss.client_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 
        FROM appointments a
        WHERE a.session_id = p_session_id
        AND a.client_id = auth.uid()
    ) THEN
        -- Allow if user is a coach (optional, but good for testing)
        IF NOT EXISTS (
            SELECT 1 FROM sessions s WHERE s.id = p_session_id AND s.coach_id = auth.uid()
        ) THEN
             RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;

    RETURN QUERY
    SELECT 
        se.id,
        se.sets,
        se.reps,
        se.rest_time,
        se.instructions,
        se.order_index,
        se.duration_seconds,
        se.distance_meters,
        e.id as exercise_id,
        e.name as exercise_name,
        e.description as exercise_description,
        e.tracking_type,
        e.track_reps,
        e.track_weight,
        e.track_duration,
        e.track_distance,
        e.video_url,
        se.group_id,
        g.type as group_type,
        g.name as group_name,
        g.duration_seconds as group_duration,
        g.repetitions as group_repetitions
    FROM session_exercises se
    JOIN exercises e ON e.id = se.exercise_id
    LEFT JOIN exercise_groups g ON g.id = se.group_id
    WHERE se.session_id = p_session_id
    ORDER BY se.order_index ASC;
END;
$$;
