// Test Suite: Evidence Coverage Metrics (Priority 1, Step 3)
import { calculateEvidenceCoverage } from './src/services/geminiService.js';

function runCoverageTests() {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error('❌ FAIL:', msg);
      throw new Error('Assertion failed: ' + msg);
    }
    console.log('✅ PASS:', msg);
  };

  console.log('========================================================');
  console.log('🧪 Testing calculateEvidenceCoverage Mathematical Engine');
  console.log('========================================================');

  // Test 1: 5 chunks, 3 uniquely cited -> 60% chunk coverage
  // 5 findings, 5 grounded -> 100% finding grounding
  const chunks5 = [
    { id: 'c1', document_id: 'docA' },
    { id: 'c2', document_id: 'docA' },
    { id: 'c3', document_id: 'docB' },
    { id: 'c4', document_id: 'docB' },
    { id: 'c5', document_id: 'docC' }
  ];

  const structured5 = {
    employee_work_history: [
      { work_item: 'Item 1', evidence_references: [{ chunk_id: 'c1', document_id: 'docA' }] },
      { work_item: 'Item 2', evidence_references: [{ chunk_id: 'c2', document_id: 'docA' }] }
    ],
    milestones: [
      { title: 'Milestone 1', evidence_references: [{ chunk_id: 'c3', document_id: 'docB' }] }
    ],
    pending_tasks: [
      { description: 'Task 1', evidence_references: [{ chunk_id: 'c1', document_id: 'docA' }] }
    ],
    risks_and_blockers: [
      { description: 'Risk 1', evidence_references: [{ chunk_id: 'c2', document_id: 'docA' }] }
    ],
    knowledge_gaps: []
  };

  const cov1 = calculateEvidenceCoverage({ allChunks: chunks5, structuredResult: structured5, totalDocumentsCount: 3 });
  console.log('Test 1 Result:', cov1);

  assert(cov1.total_chunks === 5, 'Total chunks is 5');
  assert(cov1.cited_chunks === 3, 'Cited chunks is 3 uniquely cited (c1, c2, c3)');
  assert(cov1.coverage_percentage === 60, 'Coverage percentage is 60%');
  assert(cov1.total_findings === 5, 'Total findings is 5');
  assert(cov1.grounded_findings === 5, 'Grounded findings is 5');
  assert(cov1.finding_grounding_percentage === 100, 'Finding grounding percentage is 100%');
  assert(cov1.ungrounded_findings_count === 0, 'Ungrounded findings count is 0');
  assert(cov1.total_documents === 3, 'Total documents is 3');
  assert(cov1.documents_analyzed_count === 2, 'Documents analyzed count is 2 (docA, docB)');

  // Test 2: Duplicate citations count only once
  const structuredDup = {
    employee_work_history: [
      { work_item: 'Item 1', evidence_references: [{ chunk_id: 'c1' }, { chunk_id: 'c1' }] },
      { work_item: 'Item 2', evidence_references: [{ chunk_id: 'c1' }] },
      { work_item: 'Item 3', evidence_references: [{ chunk_id: 'c1' }] }
    ]
  };
  const covDup = calculateEvidenceCoverage({ allChunks: chunks5, structuredResult: structuredDup });
  assert(covDup.cited_chunks === 1, 'Duplicate citations across items deduplicated to 1');
  assert(covDup.coverage_percentage === 20, '1/5 chunks cited = 20% coverage');

  // Test 3: Invalid / hallucinated chunk IDs do NOT count
  const structuredFake = {
    employee_work_history: [
      { work_item: 'Fake Item', evidence_references: [{ chunk_id: 'hallucinated-chunk-999' }] },
      { work_item: 'Valid Item', evidence_references: [{ chunk_id: 'c4' }, { chunk_id: 'fake-chunk-888' }] }
    ]
  };
  const covFake = calculateEvidenceCoverage({ allChunks: chunks5, structuredResult: structuredFake });
  assert(covFake.cited_chunks === 1, 'Fake chunk IDs ignored, only c4 counted');
  assert(covFake.grounded_findings === 1, 'Only Valid Item is grounded');
  assert(covFake.ungrounded_findings_count === 1, 'Fake Item counted as ungrounded');
  assert(covFake.finding_grounding_percentage === 50, '1/2 findings grounded = 50%');

  // Test 4: Zero chunks safely handled (no NaN, no Infinity)
  const covZeroChunks = calculateEvidenceCoverage({ allChunks: [], structuredResult: structured5 });
  assert(covZeroChunks.total_chunks === 0, 'Zero chunks total is 0');
  assert(covZeroChunks.cited_chunks === 0, 'Zero chunks cited is 0');
  assert(covZeroChunks.coverage_percentage === 0, 'Zero chunks coverage percentage is 0 (not NaN)');
  assert(!isNaN(covZeroChunks.coverage_percentage), 'Coverage percentage is not NaN');

  // Test 5: Zero findings safely handled (no NaN, no Infinity)
  const covZeroFindings = calculateEvidenceCoverage({ allChunks: chunks5, structuredResult: {} });
  assert(covZeroFindings.total_findings === 0, 'Zero findings total is 0');
  assert(covZeroFindings.grounded_findings === 0, 'Zero findings grounded is 0');
  assert(covZeroFindings.finding_grounding_percentage === 0, 'Zero findings percentage is 0 (not NaN)');
  assert(!isNaN(covZeroFindings.finding_grounding_percentage), 'Finding grounding percentage is not NaN');
  assert(covZeroFindings.ungrounded_findings_count === 0, 'Zero findings ungrounded is 0');

  // Test 6: Multiple documents representation
  const chunksMultiDocs = [
    { id: 'ca1', document_id: 'doc-alpha' },
    { id: 'cb1', document_id: 'doc-beta' },
    { id: 'cc1', document_id: 'doc-gamma' },
    { id: 'cd1', document_id: 'doc-delta' }
  ];
  const structuredMulti = {
    employee_work_history: [
      { work_item: 'Alpha & Gamma Work', evidence_references: [{ chunk_id: 'ca1' }, { chunk_id: 'cc1' }] }
    ]
  };
  const covMulti = calculateEvidenceCoverage({ allChunks: chunksMultiDocs, structuredResult: structuredMulti });
  assert(covMulti.total_documents === 4, 'Detected 4 distinct project documents');
  assert(covMulti.documents_analyzed_count === 2, '2 distinct documents analyzed (alpha, gamma)');

  console.log('\n========================================================');
  console.log('🎉 ALL EVIDENCE COVERAGE ENGINE UNIT TESTS PASSED!');
  console.log('========================================================');
}

runCoverageTests();

