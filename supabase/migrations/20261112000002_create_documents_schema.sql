-- ==============================================================================
-- HandoverIQ - Knowledge Ingestion & Document Schema Migration (Phase 3)
-- Team: ROGUENOVA
-- Tables: documents, document_chunks
-- Storage: handover-documents bucket (Private)
-- ==============================================================================

-- 1. Create Private Supabase Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('handover-documents', 'handover-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage Bucket Security Policies (Restrict direct public access)
CREATE POLICY "Allow authenticated reads on handover-documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'handover-documents');

CREATE POLICY "Allow authenticated uploads on handover-documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'handover-documents');

CREATE POLICY "Allow authenticated deletes on handover-documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'handover-documents');

-- 3. Documents Metadata Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 for integrity and duplicate prevention
    extracted_text TEXT,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'uploaded'
        CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed', 'needs_ocr')),
    processing_error TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Document Chunks Table (Preserving Page/Section Source Coordinates)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    extracted_content TEXT NOT NULL,
    page_number INT, -- Nullable where exact page is not applicable (e.g. TXT, CSV)
    section_reference VARCHAR(255), -- E.g. 'Page 3', 'Row 14', 'Section 2.1'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_doc_chunk_index UNIQUE (document_id, chunk_index)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page ON document_chunks(page_number);

-- 6. Row Level Security (RLS) Activation
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Allow read access on documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Allow write access on documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access on document_chunks" ON document_chunks
    FOR SELECT USING (true);

CREATE POLICY "Allow write access on document_chunks" ON document_chunks
    FOR ALL USING (true) WITH CHECK (true);

-- Documentation Comments
COMMENT ON TABLE documents IS 'HandoverIQ: Ingested employee and project source documents with extraction lifecycle metadata';
COMMENT ON COLUMN documents.storage_path IS 'Encrypted object key within private handover-documents bucket or local secured store';
COMMENT ON TABLE document_chunks IS 'HandoverIQ: Traceable text segments with strict page/row/section coordinate mapping for Phase 4 AI analysis';

