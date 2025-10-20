-- SECURITY FIX: Add authentication requirement to vehicles and projects tables
-- Currently these tables are publicly readable without authentication

-- Drop existing employee policies for vehicles and projects
DROP POLICY IF EXISTS "Employees can view active vehicles" ON vehicles;
DROP POLICY IF EXISTS "Employees can view active projects" ON projects;

-- Create new policies with authentication requirement
CREATE POLICY "Authenticated employees can view active vehicles"
ON vehicles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true
);

CREATE POLICY "Authenticated employees can view active projects"
ON projects
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active'::project_status
);