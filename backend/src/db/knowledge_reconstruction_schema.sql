-- ==============================================================================
-- HandoverIQ - Knowledge Reconstruction Schema Migration (Phase 4)
-- Team: ROGUENOVA
-- Tables: knowledge_analyses, knowledge_findings
-- Objective: Persistent storage of Gemini AI evidence-linked reconstructions
-- ==============================================================================

-- 1. Knowledge Analyses Table
CREATE TABLE IF NOT EXISTS knowledge_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('in_progress', 'completed', 'failed')),
    model_name VARCHAR(100) NOT NULL,
    analysis_summary TEXT,
    structured_result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Knowledge Findings Table (Granular Reviewable Findings)
CREATE TABLE IF NOT EXISTS knowledge_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES knowledge_analyses(id) ON DELETE CASCADE,
    finding_type VARCHAR(50) NOT NULL
        CHECK (finding_type IN ('work_history', 'milestone', 'pending_task', 'risk_blocker', 'knowledge_gap', 'replacement_brief')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50), -- e.g. 'completed', 'in_progress', 'pending', 'uncertain', 'low', 'medium', 'high'
    confidence VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (confidence IN ('high', 'medium', 'low')),
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_status VARCHAR(50) NOT NULL DEFAULT 'needs_review'
        CHECK (review_status IN ('needs_review', 'verified', 'rejected')),
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_analyses_project ON knowledge_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_analyses_employee ON knowledge_analyses(employee_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_findings_analysis ON knowledge_findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_findings_type ON knowledge_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_findings_review ON knowledge_findings(review_status);

-- 4. Row Level Security Activation
ALTER TABLE knowledge_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_findings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow read access on knowledge_analyses" ON knowledge_analyses
    FOR SELECT USING (true);

CREATE POLICY "Allow write access on knowledge_analyses" ON knowledge_analyses
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access on knowledge_findings" ON knowledge_findings
    FOR SELECT USING (true);

CREATE POLICY "Allow write access on knowledge_findings" ON knowledge_findings
    FOR ALL USING (true) WITH CHECK (true);

-- Documentation Comments
COMMENT ON TABLE knowledge_analyses IS 'HandoverIQ: Structured Gemini AI knowledge reconstruction sessions grounded in document evidence';
COMMENT ON TABLE knowledge_findings IS 'HandoverIQ: Evidence-backed individual findings subject to human manager verification';
