-- Add coach_code column to coaches table
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS coach_code text UNIQUE;

-- Function to generate a random alphanumeric string
CREATE OR REPLACE FUNCTION generate_unique_coach_code(coach_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    clean_name text;
    base_code text;
    new_code text;
    code_exists boolean;
BEGIN
    -- Take first part of name or 'COACH', remove spaces/special chars, uppercase
    clean_name := COALESCE(
        regexp_replace(upper(split_part(coach_name, ' ', 1)), '[^A-Z]', '', 'g'), 
        'COACH'
    );
    
    IF length(clean_name) < 3 THEN
        clean_name := 'COACH';
    END IF;

    -- Generate code loop
    LOOP
        -- Format: NAME-XXXX (4 random chars)
        base_code := clean_name || '-' || 
                     chr(trunc(65 + random() * 26)::int) ||
                     chr(trunc(65 + random() * 26)::int) ||
                     chr(trunc(65 + random() * 26)::int) ||
                     chr(trunc(48 + random() * 10)::int); -- digits for last char maybe? keeping it letters+digits mix is better
        
        -- Let's stick to simple alphanumeric uppercase
        new_code := clean_name || '-' || 
            upper(substring(md5(random()::text) from 1 for 4));

        -- Check if exists
        SELECT EXISTS (
            SELECT 1 FROM public.coaches WHERE coach_code = new_code
        ) INTO code_exists;

        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$;

-- Trigger function to assign code on insert
CREATE OR REPLACE FUNCTION set_coach_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.coach_code IS NULL THEN
        NEW.coach_code := generate_unique_coach_code(NEW.full_name);
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_coach_code ON public.coaches;
CREATE TRIGGER trigger_set_coach_code
    BEFORE INSERT ON public.coaches
    FOR EACH ROW
    EXECUTE FUNCTION set_coach_code();

-- Backfill existing coaches
DO $$
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT id, full_name FROM public.coaches WHERE coach_code IS NULL LOOP
        UPDATE public.coaches 
        SET coach_code = generate_unique_coach_code(r.full_name)
        WHERE id = r.id;
    END LOOP;
END $$;

-- RPC function for clients to link themselves
CREATE OR REPLACE FUNCTION link_client_to_coach(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coach_id uuid;
    v_coach_name text;
    v_client_id uuid;
BEGIN
    -- Get current user ID (client)
    v_client_id := auth.uid();
    
    IF v_client_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Find coach by code
    SELECT id, full_name INTO v_coach_id, v_coach_name
    FROM public.coaches 
    WHERE coach_code = upper(trim(p_code));

    IF v_coach_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Code coach invalide');
    END IF;

    -- Verify client exists or creates connection? 
    -- Assuming client record exists and we are just updating coach_id.
    
    -- Check if client is already linked to this coach
    IF EXISTS (
        SELECT 1 FROM public.clients 
        WHERE auth_id = v_client_id AND coach_id = v_coach_id
    ) THEN
        RETURN json_build_object('success', true, 'message', 'Déjà associé à ce coach', 'coach_name', v_coach_name);
    END IF;

    -- Update client record
    -- We assume the client has a record linked to their auth_id
    UPDATE public.clients
    SET coach_id = v_coach_id
    WHERE auth_id = v_client_id;
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Coach mis à jour avec succès', 'coach_name', v_coach_name);
    ELSE
         -- If no client profile exists yet (shouldn't happen in settings flow but maybe in registration flow)
         -- Handled by registration flow typically creating the user.
         -- If this is called purely for linking, user must exist.
         RETURN json_build_object('success', false, 'message', 'Profil client introuvable');
    END IF;
END;
$$;
