-- Recréation du schéma complet de la base de données

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialization TEXT,
  bio TEXT,
  profile_image_url TEXT,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'paid')),
  client_limit INTEGER DEFAULT 5,
  subscription_end_date TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  features TEXT[] NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default subscription plan if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM subscription_plans 
    WHERE stripe_price_id = 'price_1NhwTiKjaGJ8zmprI3sfWfNy'
  ) THEN
    INSERT INTO subscription_plans (
      name,
      description,
      price,
      interval,
      features,
      stripe_price_id,
      stripe_product_id
    ) VALUES (
      'Pro Mensuel',
      'Outils et fonctionnalités professionnels de coaching',
      49.90,
      'month',
      ARRAY[
        'Clients illimités',
        'Bibliothèque d''exercices personnalisée',
        'Création de programmes',
        'Gestion du calendrier',
        'Traitement des paiements',
        'Suivi des progrès des clients'
      ],
      'price_1NhwTiKjaGJ8zmprI3sfWfNy',
      'prod_RialhSXBiFHByN'
    );
  END IF;
END $$;

-- Create remaining tables
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  previous_type VARCHAR(10) NOT NULL,
  new_type VARCHAR(10) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  payment_id TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT,
  equipment TEXT[],
  instructions TEXT[],
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  difficulty_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  fitness_goals TEXT[],
  medical_conditions TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  start TIMESTAMPTZ NOT NULL,
  duration INTEGER CHECK (duration > 0),
  "end" TIMESTAMPTZ,
  type TEXT NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  rest_time INTEGER,
  order_index INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_program_id UUID REFERENCES client_programs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  completed_exercises JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer')),
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Coaches can insert own data"
  ON coaches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Coaches can read own data"
  ON coaches FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Coaches can update own data"
  ON coaches FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Coaches can view their own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can manage own exercises"
  ON exercises FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage own programs"
  ON programs FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage own clients"
  ON clients FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage own appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage own program exercises"
  ON program_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_exercises.program_id
      AND programs.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_exercises.program_id
      AND programs.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage client program assignments"
  ON client_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_programs.client_id
      AND clients.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_programs.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage workout sessions for their clients"
  ON workout_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_programs cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
      AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_programs cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = workout_sessions.client_program_id
      AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage payments for their appointments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
      AND a.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
      AND a.coach_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON subscription_plans(interval);
CREATE INDEX IF NOT EXISTS workout_sessions_client_program_id_idx ON workout_sessions(client_program_id);
CREATE INDEX IF NOT EXISTS workout_sessions_date_idx ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS payments_appointment_id_idx ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS payments_client_id_idx ON payments(client_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_client_limit()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    current_count INTEGER;
    coach_limit INTEGER;
  BEGIN
    SELECT COUNT(*), c.client_limit 
    INTO current_count, coach_limit
    FROM clients cl
    JOIN coaches c ON c.id = cl.coach_id
    WHERE cl.coach_id = NEW.coach_id
    GROUP BY c.client_limit;

    IF current_count >= coach_limit THEN
      RAISE EXCEPTION 'Client limit reached. Please upgrade your subscription.';
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_appointment_end()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end = NEW.start + (NEW.duration || ' minutes')::interval;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_payment_for_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payments (
    appointment_id,
    client_id,
    amount,
    status,
    payment_method
  ) VALUES (
    NEW.id,
    NEW.client_id,
    COALESCE(NEW.price, 0),
    'pending',
    'cash'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS check_client_limit_trigger ON clients;
CREATE TRIGGER check_client_limit_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION check_client_limit();

DROP TRIGGER IF EXISTS set_appointment_end ON appointments;
CREATE TRIGGER set_appointment_end
  BEFORE INSERT OR UPDATE OF start, duration ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_appointment_end();

DROP TRIGGER IF EXISTS create_payment_after_appointment ON appointments;
CREATE TRIGGER create_payment_after_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_for_appointment();