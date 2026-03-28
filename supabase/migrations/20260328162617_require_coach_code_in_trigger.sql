-- Safety net: reject client registration if no valid coach_code is provided
-- and no pre-existing client record exists (pre-created by coach).
-- This prevents orphan clients with coach_id = NULL.

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
    v_coach_code := new.raw_user_meta_data->>'coach_code';
    v_full_name := new.raw_user_meta_data->>'full_name';

    -- Resolve coach from code
    IF v_coach_code IS NOT NULL AND length(v_coach_code) > 0 THEN
        BEGIN
            SELECT id INTO v_coach_id
            FROM public.coaches
            WHERE coach_code = upper(trim(v_coach_code));
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error finding coach by code: %', SQLERRM;
        END;
    END IF;

    -- Check if coach pre-created this client
    SELECT id INTO v_existing_client_id
    FROM public.clients
    WHERE email = new.email;

    -- Safety net: reject if no coach found AND no pre-existing client
    IF v_coach_id IS NULL AND v_existing_client_id IS NULL THEN
        RAISE EXCEPTION 'Coach code is required for new client registration';
    END IF;

    IF v_existing_client_id IS NOT NULL THEN
        -- Coach pre-created this client: link auth account
        UPDATE public.clients
        SET
            auth_id = new.id,
            full_name = COALESCE(v_full_name, full_name, split_part(new.email, '@', 1)),
            coach_id = COALESCE(v_coach_id, coach_id),
            status = 'active'
        WHERE id = v_existing_client_id;
    ELSE
        -- New client with valid coach code
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
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE;
END;
$$;
