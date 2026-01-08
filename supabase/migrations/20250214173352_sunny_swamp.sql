-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_coach;

-- Create improved function for coach creation
CREATE OR REPLACE FUNCTION public.create_coach(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  -- Log function call
  RAISE NOTICE 'Creating coach: user_id=%, email=%, name=%', p_user_id, p_email, p_full_name;

  -- Insert new coach
  INSERT INTO public.coaches (
    id,
    email,
    full_name,
    phone,
    specialization,
    subscription_type,
    client_limit,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    COALESCE(p_full_name, split_part(p_email, '@', 1)),
    p_phone,
    p_specialization,
    'free',
    5,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_coach_id;

  -- Log successful creation
  RAISE NOTICE 'Coach created successfully with id: %', v_coach_id;
  
  RETURN v_coach_id;
EXCEPTION WHEN OTHERS THEN
  -- Log detailed error
  RAISE WARNING 'Error creating coach: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log trigger execution
  RAISE NOTICE 'Handling new user registration for user_id: %', NEW.id;

  -- Create coach profile
  PERFORM public.create_coach(
    p_user_id := NEW.id,
    p_email := NEW.email,
    p_full_name := NEW.raw_user_meta_data->>'full_name',
    p_phone := NEW.raw_user_meta_data->>'phone',
    p_specialization := NEW.raw_user_meta_data->>'specialization'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error in handle_new_user_registration: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user_registration();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coaches TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_coach TO authenticated;
GRANT EXECUTE ON FUNCTION auth.handle_new_user_registration TO authenticated;

-- Ensure RLS is properly configured
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "coaches_read" ON public.coaches;
DROP POLICY IF EXISTS "coaches_update" ON public.coaches;
DROP POLICY IF EXISTS "coaches_insert" ON public.coaches;

CREATE POLICY "coaches_read"
  ON public.coaches FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_update"
  ON public.coaches FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "coaches_insert"
  ON public.coaches FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());