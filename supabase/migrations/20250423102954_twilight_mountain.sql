/*
  # Fix user creation trigger

  1. Changes
    - Improve trigger function to handle existing users
    - Add better error handling
    - Ensure role assignment works reliably

  2. Security
    - Maintain existing RLS policies
    - Keep role constraints
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with conflict handling
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = EXCLUDED.role
  WHERE user_roles.user_id = EXCLUDED.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();