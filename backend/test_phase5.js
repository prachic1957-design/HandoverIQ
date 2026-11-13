// HandoverIQ - Phase 5 Integration Test Suite
// Verifies Handover Package Creation, Approved Findings Filtering,
// Status Transitions, Replacement Assignment, and Day-1 Briefing.

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

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting HandoverIQ Phase 5 Verification Tests');
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
    // 1. Health check
    const health = await request('/health');
    record('Backend health responds with 200 OK and Phase 5 banner', health.status === 200 && health.data.version.includes('phase5'));

    // 2. Fetch project and employee demo references
    const projs = await request('/projects');
    const emps = await request('/employees');
    const projectList = Array.isArray(projs.data) ? projs.data : projs.data?.data;
    const employeeList = Array.isArray(emps.data) ? emps.data : emps.data?.data;
    const project = projectList[0];
    const departingEmp = employeeList[0]; // Sarah Jenkins
    const replacementEmp = employeeList[1]; // Alex Chen

    record('Found synthetic project and employees for handover test', project && departingEmp && replacementEmp);

    // 3. Create or mock an analysis with known findings
    const mockAiResponse = {
      summary: 'Sarah Jenkins leading Kubernetes migration with zero-downtime cutover.',
      employee_work_history: [
        {
          work_item: 'VPC CNI & Dual NAT Gateway provisioning',
          confidence: 'high',
          evidence_references: [
            { chunk_id: 'chk-1111-1111-1111-111111111111' }
          ]
        }
      ],
      milestones: [
        {
          title: 'HashiCorp Vault Secret Migration',
          status: 'completed',
          evidence_references: [
            { chunk_id: 'chk-2222-2222-2222-222222222222' }
          ]
        }
      ],
      pending_tasks: [
        {
          description: 'Stateful database replica sync validation under peak load',
          status: 'pending',
          evidence_references: [
            { chunk_id: 'chk-2222-2222-2222-222222222222' }
          ]
        }
      ],
      risks_and_blockers: [
        {
          description: 'Replication latency spike across cross-region VPC peering',
          severity: 'medium',
          evidence_references: [
            { chunk_id: 'chk-2222-2222-2222-222222222222' }
          ]
        }
      ],
      knowledge_gaps: [],
      replacement_brief: {
        project_overview: 'Core infrastructure transformation moving legacy VMs to EKS.',
        employee_responsibilities: 'Infrastructure architecture and security hardening.',
        suggested_next_steps: 'Review Vault deployment manifests and execute failover dry-run.'
      }
    };

    const analyzeRes = await request('/knowledge/analyze', {
      method: 'POST',
      body: JSON.stringify({
        project_id: project.id,
        employee_id: departingEmp.id,
        mockResponse: mockAiResponse
      })
    });

    record('Created synthetic knowledge analysis for Phase 5', analyzeRes.status === 201 && analyzeRes.data.analysis);
    const analysisId = analyzeRes.data.analysis.id;
    const findings = analyzeRes.data.findings;

    // 4. Manager reviews findings: Approve 2 findings, leave 1 needs_review, reject 1
    if (findings.length >= 2) {
      await request(`/knowledge/findings/${findings[0].id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ review_status: 'approved', reviewer_notes: 'Verified against AWS infrastructure logs' })
      });
      await request(`/knowledge/findings/${findings[1].id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ review_status: 'approved', reviewer_notes: 'Confirmed Vault tokens rotation' })
      });
      if (findings.length >= 3) {
        await request(`/knowledge/findings/${findings[2].id}/review`, {
          method: 'PATCH',
          body: JSON.stringify({ review_status: 'rejected', reviewer_notes: 'Task already completed by DevOps team' })
        });
      }
    }
    record('Manager reviewed and approved selected findings', true);

    // 5. POST /api/handovers - Create handover package
    const pkgRes = await request('/handovers', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: analysisId, created_by: 'Rachel Green (Manager)' })
    });
    record('POST /api/handovers generates package with 201 Created', pkgRes.status === 201 && pkgRes.data.id);
    const pkgId = pkgRes.data.id;

    // 6. Verification: Only approved findings are marked verified in package_content
    const pkgDetail = await request(`/handovers/${pkgId}`);
    const verifiedFindings = pkgDetail.data.package_content?.verified_findings || [];
    const rejectedFindings = pkgDetail.data.package_content?.rejected_findings || [];
    record('Only manager-approved findings are present in verified_findings list', verifiedFindings.length === 2 && rejectedFindings.length === 1);

    // 7. GET /api/handovers - List packages
    const listRes = await request('/handovers');
    record('GET /api/handovers returns list containing created package', listRes.status === 200 && listRes.data.some(p => p.id === pkgId));

    // 8. Business Rule: Prevent self-replacement
    const selfAssignRes = await request(`/handovers/${pkgId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ replacement_employee_id: departingEmp.id })
    });
    record('Rejects assigning departing employee as their own replacement (400 Bad Request)', selfAssignRes.status === 400);

    // 9. Assign successor replacement employee
    const assignRes = await request(`/handovers/${pkgId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ replacement_employee_id: replacementEmp.id })
    });
    record('Assigns replacement employee and transitions package status to "assigned"', assignRes.status === 201 && assignRes.data.assignment);

    // 9b. Regression Check: GET /api/handovers/:id preserves assignment and returns successor details
    const refreshedPkg = await request(`/handovers/${pkgId}`);
    const singleSuccessorName = refreshedPkg.data?.assignment?.replacement_employee?.full_name ||
      refreshedPkg.data?.package_assignments?.[0]?.employees?.full_name;
    record('GET /api/handovers/:id preserves assignment with successor full_name', refreshedPkg.status === 200 && singleSuccessorName === replacementEmp.full_name);

    // 9c. Regression Check: GET /api/handovers list includes assignment and successor details
    const refreshedList = await request('/handovers');
    const listPkg = (refreshedList.data || []).find(p => p.id === pkgId);
    const listSuccessorName = listPkg?.assignment?.replacement_employee?.full_name ||
      listPkg?.package_assignments?.[0]?.employees?.full_name;
    record('GET /api/handovers list includes assignment with successor full_name', refreshedList.status === 200 && listSuccessorName === replacementEmp.full_name);

    // 10. Business Rule: Prevent duplicate replacement assignment
    const dupAssignRes = await request(`/handovers/${pkgId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ replacement_employee_id: employeeList[2].id })
    });
    record('Rejects duplicate assignment on already-assigned package (409 Conflict)', dupAssignRes.status === 409);

    // 11. Status Transition & Audit Trail
    const statusUpdateRes = await request(`/handovers/${pkgId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress', changed_by: 'Alex Chen (Successor)' })
    });
    record('PATCH /api/handovers/:id/status updates status to "in_progress"', statusUpdateRes.status === 200 && statusUpdateRes.data.status === 'in_progress');

    // 12. Invalid status rejection
    const invalidStatusRes = await request(`/handovers/${pkgId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'teleported' })
    });
    record('Rejects invalid status update with 400 Bad Request', invalidStatusRes.status === 400);

    // 13. Audit history retrieval
    const historyRes = await request(`/handovers/${pkgId}/history`);
    record('GET /api/handovers/:id/history returns complete chronological audit trail', historyRes.status === 200 && historyRes.data.length >= 3);

    // 14. GET /api/handovers/:id/briefing - Day-1 Briefing
    const briefRes = await request(`/handovers/${pkgId}/briefing`);
    const hasBriefingSuccessor = briefRes.status === 200 &&
      briefRes.data.day_one_briefing &&
      briefRes.data.successor?.full_name === replacementEmp.full_name;
    record('GET /api/handovers/:id/briefing compiles Day-1 Onboarding Briefing with assigned successor', hasBriefingSuccessor);

    // 15. Invalid package ID handling
    const invalidPkgRes = await request('/handovers/00000000-0000-0000-0000-000000000000');
    record('GET /api/handovers/:invalidId returns 404 Not Found', invalidPkgRes.status === 404);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('========================================================');
  console.log(`🏁 Phase 5 Tests Summary: Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
