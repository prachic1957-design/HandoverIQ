-- ===============================================================================
-- HandoverIQ - Handover Package Schema Migration (Phase 5)
-- Team: ROGUENOVA
-- ===============================================================================

-- Enable UUID extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Hand‑over Packages table
CREATE TABLE IF NOT EXISTS handover_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES knowledge_analyses(id) ON DELETE CASCADE,
    departing_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','approved','assigned','in_progress','completed','rejected')),
    package_summary TEXT,
    package_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Status history (audit trail)
CREATE TABLE IF NOT EXISTS handover_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES handover_packages(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Replacement assignment (one‑to‑one optional)
CREATE TABLE IF NOT EXISTS package_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES handover_packages(id) ON DELETE CASCADE,
    replacement_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (package_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_handover_packages_proj ON handover_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_handover_packages_emp ON handover_packages(departing_employee_id);
CREATE INDEX IF NOT EXISTS idx_handover_status_hist_pkg ON handover_status_history(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_assignments_pkg ON package_assignments(package_id);

-- Row Level Security (demo only)
ALTER TABLE handover_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_assignments ENABLE ROW LEVEL SECURITY;

-- Demo policies – replace with production policies later
CREATE POLICY "Allow read access on handover_packages" ON handover_packages FOR SELECT USING (true);
CREATE POLICY "Allow write access on handover_packages" ON handover_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access on handover_status_history" ON handover_status_history FOR SELECT USING (true);
CREATE POLICY "Allow write access on handover_status_history" ON handover_status_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access on package_assignments" ON package_assignments FOR SELECT USING (true);
CREATE POLICY "Allow write access on package_assignments" ON package_assignments FOR ALL USING (true) WITH CHECK (true);

-- Documentation
COMMENT ON TABLE handover_packages IS 'HandoverIQ: Manager‑reviewed handover package linking AI analysis to replacement workflow';
COMMENT ON TABLE handover_status_history IS 'HandoverIQ: Audit trail of handover package status changes';
COMMENT ON TABLE package_assignments IS 'HandoverIQ: Assignment of replacement employee to a handover package';

