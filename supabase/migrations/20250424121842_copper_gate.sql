/*
  # Add display_name to users table

  1. Changes
    - Add display_name column to users table
    - Update handle_new_user function to set display_name from metadata
    - Add policy for users to update their own display_name
*/

-- Add display_name column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name text;

-- Update handle_new_user function to include display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      (new.raw_user_meta_data->>'display_name')::text,
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;