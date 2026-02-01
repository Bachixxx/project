-- Allow deleting a user from auth.users to cascade delete their coach profile
ALTER TABLE coaches
DROP CONSTRAINT IF EXISTS coaches_id_fkey,
ADD CONSTRAINT coaches_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Allow deleting a coach to cascade delete their related data

-- Clients
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey,
ADD CONSTRAINT clients_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;

-- Exercises
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_coach_id_fkey,
ADD CONSTRAINT exercises_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;

-- Programs
ALTER TABLE programs
DROP CONSTRAINT IF EXISTS programs_coach_id_fkey,
ADD CONSTRAINT programs_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;

-- Appointments
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_coach_id_fkey,
ADD CONSTRAINT appointments_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;

-- Subscription History
ALTER TABLE subscription_history
DROP CONSTRAINT IF EXISTS subscription_history_coach_id_fkey,
ADD CONSTRAINT subscription_history_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;
