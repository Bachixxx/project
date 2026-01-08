/*
  # Initial Schema for Fitness Coach CRM

  1. New Tables
    - coaches
    - exercises
    - programs
    - clients
    - appointments
    - program_exercises
    - client_programs

  2. Security
    - RLS enabled on all tables
    - Policies for coach-specific data access
*/

-- Create tables if they don't exist
DO $$ 
BEGIN
  -- Coaches table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coaches') THEN
    CREATE TABLE coaches (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      specialization TEXT,
      bio TEXT,
      profile_image_url TEXT,
      stripe_account_id TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Exercises table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'exercises') THEN
    CREATE TABLE exercises (
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
  END IF;

  -- Programs table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'programs') THEN
    CREATE TABLE programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID REFERENCES coaches(id),
      name TEXT NOT NULL,
      description TEXT,
      duration_weeks INTEGER,
      difficulty_level TEXT,
      price DECIMAL(10,2),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Clients table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients') THEN
    CREATE TABLE clients (
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
  END IF;

  -- Appointments table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'appointments') THEN
    CREATE TABLE appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID REFERENCES coaches(id),
      client_id UUID REFERENCES clients(id),
      title TEXT NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      type TEXT NOT NULL, -- 'private' or 'group'
      max_participants INTEGER,
      current_participants INTEGER DEFAULT 1,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Junction table for programs and exercises
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'program_exercises') THEN
    CREATE TABLE program_exercises (
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
  END IF;

  -- Junction table for client program assignments
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_programs') THEN
    CREATE TABLE client_programs (
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
  END IF;
END $$;

-- Enable RLS on all tables
DO $$ 
BEGIN
  -- Enable RLS
  ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
  ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
  ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Coaches can read own data" ON coaches;
  DROP POLICY IF EXISTS "Coaches can CRUD own exercises" ON exercises;
  DROP POLICY IF EXISTS "Coaches can CRUD own programs" ON programs;
  DROP POLICY IF EXISTS "Coaches can CRUD own clients" ON clients;
  DROP POLICY IF EXISTS "Coaches can CRUD own appointments" ON appointments;
  DROP POLICY IF EXISTS "Coaches can CRUD own program exercises" ON program_exercises;
  DROP POLICY IF EXISTS "Coaches can CRUD own client programs" ON client_programs;

  -- Create new policies
  CREATE POLICY "Coaches can read own data"
    ON coaches FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Coaches can CRUD own exercises"
    ON exercises FOR ALL
    TO authenticated
    USING (auth.uid() = coach_id);

  CREATE POLICY "Coaches can CRUD own programs"
    ON programs FOR ALL
    TO authenticated
    USING (auth.uid() = coach_id);

  CREATE POLICY "Coaches can CRUD own clients"
    ON clients FOR ALL
    TO authenticated
    USING (auth.uid() = coach_id);

  CREATE POLICY "Coaches can CRUD own appointments"
    ON appointments FOR ALL
    TO authenticated
    USING (auth.uid() = coach_id);

  CREATE POLICY "Coaches can CRUD own program exercises"
    ON program_exercises FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM programs
        WHERE programs.id = program_exercises.program_id
        AND programs.coach_id = auth.uid()
      )
    );

  CREATE POLICY "Coaches can CRUD own client programs"
    ON client_programs FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = client_programs.client_id
        AND clients.coach_id = auth.uid()
      )
    );
END $$;