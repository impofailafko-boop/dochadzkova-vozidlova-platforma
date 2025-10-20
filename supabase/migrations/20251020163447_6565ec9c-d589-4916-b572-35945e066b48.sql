-- 1. Vytvoriť enum pre status projektu
CREATE TYPE project_status AS ENUM ('planned', 'active', 'completed');

-- 2. Pridať stĺpec status do projects
ALTER TABLE projects 
ADD COLUMN status project_status DEFAULT 'planned';

-- 3. Migrovať existujúce dáta
UPDATE projects 
SET status = CASE 
  WHEN is_active = true THEN 'active'::project_status
  ELSE 'planned'::project_status
END;

-- 4. Pridať current_project_id do profiles (nullable najprv)
ALTER TABLE profiles 
ADD COLUMN current_project_id uuid REFERENCES projects(id);

-- 5. Aktualizovať RLS policy pre projekty (employees vidia len active)
DROP POLICY IF EXISTS "Employees can view active projects" ON projects;
CREATE POLICY "Employees can view active projects" 
ON projects 
FOR SELECT 
USING (status = 'active'::project_status);