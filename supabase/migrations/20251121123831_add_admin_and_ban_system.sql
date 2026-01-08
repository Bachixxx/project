/*
  # Add Admin and Ban System

  1. Changes
    - Add `is_admin` column to coaches table to identify admin users
    - Add `is_banned` column to coaches table
    - Add `is_banned` column to clients table
    - Add `banned_at` timestamp column to both tables
    - Add `banned_reason` text column to both tables
    - Add `banned_by` column to track which admin banned the user

  2. Security
    - Add RLS policies for admin access to ban/unban users
    - Only admins can view and modify ban status
*/

-- Add admin and ban columns to coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE coaches ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE coaches ADD COLUMN is_banned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE coaches ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'banned_reason'
  ) THEN
    ALTER TABLE coaches ADD COLUMN banned_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE coaches ADD COLUMN banned_by uuid REFERENCES coaches(id);
  END IF;
END $$;

-- Add ban columns to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_banned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_reason'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_by uuid REFERENCES coaches(id);
  END IF;
END $$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM coaches
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Update coaches RLS policies to allow admins to view all coaches
DROP POLICY IF EXISTS "Admins can view all coaches" ON coaches;
CREATE POLICY "Admins can view all coaches"
  ON coaches FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update coaches RLS policy to allow admins to update ban status
DROP POLICY IF EXISTS "Admins can update any coach" ON coaches;
CREATE POLICY "Admins can update any coach"
  ON coaches FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update clients RLS policies to allow admins to view all clients
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update clients RLS policy to allow admins to update ban status
DROP POLICY IF EXISTS "Admins can update any client" ON clients;
CREATE POLICY "Admins can update any client"
  ON clients FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());