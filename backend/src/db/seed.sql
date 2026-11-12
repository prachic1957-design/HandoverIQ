-- ==============================================================================
-- HandoverIQ - Idempotent Synthetic Demo Data Seed (Phase 2)
-- Team: ROGUENOVA
-- Data: 3 Departments, 5 Employees, 2 Projects, Project Assignments
-- ==============================================================================

-- 1. Insert 3 Core Departments
INSERT INTO departments (id, name, description)
VALUES 
    ('d1111111-1111-1111-1111-111111111111', 'Information Technology', 'Enterprise cloud infrastructure, cybersecurity, and internal platforms.'),
    ('d2222222-2222-2222-2222-222222222222', 'Human Resources', 'Talent acquisition, employee onboarding, culture, and organizational governance.'),
    ('d3333333-3333-3333-3333-333333333333', 'Finance', 'Financial forecasting, statutory compliance, budget allocations, and accounting.')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert 5 Employees across Departments
-- (Salary values provided for HR access testing; isolated from ordinary views)
INSERT INTO employees (id, full_name, email, designation, department_id, joining_date, employment_status, salary)
VALUES 
    (
        'e1111111-1111-1111-1111-111111111111', 
        'Sarah Jenkins', 
        'sarah.jenkins@handoveriq.internal', 
        'Lead Cloud Architect', 
        'd1111111-1111-1111-1111-111111111111', 
        '2022-03-15', 
        'handover_pending', 
        145000.00
    ),
    (
        'e2222222-2222-2222-2222-222222222222', 
        'Alex Chen', 
        'alex.chen@handoveriq.internal', 
        'Senior DevOps Engineer', 
        'd1111111-1111-1111-1111-111111111111', 
        '2023-01-10', 
        'active', 
        120000.00
    ),
    (
        'e3333333-3333-3333-3333-333333333333', 
        'Rachel Green', 
        'rachel.green@handoveriq.internal', 
        'People Operations Lead', 
        'd2222222-2222-2222-2222-222222222222', 
        '2021-08-01', 
        'active', 
        110000.00
    ),
    (
        'e4444444-4444-4444-4444-444444444444', 
        'David Miller', 
        'david.miller@handoveriq.internal', 
        'Senior Financial Analyst', 
        'd3333333-3333-3333-3333-333333333333', 
        '2022-11-20', 
        'handover_pending', 
        118000.00
    ),
    (
        'e5555555-5555-5555-5555-555555555555', 
        'Priya Sharma', 
        'priya.sharma@handoveriq.internal', 
        'Finance Automation Specialist', 
        'd3333333-3333-3333-3333-333333333333', 
        '2023-06-05', 
        'active', 
        98000.00
    )
ON CONFLICT (email) DO NOTHING;

-- 3. Insert 2 Enterprise Projects
INSERT INTO projects (id, name, description, status, start_date, end_date)
VALUES 
    (
        'p1111111-1111-1111-1111-111111111111', 
        'Core Infrastructure Migration', 
        'Migration of legacy monolithic services to Kubernetes cluster with automated zero-downtime deployment pipelines.', 
        'in_progress', 
        '2026-01-15', 
        '2026-06-30'
    ),
    (
        'p2222222-2222-2222-2222-222222222222', 
        'Q4 Budget Automation', 
        'Implementation of automated reconciliation and multi-currency reporting pipelines for enterprise finance.', 
        'in_progress', 
        '2026-02-01', 
        '2026-05-15'
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Assign Project Members, Responsibilities and Work Status
INSERT INTO project_members (id, project_id, employee_id, responsibility, work_status)
VALUES 
    -- Sarah Jenkins on Core Infrastructure Migration
    (
        'm1111111-1111-1111-1111-111111111111',
        'p1111111-1111-1111-1111-111111111111',
        'e1111111-1111-1111-1111-111111111111',
        'Lead architect for VPC peering, Kubernetes cluster provisioning, and security compliance policies.',
        'completed'
    ),
    -- Alex Chen on Core Infrastructure Migration
    (
        'm2222222-2222-2222-2222-222222222222',
        'p1111111-1111-1111-1111-111111111111',
        'e2222222-2222-2222-2222-222222222222',
        'Implementation of GitHub Actions CI/CD pipelines and Helm chart deployment configurations.',
        'in_progress'
    ),
    -- David Miller on Q4 Budget Automation
    (
        'm3333333-3333-3333-3333-333333333333',
        'p2222222-2222-2222-2222-222222222222',
        'e4444444-4444-4444-4444-444444444444',
        'Financial logic validation, currency fluctuation modeling, and variance report generation.',
        'in_progress'
    ),
    -- Priya Sharma on Q4 Budget Automation
    (
        'm4444444-4444-4444-4444-444444444444',
        'p2222222-2222-2222-2222-222222222222',
        'e5555555-5555-5555-5555-555555555555',
        'ETL script pipeline to ingest raw bank CSV statements and reconcile general ledger entries.',
        'completed'
    )
ON CONFLICT (project_id, employee_id) DO NOTHING;
