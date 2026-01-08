-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert during signup" ON coaches;
DROP POLICY IF EXISTS "Allow users to read own data" ON coaches;
DROP POLICY IF EXISTS "Allow users to update own data" ON coaches;

-- Temporarily disable RLS
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- Create function to handle coach registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO coaches (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic coach creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Re-enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow users to read own data"
  ON coaches FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own data"
  ON coaches FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for system-level inserts
CREATE POLICY "Allow system to insert data"
  ON coaches FOR INSERT
  WITH CHECK (true);