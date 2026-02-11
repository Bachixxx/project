/*
  # Add Gamification System
  
  1. New Columns (clients table)
    - `xp` (integer, default 0)
    - `level` (integer, default 1)
    - `current_streak` (integer, default 0)
    - `last_activity_date` (timestamptz)

  2. Functions
    - `calculate_level(xp)`: Returns level based on XP.
    - `update_client_gamification()`: Trigger function to update stats on session completion.

  3. Triggers
    - `on_session_completed_gamification`: Runs on `scheduled_sessions` update.
*/

-- Add columns to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date timestamptz;

-- Function to calculate level based on XP
CREATE OR REPLACE FUNCTION calculate_level(xp integer) RETURNS integer AS $$
BEGIN
  -- Simple formula: Level = 1 + floor(sqrt(XP / 100))
  -- XP: 0 -> Lvl 1
  -- XP: 100 -> Lvl 2
  -- XP: 400 -> Lvl 3
  -- XP: 900 -> Lvl 4
  RETURN 1 + floor(sqrt(GREATEST(xp, 0)::float / 100.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function
CREATE OR REPLACE FUNCTION update_client_gamification() RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_last_activity timestamptz;
  v_current_streak integer;
  v_new_streak integer;
  v_xp_gain integer;
  v_current_xp integer;
  v_new_xp integer;
  v_new_level integer;
  v_today date;
  v_last_date date;
BEGIN
  -- Only run when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_client_id := NEW.client_id;
    
    -- Get current client stats
    SELECT last_activity_date, COALESCE(current_streak, 0), COALESCE(xp, 0)
    INTO v_last_activity, v_current_streak, v_current_xp
    FROM clients 
    WHERE id = v_client_id;
    
    v_today := CURRENT_DATE;
    v_last_date := v_last_activity::date;
    
    -- Calculate Streak
    IF v_last_activity IS NULL THEN
      v_new_streak := 1; -- First activity
    ELSIF v_last_date = v_today THEN
      v_new_streak := v_current_streak; -- Already active today, keep streak
    ELSIF v_last_date = v_today - 1 THEN
      v_new_streak := v_current_streak + 1; -- Consecutive day
    ELSE
      v_new_streak := 1; -- Streak broken
    END IF;
    
    -- Calculate XP
    -- Base 100 + Streak Bonus (10 per day, max 50)
    v_xp_gain := 100 + LEAST(v_new_streak * 10, 50);
    v_new_xp := v_current_xp + v_xp_gain;
    
    -- Calculate Level
    v_new_level := calculate_level(v_new_xp);
    
    -- Update Client
    UPDATE clients 
    SET 
      xp = v_new_xp,
      level = v_new_level,
      current_streak = v_new_streak,
      last_activity_date = NOW()
    WHERE id = v_client_id;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_session_completed_gamification ON scheduled_sessions;
CREATE TRIGGER on_session_completed_gamification
  AFTER UPDATE ON scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_gamification();
