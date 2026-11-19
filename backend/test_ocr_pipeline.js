// Test Suite: Optical Character Recognition (OCR) Pipeline (Priority 1, Step 4)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDocumentBuffer, performPdfOcr, parseOcrTextToChunks } from './src/services/textExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runOcrTests() {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error('❌ FAIL:', msg);
      throw new Error('Assertion failed: ' + msg);
    }
    console.log('✅ PASS:', msg);
  };

  console.log('========================================================');
  console.log('🧪 Testing OCR Pipeline & Scanned PDF Extraction');
  console.log('========================================================');

  // 1. Existing selectable-text PDF still works
  const selectablePdf = fs.readFileSync(path.join(__dirname, 'test_files/test_architecture.pdf'));
  const resSelectable = await processDocumentBuffer(selectablePdf, 'application/pdf', 'test_architecture.pdf');
  assert(resSelectable.status === 'completed', 'Selectable PDF status is completed');
  assert(resSelectable.is_ocr === false, 'Selectable PDF is_ocr is false');
  assert(resSelectable.chunks.length > 0, 'Selectable PDF produced chunks');
  assert(resSelectable.fullText.includes('VPC and EKS Deployment'), 'Selectable text extracted accurately');

  // 2. Scanned PDF with readable text produces chunks via OCR
  const scannedPdfBuffer = fs.readFileSync(path.join(__dirname, 'test_files/test_scanned_empty.pdf'));
  const readableOcrText = `HandoverIQ Scanned Legacy Runbook v1.0
Author: Legacy Operations Lead
Critical Service: Stateful Redis Cache Sentinel Cluster
The primary sentinel cluster monitors 3 master nodes and 6 read replicas across us-east-1a, us-east-1b, and us-east-1c.
Failover timeout is strictly configured to 5000 milliseconds with automatic quorum reconciliation.`;

  const resOcrReadable = await processDocumentBuffer(scannedPdfBuffer, 'application/pdf', 'test_scanned_with_ocr.pdf', {
    mockOcrText: readableOcrText
  });

  assert(resOcrReadable.status === 'completed', 'Scanned PDF with readable text status is completed');
  assert(resOcrReadable.is_ocr === true, 'Scanned PDF is marked is_ocr = true');
  assert(resOcrReadable.chunks.length > 0, 'Scanned PDF produced traceable chunks');
  assert(resOcrReadable.chunks[0].is_ocr === true, 'Chunk preserves is_ocr = true');
  assert(resOcrReadable.chunks[0].extracted_content.includes('Redis Cache Sentinel Cluster'), 'OCR text content preserved in chunk');

  // 3. Multi-page scanned PDF preserves page numbers
  const multiPageOcrText = `--- PAGE 1 ---
HandoverIQ Multi-Page Scanned Architecture Dossier
Page 1 covers AWS Transit Gateway topology and VPC peering configurations.
BGP Autonomous System Number (ASN) is set to 64512 with equal-cost multi-path routing enabled.

--- PAGE 2 ---
Page 2 details Disaster Recovery and Cross-Region Snapshot Automation.
Snapshots are replicated to us-west-2 every 60 minutes with KMS customer managed keys.
RPO is 1 hour, RTO is 15 minutes for stateful database failover.

--- PAGE 3 ---
Page 3 specifies Incident Escalation and PagerDuty Rotations.
Primary on-call escalation goes to Platform SRE team via escalation policy EP-9901.`;

  const resMultiPage = parseOcrTextToChunks(multiPageOcrText);
  assert(resMultiPage.status === 'completed', 'Multi-page OCR parsing status is completed');
  assert(resMultiPage.chunks.length >= 3, 'Multi-page OCR produced at least 3 chunks');
  
  const page1Chunks = resMultiPage.chunks.filter(c => c.page_number === 1);
  const page2Chunks = resMultiPage.chunks.filter(c => c.page_number === 2);
  const page3Chunks = resMultiPage.chunks.filter(c => c.page_number === 3);

  assert(page1Chunks.length > 0 && page1Chunks[0].section_reference.includes('Page 1'), 'Page 1 preserved with section reference');
  assert(page2Chunks.length > 0 && page2Chunks[0].section_reference.includes('Page 2'), 'Page 2 preserved with section reference');
  assert(page3Chunks.length > 0 && page3Chunks[0].section_reference.includes('Page 3'), 'Page 3 preserved with section reference');
  assert(page2Chunks[0].extracted_content.includes('Disaster Recovery'), 'Page 2 content matches second page');

  // 4. Unreadable / empty scanned PDF does NOT falsely become completed
  const resUnreadable = await processDocumentBuffer(scannedPdfBuffer, 'application/pdf', 'test_scanned_empty.pdf', {
    mockOcrText: 'NO_READABLE_TEXT'
  });
  assert(resUnreadable.status === 'needs_ocr', 'Unreadable scanned PDF status remains needs_ocr');
  assert(resUnreadable.chunks.length === 0, 'Unreadable scanned PDF produced 0 chunks');
  assert(resUnreadable.error?.includes('OCR'), 'Reasonable error message saved');

  // 4b. Short / insufficient text (< 25 chars) does NOT falsely become completed
  const resShort = await processDocumentBuffer(scannedPdfBuffer, 'application/pdf', 'test_short.pdf', {
    mockOcrText: 'Short text'
  });
  assert(resShort.status === 'needs_ocr', 'Short text (< 25 chars) remains needs_ocr');
  assert(resShort.chunks.length === 0, 'Short text produced 0 chunks');

  // 5. OCR API failure produces clear retryable error
  const resFailure = await processDocumentBuffer(scannedPdfBuffer, 'application/pdf', 'test_scanned_fail.pdf', {
    simulateOcrFailure: 'Network 503 Service Unavailable'
  });
  assert(resFailure.status === 'needs_ocr', 'Failed OCR status remains needs_ocr');
  assert(resFailure.chunks.length === 0, 'Failed OCR produced 0 chunks');
  assert(resFailure.error?.includes('Network 503'), 'Error message contains specific failure cause');

  // 6. Existing TXT, DOCX, and CSV extraction still work
  const txtBuffer = fs.readFileSync(path.join(__dirname, 'test_files/test_system_notes.txt'));
  const resTxt = await processDocumentBuffer(txtBuffer, 'text/plain', 'test_system_notes.txt');
  assert(resTxt.status === 'completed' && resTxt.chunks.length > 0, 'TXT extraction completed');

  const csvBuffer = fs.readFileSync(path.join(__dirname, 'test_files/test_budget_ledger.csv'));
  const resCsv = await processDocumentBuffer(csvBuffer, 'text/csv', 'test_budget_ledger.csv');
  assert(resCsv.status === 'completed' && resCsv.chunks.length > 0, 'CSV extraction completed');

  const docxBuffer = fs.readFileSync(path.join(__dirname, 'test_files/test_runbook.docx'));
  const resDocx = await processDocumentBuffer(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'test_runbook.docx');
  assert(resDocx.status === 'completed' && resDocx.chunks.length > 0, 'DOCX extraction completed');

  console.log('\n========================================================');
  console.log('🎉 ALL OCR PIPELINE UNIT & FUNCTIONAL TESTS PASSED!');
  console.log('========================================================');
}

runOcrTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

