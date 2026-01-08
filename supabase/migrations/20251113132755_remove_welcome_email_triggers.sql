/*
  # Remove problematic welcome email triggers
  
  This migration removes the send_welcome_email triggers and function that
  reference the non-existent app.settings.edge_function_base_url configuration.
  
  1. Changes
    - Drop the send_client_welcome_email trigger from clients table
    - Drop the send_coach_welcome_email trigger from coaches table
    - Drop the send_welcome_email() function
  
  2. Notes
    - Welcome emails can be sent directly from the application code instead
    - This fixes the "unrecognized configuration parameter" error when saving clients
*/

-- Drop the triggers
DROP TRIGGER IF EXISTS send_client_welcome_email ON clients;
DROP TRIGGER IF EXISTS send_coach_welcome_email ON coaches;

-- Drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS send_welcome_email() CASCADE;
