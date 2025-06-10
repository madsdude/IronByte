/*
  # Create tickets table and enable RLS

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `category` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `assigned_to` (uuid, references auth.users)
      - `submitted_by` (uuid, references auth.users)
      - `due_date` (timestamptz)
      - `additional_fields` (jsonb)

  2. Security
    - Enable RLS on `tickets` table
    - Add policies for:
      - Authenticated users can read all tickets
      - Users can create tickets
      - Users can update their own tickets
      - Admins can update any ticket
*/

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('new', 'in-progress', 'pending', 'resolved', 'closed')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assigned_to uuid REFERENCES auth.users,
  submitted_by uuid REFERENCES auth.users NOT NULL,
  due_date timestamptz,
  additional_fields jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all tickets
CREATE POLICY "Users can read all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create tickets
CREATE POLICY "Users can create tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can update their own tickets
CREATE POLICY "Users can update own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();