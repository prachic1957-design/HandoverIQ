// Test Suite: Universal Citation & Confidence Sanitization (Priority 1, Step 2)
import { validateAndSanitizeFindings, resolveFindingQuality } from './src/services/geminiService.js';

function runTests() {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error('❌ FAIL:', msg);
      throw new Error('Assertion failed: ' + msg);
    }
    console.log('✅ PASS:', msg);
  };

  console.log('========================================================');
  console.log('--- 1. Testing resolveFindingQuality Helper ---');
  console.log('========================================================');

  // Zero citations -> low, unsupported
  assert(resolveFindingQuality('high', 0).confidence === 'low', 'zero citations demotes high to low');
  assert(resolveFindingQuality('high', 0).grounding_status === 'unsupported', 'zero citations gives unsupported status');
  assert(resolveFindingQuality('medium', 0).confidence === 'low', 'zero citations demotes medium to low');
  assert(resolveFindingQuality('low', 0).confidence === 'low', 'zero citations keeps low as low');
  assert(resolveFindingQuality(null, 0).confidence === 'low', 'zero citations with null confidence returns low');

  // Grounded with existing low confidence -> must remain low (never automatically upgraded!)
  const groundedLow = resolveFindingQuality('low', 1);
  assert(groundedLow.confidence === 'low', 'grounded finding with low confidence remains low');
  assert(groundedLow.grounding_status === 'grounded', 'grounded finding gets grounded status');

  // Grounded with high -> preserved
  const groundedHigh = resolveFindingQuality('high', 2);
  assert(groundedHigh.confidence === 'high', 'grounded finding preserves high confidence');
  assert(groundedHigh.grounding_status === 'grounded', 'grounded finding gets grounded status');

  // Grounded with medium -> preserved
  const groundedMedium = resolveFindingQuality('medium', 1);
  assert(groundedMedium.confidence === 'medium', 'grounded finding preserves medium confidence');

  console.log('\n========================================================');
  console.log('--- 2. Testing validateAndSanitizeFindings Across All Types ---');
  console.log('========================================================');

  const validChunks = new Map([
    ['chk-1', { id: 'chk-1', document_id: 'doc-1', original_filename: 'runbook.pdf', page_number: 1, section_reference: 'Sec 1', extracted_content: 'Content 1' }],
    ['chk-2', { id: 'chk-2', document_id: 'doc-1', original_filename: 'runbook.pdf', page_number: 2, section_reference: 'Sec 2', extracted_content: 'Content 2' }]
  ]);

  const rawTestInput = {
    summary: 'Testing universal sanitization',
    employee_work_history: [
      { work_item: 'WH Zero Citations', confidence: 'high', evidence_references: [] },
      { work_item: 'WH Fake Chunk', confidence: 'high', evidence_references: [{ chunk_id: 'fake-chunk-999' }] },
      { work_item: 'WH Mixed Citations', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'fake-chunk-999' }] },
      { work_item: 'WH Multiple Valid', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'chk-2' }] },
      { work_item: 'WH Existing Low', confidence: 'low', evidence_references: [{ chunk_id: 'chk-1' }] }
    ],
    milestones: [
      { title: 'Milestone Zero Citations', confidence: 'high', evidence_references: [] },
      { title: 'Milestone Fake Chunk', confidence: 'high', evidence_references: [{ chunk_id: 'fake-chunk-999' }] },
      { title: 'Milestone Mixed', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'fake-chunk-999' }] },
      { title: 'Milestone Multiple Valid', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'chk-2' }] },
      { title: 'Milestone Existing Low', confidence: 'low', evidence_references: [{ chunk_id: 'chk-1' }] }
    ],
    pending_tasks: [
      { description: 'Task Zero Citations', confidence: 'high', evidence_references: [] },
      { description: 'Task Fake Chunk', confidence: 'high', evidence_references: [{ chunk_id: 'fake-chunk-999' }] },
      { description: 'Task Mixed', confidence: 'medium', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'fake-chunk-999' }] },
      { description: 'Task Multiple Valid', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'chk-2' }] },
      { description: 'Task Existing Low', confidence: 'low', evidence_references: [{ chunk_id: 'chk-1' }] }
    ],
    risks_and_blockers: [
      { description: 'Risk Zero Citations', severity: 'high', confidence: 'high', evidence_references: [] },
      { description: 'Risk Fake Chunk', severity: 'high', confidence: 'high', evidence_references: [{ chunk_id: 'fake-chunk-999' }] },
      { description: 'Risk Mixed', severity: 'high', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'fake-chunk-999' }] },
      { description: 'Risk Multiple Valid', severity: 'high', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'chk-2' }] },
      { description: 'Risk Existing Low', severity: 'high', confidence: 'low', evidence_references: [{ chunk_id: 'chk-1' }] }
    ],
    knowledge_gaps: [
      { title: 'Gap Zero Citations', missing_information: 'Missing SLA', confidence: 'high', evidence_references: [] },
      { title: 'Gap Fake Chunk', missing_information: 'Missing SLA', confidence: 'high', evidence_references: [{ chunk_id: 'fake-chunk-999' }] },
      { title: 'Gap Mixed', conflicting_information: 'Doc mismatch', confidence: 'medium', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'fake-chunk-999' }] },
      { title: 'Gap Multiple Valid', conflicting_information: 'Doc mismatch', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1' }, { chunk_id: 'chk-2' }] },
      { title: 'Gap Existing Low', missing_information: 'Missing SLA', confidence: 'low', evidence_references: [{ chunk_id: 'chk-1' }] }
    ]
  };

  const res = validateAndSanitizeFindings(rawTestInput, validChunks);

  const findingTypes = ['employee_work_history', 'milestones', 'pending_tasks', 'risks_and_blockers', 'knowledge_gaps'];

  for (const type of findingTypes) {
    const items = res[type];
    console.log(`\nValidating category: "${type}" (${items.length} items)...`);
    assert(items.length === 5, `${type} preserves 5 items`);

    // 0: Zero citations -> low, unsupported
    assert(items[0].confidence === 'low', `${type}[0] zero citations demoted to low`);
    assert(items[0].grounding_status === 'unsupported', `${type}[0] zero citations marked unsupported`);
    assert(items[0].evidence_references.length === 0, `${type}[0] zero citations has empty array`);

    // 1: Fake chunk -> invalid removed -> zero valid citations -> low, unsupported
    assert(items[1].confidence === 'low', `${type}[1] fake chunk demoted to low`);
    assert(items[1].grounding_status === 'unsupported', `${type}[1] fake chunk marked unsupported`);
    assert(items[1].evidence_references.length === 0, `${type}[1] fake chunk purged from references`);

    // 2: Mixed citations -> fake chunk removed, 1 valid preserved -> grounded
    assert(items[2].evidence_references.length === 1, `${type}[2] mixed citations kept only 1 valid`);
    assert(items[2].evidence_references[0].chunk_id === 'chk-1', `${type}[2] valid chunk is chk-1`);
    assert(items[2].grounding_status === 'grounded', `${type}[2] mixed citations is grounded`);
    assert(items[2].confidence === 'high' || items[2].confidence === 'medium', `${type}[2] preserved valid AI confidence`);

    // 3: Multiple valid citations -> 2 citations preserved -> grounded, high confidence
    assert(items[3].evidence_references.length === 2, `${type}[3] multiple valid kept 2 citations`);
    assert(items[3].grounding_status === 'grounded', `${type}[3] multiple valid is grounded`);
    assert(items[3].confidence === 'high', `${type}[3] multiple valid preserved high confidence`);

    // 4: Existing low confidence -> remains low (never upgraded)
    assert(items[4].evidence_references.length === 1, `${type}[4] existing low has 1 valid citation`);
    assert(items[4].grounding_status === 'grounded', `${type}[4] existing low is grounded`);
    assert(items[4].confidence === 'low', `${type}[4] existing low confidence was NOT upgraded`);
  }

  console.log('\n========================================================');
  console.log('🎉 ALL UNIVERSAL CONFIDENCE & GROUNDING ASSERTIONS PASSED!');
  console.log('========================================================');
}

runTests();

