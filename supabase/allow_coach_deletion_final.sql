-- FINAL FIX: Allow Coach Deletion by adding missing CASCADE constraints

BEGIN;

-- 1. Fix 'payments' table (The likely blocker)
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_coach_id_fkey,
ADD CONSTRAINT payments_coach_id_fkey
    FOREIGN KEY (coach_id)
    REFERENCES coaches(id)
    ON DELETE CASCADE;

-- 2. Fix 'banned_by' in 'clients' (Set to NULL if coach is deleted)
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_banned_by_fkey,
ADD CONSTRAINT clients_banned_by_fkey
    FOREIGN KEY (banned_by)
    REFERENCES coaches(id)
    ON DELETE SET NULL;

-- 3. Fix 'banned_by' in 'coaches' (Set to NULL if admin coach is deleted)
ALTER TABLE coaches
DROP CONSTRAINT IF EXISTS coaches_banned_by_fkey,
ADD CONSTRAINT coaches_banned_by_fkey
    FOREIGN KEY (banned_by)
    REFERENCES coaches(id)
    ON DELETE SET NULL;

-- 4. Re-apply validation for other key tables (Just in case)

-- Clients
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey,
ADD CONSTRAINT clients_coach_id_fkey
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

COMMIT;
