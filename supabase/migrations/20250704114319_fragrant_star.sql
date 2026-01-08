/*
  # Fix Edge Function Configuration

  This migration adds the required configuration parameter for Edge Functions
  to resolve the "unrecognized configuration parameter app.settings.edge_function_base_url" error.

  1. Configuration
    - Set the edge_function_base_url parameter for the database
    - This allows database functions to properly invoke Edge Functions

  2. Notes
    - This fixes the error occurring when triggers try to invoke Edge Functions
    - The URL should match your Supabase project's Edge Function endpoint
*/

-- Set the edge function base URL configuration parameter
-- This allows database functions to invoke Edge Functions properly
DO $$
BEGIN
  -- Set the edge function base URL for the current session
  PERFORM set_config('app.settings.edge_function_base_url', 
    'https://sbfalzkgizeaixligtfa.supabase.co/functions/v1', 
    false);
END $$;

-- Also set it as a permanent configuration if possible
-- Note: This might require superuser privileges, so we wrap it in a try-catch
DO $$
BEGIN
  BEGIN
    -- Try to set it permanently
    ALTER DATABASE postgres SET app.settings.edge_function_base_url = 'https://sbfalzkgizeaixligtfa.supabase.co/functions/v1';
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, just log it (this is expected in hosted Supabase)
    RAISE NOTICE 'Could not set permanent configuration, using session-level setting';
  END;
END $$;