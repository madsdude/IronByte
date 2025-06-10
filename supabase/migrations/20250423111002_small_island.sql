/*
  # Add server category to tickets table

  1. Changes
    - Add 'server' to the category enum check constraint
  
  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  ALTER TABLE tickets 
    DROP CONSTRAINT IF EXISTS tickets_category_check;
    
  ALTER TABLE tickets
    ADD CONSTRAINT tickets_category_check 
    CHECK (category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server'));
END $$;