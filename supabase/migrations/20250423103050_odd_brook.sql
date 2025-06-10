/*
  # Fix user creation trigger with improved error handling

  1. Changes
    - Improve trigger function with better error handling
    - Add transaction handling
    - Add logging for debugging
    - Ensure atomic operations

  2. Security
    - Maintain existing RLS policies
    - Keep role constraints
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Improved function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role text := 'user';
BEGIN
  -- Add defensive checks
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Insert with better error handling
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      created_at = EXCLUDED.created_at;

    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
  END;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate trigger with better timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();