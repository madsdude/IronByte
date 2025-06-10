/*
  # Add comments functionality to tickets

  1. New Tables
    - `ticket_comments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references tickets)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on ticket_comments table
    - Add policies for:
      - Authenticated users can read all comments
      - Users can create comments
      - Users can update their own comments
*/

CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Policy: Authenticated users can read all comments
CREATE POLICY "Users can read all comments"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create comments
CREATE POLICY "Users can create comments"
  ON ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON ticket_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);