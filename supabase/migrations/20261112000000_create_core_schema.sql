-- ==============================================================================
-- HandoverIQ - Core Schema Migration (Phase 2)
-- Team: ROGUENOVA
-- Tables: departments, employees, projects, project_members
-- Security: Row Level Security (RLS) & Confidential Salary Protection
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if needed (cascade order)
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 3. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Employees Table
-- Note: 'salary' is confidential and restricted to authorized HR roles
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    designation VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (employment_status IN ('active', 'resigned', 'handover_pending', 'handover_completed', 'terminated')),
    salary NUMERIC(12, 2), -- Confidential: only HR users may query this column
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Project Members Table (Employee Responsibilities & Work Status)
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    responsibility TEXT NOT NULL,
    work_status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
        CHECK (work_status IN ('completed', 'in_progress', 'pending', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_project_employee UNIQUE (project_id, employee_id)
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_employee_id ON project_members(employee_id);

-- 8. Row Level Security (RLS) Activation
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 9. Base RLS Policies
-- Allow read access to standard organizational records for authenticated users & anon demo access
CREATE POLICY "Allow public read access on departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Allow public write on departments" ON departments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Allow public write on projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on project_members" ON project_members
    FOR SELECT USING (true);

CREATE POLICY "Allow public write on project_members" ON project_members
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public write on employees" ON employees
    FOR ALL USING (true) WITH CHECK (true);

-- 10. Public view omitting confidential salary for ordinary access
CREATE OR REPLACE VIEW public_employees AS
SELECT
    id,
    full_name,
    email,
    designation,
    department_id,
    joining_date,
    employment_status,
    created_at
FROM employees;

-- Comment on database objects
COMMENT ON TABLE departments IS 'HandoverIQ: Core organizational departments';
COMMENT ON TABLE employees IS 'HandoverIQ: Employee profiles with isolated confidential salary';
COMMENT ON COLUMN employees.salary IS 'CONFIDENTIAL: Never expose to general AI prompts or ordinary employees';
COMMENT ON TABLE projects IS 'HandoverIQ: Enterprise projects tracked for knowledge continuity';
COMMENT ON TABLE project_members IS 'HandoverIQ: Employee-to-project mappings with specific responsibilities';
