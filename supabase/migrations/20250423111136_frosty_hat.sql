/*
  # Add teams and ticket assignments

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `created_at` (timestamptz)
    
    - `team_members`
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references auth.users)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add team_id to tickets table
    - Add policies for team management
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server')),
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid REFERENCES teams ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('member', 'lead')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Add team_id to tickets
ALTER TABLE tickets
ADD COLUMN team_id uuid REFERENCES teams;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Users can view all teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policies for team members
CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leads can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'lead'
      AND team_id = team_members.team_id
    )
    OR
    is_admin(auth.uid())
  );

-- Function to check if user is in team
CREATE OR REPLACE FUNCTION is_team_member(user_id uuid, team_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = $1 AND team_id = $2
  );
END;
$$ language 'plpgsql';

-- Update ticket policies for team assignment
CREATE POLICY "Team members can update assigned tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    is_team_member(auth.uid(), team_id)
    OR
    auth.uid() = submitted_by
  )
  WITH CHECK (
    is_team_member(auth.uid(), team_id)
    OR
    auth.uid() = submitted_by
  );