/*
  # Fix ticket_comments and users relationship

  1. Changes
    - Add foreign key constraint between ticket_comments.user_id and users.id
    - Update existing policies to use the new relationship
  
  2. Security
    - Maintain existing RLS policies
    - Keep existing constraints
*/

-- Add foreign key constraint
ALTER TABLE ticket_comments
DROP CONSTRAINT IF EXISTS ticket_comments_user_id_fkey,
ADD CONSTRAINT ticket_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;