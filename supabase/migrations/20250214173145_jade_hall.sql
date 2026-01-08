-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the function execution for debugging
  RAISE NOTICE 'Creating coach profile for user % with email %', NEW.id, NEW.email;

  -- Call the create_coach function
  PERFORM public.create_coach(
    p_user_id := NEW.id,
    p_email := NEW.email,
    p_full_name := NEW.raw_user_meta_data->>'full_name',
    p_phone := NEW.raw_user_meta_data->>'phone',
    p_specialization := NEW.raw_user_meta_data->>'specialization'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't prevent user creation
  RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user_registration();

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.create_coach TO authenticated;
GRANT EXECUTE ON FUNCTION auth.handle_new_user_registration TO authenticated;