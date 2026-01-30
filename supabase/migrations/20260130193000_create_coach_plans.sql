-- Create coach_plans table
CREATE TABLE IF NOT EXISTS coach_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL, -- Stored as decimal (e.g. 100.00), frontend handles cents conversion for Stripe
  currency TEXT DEFAULT 'chf',
  interval TEXT CHECK (interval IN ('month', 'year', 'week')) NOT NULL DEFAULT 'month',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE coach_plans ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own plans
CREATE POLICY "Coaches can view their own plans"
  ON coach_plans FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own plans"
  ON coach_plans FOR INSERT
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own plans"
  ON coach_plans FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own plans"
  ON coach_plans FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());
