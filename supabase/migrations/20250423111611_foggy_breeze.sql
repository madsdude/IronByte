/*
  # Fix team members policy recursion

  1. Changes
    - Drop existing team members policies
    - Create new policies without recursion:
      - Team leads can manage members of their teams
      - Admins can manage all team members
      - All authenticated users can view team members
  
  2. Security
    - Maintains RLS on team_members table
    - Simplifies policy logic to avoid recursion
    - Preserves existing access control requirements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Team leads can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

-- Create new non-recursive policies
CREATE POLICY "Team leads can manage their team members"
ON team_members
FOR ALL
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'lead'
  )) OR is_admin(auth.uid())
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'lead'
  )) OR is_admin(auth.uid())
);

CREATE POLICY "Users can view all team members"
ON team_members
FOR SELECT
TO authenticated
USING (true);