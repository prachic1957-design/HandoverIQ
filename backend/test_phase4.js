// HandoverIQ - Phase 4 Automated Test Suite
// Verifies Knowledge Reconstruction, Source Citation Integrity,
// Model Configuration Guard, and Findings Review Operations.

import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runPhase4Tests() {
  console.log('========================================================');
  console.log('🧪 Starting HandoverIQ Phase 4 Automated Test Suite');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  function record(desc, cond) {
    if (cond) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Fetch available project and employee
    const projs = await request('/projects');
    const emps = await request('/employees');
    const projectList = Array.isArray(projs.data) ? projs.data : projs.data?.data;
    const employeeList = Array.isArray(emps.data) ? emps.data : emps.data?.data;
    const project = projectList[0];
    const employee = employeeList[0];

    record('Found target project and employee for Phase 4 analysis', project && employee);

    // 2. Missing params validation (400 Bad Request)
    const missingParamsRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: project.id })
    });
    record('POST /api/knowledge/analyze without employee_id returns 400 Bad Request', missingParamsRes.status === 400);

    // 3. Nonexistent project ID (404 Not Found)
    const missingProjRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: '00000000-0000-0000-0000-000000000000', employee_id: employee.id })
    });
    record('POST /api/knowledge/analyze with invalid project_id returns 404 Not Found', missingProjRes.status === 404);

    // 4. Live Gemini call without GEMINI_API_KEY returns clear configuration error
    const liveWithoutKeyRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: project.id, employee_id: employee.id })
    });
    record('POST /api/knowledge/analyze without GEMINI_API_KEY informs user gracefully', liveWithoutKeyRes.status === 500 && liveWithoutKeyRes.data?.error?.includes('GEMINI_API_KEY'));

    // 5. Mock mode analysis execution with valid chunk citations
    const mockAiPayload = {
      summary: 'Automated synthesis of Sarah Jenkins architecture runbooks and cloud configurations.',
      employee_work_history: [
        {
          work_item: 'EKS Cluster Provisioning',
          confidence: 'high',
          evidence_references: [
            { chunk_id: 'chk-1111-1111-1111-111111111111' }
          ]
        }
      ],
      milestones: [
        {
          title: 'VPC Peering Baseline',
          status: 'completed',
          evidence_references: [
            { chunk_id: 'chk-1111-1111-1111-111111111111' }
          ]
        }
      ],
      pending_tasks: [
        {
          description: 'Database replica synchronization latency profiling',
          status: 'pending',
          evidence_references: [
            { chunk_id: 'chk-2222-2222-2222-222222222222' }
          ]
        }
      ],
      risks_and_blockers: [
        {
          description: 'Peak hour write amplification across replicas',
          severity: 'high',
          evidence_references: [
            { chunk_id: 'chk-2222-2222-2222-222222222222' }
          ]
        }
      ],
      knowledge_gaps: [
        {
          title: 'Legacy Cutover SLA',
          missing_information: 'Precise cutover maintenance window timestamps',
          evidence_references: []
        }
      ],
      replacement_brief: {
        project_overview: 'EKS zero-downtime infrastructure',
        employee_responsibilities: 'Core networking and security',
        suggested_next_steps: 'Review Terraform scripts'
      }
    };

    const mockAnalyzeRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({
        project_id: project.id,
        employee_id: employee.id,
        mockResponse: mockAiPayload
      })
    });

    record('POST /api/knowledge/analyze with mock response succeeds with 201 Created', mockAnalyzeRes.status === 201 && mockAnalyzeRes.data.analysis);
    const analysisId = mockAnalyzeRes.data.analysis.id;
    const findings = mockAnalyzeRes.data.findings;

    // 6. Findings extraction count and initial review_status
    record('All 5 structured findings created and stored in repository', findings.length === 5);
    record('All initial findings created with review_status="needs_review"', findings.every(f => f.review_status === 'needs_review'));

    // 7. Hallucinated chunk rejection test
    const hallucinatedPayload = {
      summary: 'Test hallucination rejection',
      employee_work_history: [
        {
          work_item: 'Fabricated Work',
          evidence_references: [
            { chunk_id: 'fake-chunk-999999999999' }
          ]
        }
      ]
    };
    const hallRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({
        project_id: project.id,
        employee_id: employee.id,
        mockResponse: hallucinatedPayload
      })
    });
    const hallFinding = hallRes.data.findings[0];
    record('Hallucinated chunk ID is filtered out from evidence_references', hallFinding.evidence_references.length === 0);

    // 8. GET /api/knowledge/analyses
    const listRes = await request('/knowledge/analyses');
    record('GET /api/knowledge/analyses returns list containing analysis', listRes.status === 200 && listRes.data.some(a => a.id === analysisId));

    // 9. GET /api/knowledge/analyses/:id
    const singleRes = await request(`/knowledge/analyses/${analysisId}`);
    record('GET /api/knowledge/analyses/:id returns target analysis object', singleRes.status === 200 && singleRes.data.id === analysisId);

    // 10. GET /api/knowledge/analyses/:id/findings
    const findingsRes = await request(`/knowledge/analyses/${analysisId}/findings`);
    record('GET /api/knowledge/analyses/:id/findings retrieves findings', findingsRes.status === 200 && findingsRes.data.length === 5);

    // 11. PATCH /api/knowledge/findings/:id/review - Review approval
    const findingToReview = findings[0];
    const reviewRes = await request(`/knowledge/findings/${findingToReview.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({
        review_status: 'approved',
        reviewed_by: 'Rachel Green',
        reviewer_notes: 'Verified against AWS infrastructure commit history'
      })
    });
    record('PATCH /api/knowledge/findings/:id/review updates review_status to "approved"', reviewRes.status === 200 && reviewRes.data.review_status === 'approved');
    record('Reviewer identity and notes persisted accurately', reviewRes.data.reviewed_by === 'Rachel Green' && reviewRes.data.reviewer_notes.includes('AWS infrastructure'));

    // 12. Invalid review request (missing review_status)
    const invalidReviewRes = await request(`/knowledge/findings/${findingToReview.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewer_notes: 'Missing status' })
    });
    record('PATCH finding review without review_status returns 400 Bad Request', invalidReviewRes.status === 400);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('========================================================');
  console.log(`🏁 Phase 4 Tests Summary: Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests();

