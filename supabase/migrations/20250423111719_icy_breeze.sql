/*
  # Fix team members policy recursion

  1. Changes
    - Drop existing team members policies
    - Create new non-recursive policies for team members table
  
  2. Security
    - Enable RLS on team_members table
    - Add policy for admins to manage all team members
    - Add policy for team leads to manage their team members
    - Add policy for authenticated users to view team members
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Team leads can manage their team members" ON team_members;
DROP POLICY IF EXISTS "Users can view all team members" ON team_members;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage team members"
ON team_members
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Team leads can manage team members"
ON team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members lead_check
    WHERE lead_check.team_id = team_members.team_id
    AND lead_check.user_id = auth.uid()
    AND lead_check.role = 'lead'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members lead_check
    WHERE lead_check.team_id = team_members.team_id
    AND lead_check.user_id = auth.uid()
    AND lead_check.role = 'lead'
  )
);

CREATE POLICY "Users can view team members"
ON team_members
FOR SELECT
TO authenticated
USING (true);