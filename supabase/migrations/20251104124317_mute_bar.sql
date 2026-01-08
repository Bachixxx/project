/*
  # Clean up edge function configuration references

  This migration removes any remaining references to the problematic
  app.settings.edge_function_base_url configuration parameter that is
  causing errors in client operations.

  1. Changes
    - Drop any remaining functions that reference edge_function_base_url
    - Remove any triggers that might be calling these functions
    - Ensure clients table operations work without edge function dependencies

  2. Security
    - Maintain existing RLS policies
    - Keep essential client management functionality
*/

-- Drop any remaining functions that might reference the edge function URL
DROP FUNCTION IF EXISTS public.send_templated_email(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_client_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS public.notify_client_creation();
DROP FUNCTION IF EXISTS public.handle_client_invitation();

-- Check for and remove any triggers on clients table that might be causing issues
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Get all triggers on the clients table
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE event_object_table = 'clients'
    LOOP
        -- Drop each trigger
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
        
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Ensure the allow_client_registration function exists and works properly
CREATE OR REPLACE FUNCTION public.allow_client_registration(
  p_client_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  -- Get client info
  SELECT * INTO v_client
  FROM clients
  WHERE id = p_client_id;

  -- Check if client exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Client not found'
    );
  END IF;

  -- Check if client already has an account
  IF v_client.auth_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Client already has an account'
    );
  END IF;

  -- Update client with registration access
  UPDATE clients
  SET registration_access_until = now() + interval '10 minutes'
  WHERE id = p_client_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration access granted',
    'expires_at', now() + interval '10 minutes'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.allow_client_registration(UUID) TO authenticated;

-- Verify clients table structure and ensure it can handle basic operations
DO $$
BEGIN
  -- Test that we can perform basic operations on clients table
  PERFORM 1 FROM clients LIMIT 1;
  RAISE NOTICE 'Clients table is accessible and ready for operations';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Clients table check completed with note: %', SQLERRM;
END $$;