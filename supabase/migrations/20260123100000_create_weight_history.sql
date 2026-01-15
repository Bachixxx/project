/*
  # Create Client Weight History
  
  1. New Tables
    - `client_weight_history`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `weight` (decimal)
      - `date` (date)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `client_weight_history`
    - Add policies for coaches and clients
    
  3. Automation
    - Add trigger to automatically record weight history when client profile is updated
*/

-- Create weight history table
CREATE TABLE IF NOT EXISTS client_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_weight_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view own weight history"
  ON client_weight_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_weight_history.client_id
      AND clients.auth_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view their clients weight history"
  ON client_weight_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_weight_history.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Function to handle weight updates
CREATE OR REPLACE FUNCTION handle_weight_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If weight has changed
  IF OLD.weight IS DISTINCT FROM NEW.weight AND NEW.weight IS NOT NULL THEN
    -- Check if we already have an entry for today
    IF EXISTS (
      SELECT 1 FROM client_weight_history 
      WHERE client_id = NEW.id 
      AND date = CURRENT_DATE
    ) THEN
      -- Update today's entry
      UPDATE client_weight_history 
      SET weight = NEW.weight 
      WHERE client_id = NEW.id 
      AND date = CURRENT_DATE;
    ELSE
      -- Insert new entry
      INSERT INTO client_weight_history (client_id, weight, date)
      VALUES (NEW.id, NEW.weight, CURRENT_DATE);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for weight updates including inserts (new clients)
DROP TRIGGER IF EXISTS on_client_weight_update ON clients;
CREATE TRIGGER on_client_weight_update
  AFTER INSERT OR UPDATE OF weight
  ON clients
  FOR EACH ROW
  EXECUTE FUNCTION handle_weight_update();
