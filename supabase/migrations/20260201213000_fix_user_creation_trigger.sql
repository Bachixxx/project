-- Fix handle_new_user to respect user role (Coach vs Client)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role text;
    v_full_name text;
    v_phone text;
    v_specialization text;
    v_coach_id uuid;
    v_coach_code text;
    v_existing_client_id uuid;
BEGIN
    -- Extract metadata
    v_role := new.raw_user_meta_data->>'role';
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := new.raw_user_meta_data->>'phone';
    v_specialization := new.raw_user_meta_data->>'specialization';
    v_coach_code := new.raw_user_meta_data->>'coach_code';

    -- Branch Logic based on Role
    IF v_role = 'coach' THEN
        -- -----------------------------------------------------
        -- COACH REGISTRATION
        -- -----------------------------------------------------
        INSERT INTO public.coaches (
            id,
            email,
            full_name,
            phone,
            specialization,
            subscription_type, -- Defaults usually 'free'
            client_limit       -- Default limit
        ) VALUES (
            new.id,
            new.email,
            v_full_name,
            v_phone,
            v_specialization,
            'free',
            5
        );
        -- Note: coach_code is handled by 'trigger_set_coach_code' on insert

    ELSE
        -- -----------------------------------------------------
        -- CLIENT REGISTRATION (Default)
        -- -----------------------------------------------------
        
        -- 1. Find Coach ID if code provided (Invite or Referral)
        IF v_coach_code IS NOT NULL AND length(v_coach_code) > 0 THEN
            BEGIN
                SELECT id INTO v_coach_id
                FROM public.coaches
                WHERE coach_code = upper(trim(v_coach_code));
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error finding coach by code: %', SQLERRM;
            END;
        END IF;

        -- 2. Check for Pre-Existing Client Profile (Invite by Email)
        SELECT id INTO v_existing_client_id
        FROM public.clients
        WHERE email = new.email;

        IF v_existing_client_id IS NOT NULL THEN
            -- Update existing profile to link to this Auth User
            UPDATE public.clients
            SET 
                auth_id = new.id,
                full_name = v_full_name,
                status = 'active'
            WHERE id = v_existing_client_id;
        ELSE
            -- Create New Client Profile
            INSERT INTO public.clients (
                auth_id,
                email,
                full_name,
                coach_id,
                status
            ) VALUES (
                new.id, 
                new.email, 
                v_full_name,
                v_coach_id, 
                'active'
            );
        END IF;

    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE; -- Allow transaction failure to prevent ghost users
END;
$$;
