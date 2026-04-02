-- Fix: cast reps from text to integer in save_session_atomic RPC
-- The ->>' operator returns TEXT; reps was missing the ::INT cast,
-- causing error 42804 when inserting into the integer column.

CREATE OR REPLACE FUNCTION save_session_atomic(
  p_session_data JSONB,
  p_session_id UUID DEFAULT NULL,
  p_blocks JSONB DEFAULT '[]'::JSONB,
  p_exercises JSONB DEFAULT '[]'::JSONB,
  p_coach_id UUID DEFAULT NULL,
  p_is_template BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_block JSONB;
  v_exercise JSONB;
  v_inserted_block_id UUID;
  v_block_id_map JSONB := '{}'::JSONB;
  v_temp_id TEXT;
  v_real_group_id UUID;
BEGIN
  -- 1. Create or update session
  IF p_session_id IS NOT NULL THEN
    UPDATE sessions SET
      name = p_session_data->>'name',
      description = p_session_data->>'description',
      duration_minutes = (p_session_data->>'duration_minutes')::INT,
      difficulty_level = p_session_data->>'difficulty_level',
      session_type = p_session_data->>'session_type',
      updated_at = now()
    WHERE id = p_session_id;
    v_session_id := p_session_id;

    DELETE FROM session_exercises WHERE session_id = v_session_id;
    DELETE FROM exercise_groups WHERE session_id = v_session_id;
  ELSE
    INSERT INTO sessions (name, description, duration_minutes, difficulty_level, session_type, coach_id, is_template)
    VALUES (
      p_session_data->>'name',
      p_session_data->>'description',
      (p_session_data->>'duration_minutes')::INT,
      p_session_data->>'difficulty_level',
      p_session_data->>'session_type',
      p_coach_id,
      p_is_template
    ) RETURNING id INTO v_session_id;
  END IF;

  -- 2. Insert blocks and map temp IDs to real IDs
  FOR v_block IN SELECT * FROM jsonb_array_elements(p_blocks)
  LOOP
    INSERT INTO exercise_groups (session_id, name, type, repetitions, duration_seconds, order_index, coach_id, is_template)
    VALUES (
      v_session_id,
      v_block->>'name',
      v_block->>'type',
      COALESCE((v_block->>'rounds')::INT, 1),
      (v_block->>'duration_seconds')::INT,
      (v_block->>'order_index')::INT,
      p_coach_id,
      false
    ) RETURNING id INTO v_inserted_block_id;

    v_temp_id := v_block->>'id';
    v_block_id_map := v_block_id_map || jsonb_build_object(v_temp_id, v_inserted_block_id);
  END LOOP;

  -- 3. Insert exercises (resolve group_id via temp→real map)
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    v_temp_id := v_exercise->>'group_id';
    IF v_temp_id IS NOT NULL AND v_block_id_map ? v_temp_id THEN
      v_real_group_id := (v_block_id_map->>v_temp_id)::UUID;
    ELSE
      v_real_group_id := NULL;
    END IF;

    INSERT INTO session_exercises (
      session_id, exercise_id, group_id, sets, reps, rest_time,
      duration_seconds, distance_meters, calories, instructions, order_index
    ) VALUES (
      v_session_id,
      (v_exercise->>'exercise_id')::UUID,
      v_real_group_id,
      (v_exercise->>'sets')::INT,
      (v_exercise->>'reps')::INT,
      (v_exercise->>'rest_time')::INT,
      (v_exercise->>'duration_seconds')::INT,
      (v_exercise->>'distance_meters')::DECIMAL,
      (v_exercise->>'calories')::INT,
      v_exercise->>'instructions',
      (v_exercise->>'order_index')::INT
    );
  END LOOP;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
