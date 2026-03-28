-- Remove the old invitation/registration-access system.
-- Coach code is now the only registration mechanism.

-- Drop RPCs
DROP FUNCTION IF EXISTS allow_client_registration(UUID);
DROP FUNCTION IF EXISTS request_invitation_resend(TEXT);

-- Drop the registration window column (no longer used)
ALTER TABLE clients DROP COLUMN IF EXISTS registration_access_until;
