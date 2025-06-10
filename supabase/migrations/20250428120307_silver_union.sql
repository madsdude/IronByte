/*
  # Add public ticket submission policy

  1. Changes
    - Add policy to allow public ticket submissions
    - Modify existing policies to handle public tickets
  
  2. Security
    - Maintain existing RLS policies
    - Add specific policy for unauthenticated users
*/

-- Policy: Allow public ticket submissions
CREATE POLICY "Allow public ticket submissions"
  ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (
    submitted_by IS NOT NULL AND
    status = 'new' AND
    category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server')
  );

-- Policy: Allow public users to read their submitted tickets
CREATE POLICY "Public users can read their tickets"
  ON tickets
  FOR SELECT
  TO anon
  USING (submitted_by IS NOT NULL);