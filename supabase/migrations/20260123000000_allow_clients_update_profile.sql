/*
  # Allow Clients to Update Own Profile
  
  1. Changes
    - Add RLS policy to allow clients to update their own data in the `clients` table.
    - This is necessary for the profile editing feature to work.
  
  2. Security
    - Policy ensures clients can ONLY update their own record (where auth_id matches their user ID).
*/

-- Create policy to allow clients to update their own profile
CREATE POLICY "Clients can update own profile"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());
