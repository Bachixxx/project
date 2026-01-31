-- Ensure necessary columns exist
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS coach_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_coaches_coach_code ON public.coaches(coach_code);

-- Function to handle new user signup (both Invite and Self-Register flows)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
            -- Safely handle case where column queries fail generally or content is bad
            RAISE WARNING 'Error finding coach by code: %', SQLERRM;
        END;
    END IF;

    -- Check if a client record with this email already exists (Invite Flow)
    SELECT id INTO v_existing_client_id
    FROM public.clients
    WHERE email = new.email;

    IF v_existing_client_id IS NOT NULL THEN
        -- UPDATE existing client (User was invited)
        UPDATE public.clients
        SET 
            auth_id = new.id,
            -- Update name only if it was a placeholder or empty
            full_name = COALESCE(v_full_name, full_name, split_part(new.email, '@', 1)),
            status = 'active'
        WHERE id = v_existing_client_id;
    ELSE
        -- INSERT new client (Self-Registration)
        INSERT INTO public.clients (auth_id, email, full_name, coach_id, status)
        VALUES (
            new.id,
            new.email,
            COALESCE(v_full_name, split_part(new.email, '@', 1)),
            v_coach_id, -- Will be NULL if no code provided, which is valid
            'active'
        );
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    -- Reraise to ensure auth fails if client creation fails (data integrity)
    RAISE; 
END;
$$;

-- Create the trigger on auth.users
-- Drop first to allow idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
