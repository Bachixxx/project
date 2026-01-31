-- Comprehensive Fix for Registration Dependencies
-- This migration ensures all necessary columns, permissions, and functions exist

-- 1. Ensure 'uuid-ossp' is enabled for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fix 'coaches' table schema
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS coach_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_coaches_coach_code ON public.coaches(coach_code);

-- 3. Fix 'clients' table schema
-- Ensure auth_id exists and references auth.users
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON public.clients(auth_id);

-- 4. Clean up any previous broken triggers/functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Also drop the old function name if it exists from previous migrations to avoid confusion
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- 5. Recreate the specific trigger function for Client Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_coach_id uuid;
    v_coach_code text;
    v_full_name text;
    v_existing_client_id uuid;
BEGIN
    -- Extract metadata form the auth.users record
    v_coach_code := new.raw_user_meta_data->>'coach_code';
    v_full_name := new.raw_user_meta_data->>'full_name';

    -- Find coach ID if code is provided
    IF v_coach_code IS NOT NULL AND length(v_coach_code) > 0 THEN
        BEGIN
            SELECT id INTO v_coach_id
            FROM public.coaches
            WHERE coach_code = upper(trim(v_coach_code));
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue (coach_id will be null)
            RAISE WARNING 'Error finding coach by code: %', SQLERRM;
        END;
    END IF;

    -- Check for Invite Flow (existing client with same email)
    SELECT id INTO v_existing_client_id
    FROM public.clients
    WHERE email = new.email;

    IF v_existing_client_id IS NOT NULL THEN
        -- UPDATE existing client
        UPDATE public.clients
        SET 
            auth_id = new.id,
            full_name = COALESCE(v_full_name, full_name, split_part(new.email, '@', 1)),
            status = 'active'
        WHERE id = v_existing_client_id;
    ELSE
        -- INSERT new client
        INSERT INTO public.clients (auth_id, email, full_name, coach_id, status)
        VALUES (
            new.id, 
            new.email, 
            COALESCE(v_full_name, split_part(new.email, '@', 1)),
            v_coach_id, 
            'active'
        );
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log the error so it can be seen in Supabase logs
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    -- Re-raise to ensure the auth user creation is rolled back (atomic)
    RAISE; 
END;
$$;

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant necessary permissions (vital for SECURITY DEFINER)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON public.clients TO postgres;
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.clients TO authenticated;

GRANT SELECT ON public.coaches TO postgres;
GRANT SELECT ON public.coaches TO service_role;
GRANT SELECT ON public.coaches TO authenticated; -- Needed for coach_code lookup? Function is SECURITY DEFINER so it uses owner's perms
