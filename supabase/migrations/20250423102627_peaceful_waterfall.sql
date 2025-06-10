/*
  # Promote user to admin role

  1. Changes
    - Updates the specified user's role to admin
  
  2. Security
    - Must be run by a Supabase admin/owner
*/

UPDATE user_roles
SET role = 'admin'
WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- Replace with actual UUID