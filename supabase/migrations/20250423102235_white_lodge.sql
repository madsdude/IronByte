/*
  # Add admin role management

  1. Changes
    - Add policy for admin users to manage roles
    - Add function to check if a user is an admin
  
  2. Security
    - Only admins can update user roles
    - All users can view roles
*/

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND role = 'admin'
  );
END;
$$ language 'plpgsql';

-- Policy: Admin users can update roles
CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Admin users can insert roles
CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));