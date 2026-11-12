/**
 * HandoverIQ Phase 3 Knowledge Ingestion & Document Processing Automated Test Suite
 * Team: ROGUENOVA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:5000/api';
const testFilesDir = path.resolve(__dirname, 'test_files');

async function runPhase3Tests() {
  console.log('========================================================');
  console.log('--- STARTING PHASE 3 AUTOMATED TEST SUITE ---');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 0. Fetch an existing project and employee for association
    const projRes = await fetch(`${API_BASE}/projects`);
    const projData = await projRes.json();
    assert(projRes.ok && projData.data.length > 0, 'Fetched active projects from API');
    const project = projData.data[0];
    const projectId = project.id;

    const empRes = await fetch(`${API_BASE}/employees`);
    const empData = await empRes.json();
    assert(empRes.ok && empData.data.length > 0, 'Fetched active employees from API');
    const employee = empData.data[0];
    const employeeId = employee.id;

    console.log(`\nAssociating test uploads with Project: "${project.name}" & Employee: "${employee.full_name}"`);

    // Clean up any lingering test files from previous runs
    const existingRes = await fetch(`${API_BASE}/documents`);
    const existingData = await existingRes.json();
    if (existingData.success && existingData.data) {
      for (const d of existingData.data) {
        if (d.original_filename.startsWith('test_')) {
          await fetch(`${API_BASE}/documents/${d.id}`, { method: 'DELETE' });
        }
      }
    }

    // Helper: Upload file using native FormData
    async function uploadTestFile(filename, customProjectId = projectId, customEmployeeId = employeeId) {
      const filePath = path.join(testFilesDir, filename);
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);

      const form = new FormData();
      form.append('file', blob, filename);
      if (customProjectId) form.append('project_id', customProjectId);
      if (customEmployeeId) form.append('employee_id', customEmployeeId);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      return { status: res.status, data };
    }

    // 1. Test TXT Document Upload & Extraction
    console.log('\n[TEST 1] Ingesting TXT Document...');
    const txtUpload = await uploadTestFile('test_system_notes.txt');
    assert(txtUpload.status === 201 && txtUpload.data.success, 'POST /api/documents/upload (TXT) succeeded with 201');
    assert(txtUpload.data.data.processing_status === 'completed', 'TXT document processing status is "completed"');
    assert(txtUpload.data.data.chunk_count >= 1, 'TXT document parsed into at least 1 traceable chunk');
    assert(txtUpload.data.data.extracted_text.includes('IAM roles for service accounts'), 'Extracted text content verified');
    const txtDocId = txtUpload.data.data.id;

    // 2. Test CSV Document Upload & Row Context Extraction
    console.log('\n[TEST 2] Ingesting CSV Document...');
    const csvUpload = await uploadTestFile('test_budget_ledger.csv');
    assert(csvUpload.status === 201 && csvUpload.data.success, 'POST /api/documents/upload (CSV) succeeded with 201');
    assert(csvUpload.data.data.processing_status === 'completed', 'CSV processing status is "completed"');
    assert(csvUpload.data.data.chunk_count >= 1, 'CSV parsed into traceable row chunks');
    assert(csvUpload.data.data.extracted_text.includes('GL-1001'), 'CSV schema and column-header structure preserved');
    const csvDocId = csvUpload.data.data.id;

    // 3. Test PDF Document Upload & Extraction
    console.log('\n[TEST 3] Ingesting PDF Document...');
    const pdfUpload = await uploadTestFile('test_architecture.pdf');
    assert(pdfUpload.status === 201 && pdfUpload.data.success, 'POST /api/documents/upload (PDF) succeeded with 201');
    assert(pdfUpload.data.data.processing_status === 'completed', 'PDF processing status is "completed"');
    assert(pdfUpload.data.data.extracted_text.includes('VPC and EKS Deployment'), 'PDF selectable text extracted successfully');
    const pdfDocId = pdfUpload.data.data.id;

    // 4. Test DOCX Document Upload & Extraction
    console.log('\n[TEST 4] Ingesting DOCX (Word) Document...');
    const docxUpload = await uploadTestFile('test_runbook.docx');
    assert(docxUpload.status === 201 && docxUpload.data.success, 'POST /api/documents/upload (DOCX) succeeded with 201');
    assert(docxUpload.data.data.processing_status === 'completed', 'DOCX processing status is "completed"');
    assert(docxUpload.data.data.extracted_text.includes('PagerDuty Schedules'), 'DOCX runbook text extracted successfully');
    const docxDocId = docxUpload.data.data.id;

    // 5. Test Scanned / Empty PDF (needs_ocr detection)
    console.log('\n[TEST 5] Detecting Scanned PDF (insufficient selectable text)...');
    const ocrUpload = await uploadTestFile('test_scanned_empty.pdf');
    assert(ocrUpload.status === 201 && ocrUpload.data.success, 'POST /api/documents/upload accepted scanned PDF');
    assert(ocrUpload.data.data.processing_status === 'needs_ocr', 'Document correctly flagged with status="needs_ocr"');
    assert(ocrUpload.data.data.processing_error?.includes('OCR'), 'Reasonable error message saved for OCR review');
    const ocrDocId = ocrUpload.data.data.id;

    // 6. Test Duplicate Upload Rejection
    console.log('\n[TEST 6] Testing Duplicate Document Rejection (SHA-256 hash match)...');
    const dupUpload = await uploadTestFile('test_system_notes.txt');
    assert(dupUpload.status === 409, 'Duplicate document correctly rejected with 409 Conflict');

    // 7. Test Unsupported File Type Rejection
    console.log('\n[TEST 7] Testing Unsupported File Type Rejection...');
    const badUpload = await uploadTestFile('test_unsupported.exe');
    assert(badUpload.status === 400, 'Unsupported file (.exe) rejected with 400 Bad Request');

    // 8. Test Missing & Invalid Project Validation
    console.log('\n[TEST 8] Testing Missing / Invalid Project ID...');
    const noProjUpload = await uploadTestFile('test_system_notes.txt', '');
    assert(noProjUpload.status === 400, 'Upload without project_id rejected with 400 Bad Request');

    const fakeProjUpload = await uploadTestFile('test_system_notes.txt', 'p9999999-9999-9999-9999-999999999999');
    assert(fakeProjUpload.status === 400, 'Upload with nonexistent project_id rejected with 400 Bad Request');

    // 9. Test Querying Documents List & Filter by Project
    console.log('\n[TEST 9] Querying Documents List & Filters...');
    const listRes = await fetch(`${API_BASE}/documents?project_id=${projectId}`);
    const listData = await listRes.json();
    assert(listRes.status === 200 && listData.count >= 4, 'GET /api/documents?project_id=... returns project documents');

    const projDocRes = await fetch(`${API_BASE}/projects/${projectId}/documents`);
    const projDocData = await projDocRes.json();
    assert(projDocRes.status === 200 && projDocData.count >= 4, 'GET /api/projects/:id/documents returns project documents');

    // 10. Test Chunks Retrieval & Source Traceability
    console.log('\n[TEST 10] Verifying Document Chunks & Source Coordinates...');
    const chunkRes = await fetch(`${API_BASE}/documents/${pdfDocId}/chunks`);
    const chunkData = await chunkRes.json();
    assert(chunkRes.status === 200 && chunkData.data.length > 0, 'GET /api/documents/:id/chunks retrieved chunks array');
    const firstChunk = chunkData.data[0];
    assert(firstChunk.section_reference !== undefined && firstChunk.section_reference !== null, 'Chunk maintains traceable section/page reference');
    assert(firstChunk.document_id === pdfDocId, 'Chunk is linked to parent document_id');

    // 11. Test Secure Document Download
    console.log('\n[TEST 11] Verifying Secure Document Download...');
    const downloadRes = await fetch(`${API_BASE}/documents/${txtDocId}/download`);
    assert(downloadRes.status === 200, 'GET /api/documents/:id/download returned 200');
    const downloadedText = await downloadRes.text();
    assert(downloadedText.includes('HandoverIQ Technical System Notes'), 'Downloaded file content matches original upload');

    // 12. Test Document Deletion
    console.log('\n[TEST 12] Deleting Test Documents & Cascaded Chunks...');
    const deleteIds = [txtDocId, csvDocId, pdfDocId, docxDocId, ocrDocId];
    for (const id of deleteIds) {
      const delRes = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      assert(delRes.status === 200, `DELETE /api/documents/${id} removed document`);

      // Verify chunks were also removed (cascade)
      const chkCheck = await fetch(`${API_BASE}/documents/${id}/chunks`);
      const chkCheckData = await chkCheck.json();
      assert(chkCheckData.count === 0, 'Cascaded document chunks verified cleaned up');
    }

    console.log(`\n========================================================`);
    console.log(`PHASE 3 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
    console.log(`========================================================`);

  } catch (err) {
    console.error('Fatal Phase 3 test error:', err);
  }
}

runPhase3Tests();
