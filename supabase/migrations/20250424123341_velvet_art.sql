/*
  # Copy existing users to users table

  1. Changes
    - Insert users only if they exist in auth.users
    - Set display names for each user
  
  2. Security
    - Maintain existing RLS policies
    - Keep existing constraints
    - Ensure foreign key integrity
*/

DO $$ 
BEGIN
  -- Insert users only if they exist in auth.users
  INSERT INTO public.users (id, email, display_name)
  SELECT 
    id,
    email,
    CASE 
      WHEN email = 'thom6a64@edu.mercantec.dk' THEN 'Thomas'
      WHEN email = 'masc0001@edu.mercantec.dk' THEN 'Mathias'
      WHEN email = 'mads534b@edu.mercantec.dk' THEN 'Mads'
    END as display_name
  FROM auth.users
  WHERE email IN (
    'thom6a64@edu.mercantec.dk',
    'masc0001@edu.mercantec.dk',
    'mads534b@edu.mercantec.dk'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    updated_at = now();
END $$;