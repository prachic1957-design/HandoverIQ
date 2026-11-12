// HandoverIQ - End-to-End Workflow Verification Script
// Simulates the exact user actions across all 5 phases.

const base = 'http://localhost:5000/api';

async function runEndToEnd() {
  console.log('========================================================');
  console.log('🔄 Executing Full End-to-End HandoverIQ Workflow');
  console.log('========================================================');

  // 1. Health check
  console.log('1. Health Check');
  const h = await (await fetch(base + '/health')).json();
  console.log('   Status:', h.status, '| Version:', h.version, '| Phase:', h.phase);

  // 2. Fetch existing uploaded documents & chunks
  console.log('2. Inspecting Uploaded Documents & Chunks');
  const docsRes = await (await fetch(base + '/documents')).json();
  const doc = docsRes.data[0];
  console.log('   Found Document:', doc.original_filename, '| ID:', doc.id);
  const chunksRes = await (await fetch(base + `/documents/${doc.id}/chunks`)).json();
  console.log('   Traceable Chunks Count:', chunksRes.count, '| Sample section:', chunksRes.data[0]?.section_reference);

  // 3. Trigger Knowledge Reconstruction
  console.log('3. Triggering AI Knowledge Reconstruction (Mock Mode)');
  const mockAI = {
    summary: 'Sarah Jenkins infrastructure migration with zero-downtime cutover.',
    employee_work_history: [
      { work_item: 'EKS cluster provisioning with dual NAT Gateway', confidence: 'high', evidence_references: [{ chunk_id: 'chk-1111-1111-1111-111111111111' }] }
    ],
    milestones: [
      { title: 'Vault secrets migration complete', status: 'completed', evidence_references: [{ chunk_id: 'chk-2222-2222-2222-222222222222' }] }
    ],
    pending_tasks: [
      { description: 'Execute final replica sync test', status: 'pending', evidence_references: [{ chunk_id: 'chk-2222-2222-2222-222222222222' }] }
    ],
    risks_and_blockers: [
      { description: 'Stateful replica sync latency spike', severity: 'high', evidence_references: [{ chunk_id: 'chk-2222-2222-2222-222222222222' }] }
    ],
    knowledge_gaps: [],
    replacement_brief: {
      project_overview: 'Core infrastructure modernization to AWS EKS.',
      employee_responsibilities: 'Cluster security and networking configuration.',
      suggested_next_steps: 'Review Terraform scripts and verify Vault token lease renewals.'
    }
  };

  const anaRes = await fetch(base + '/knowledge/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: 'p1111111-1111-1111-1111-111111111111',
      employee_id: 'e1111111-1111-1111-1111-111111111111',
      mockResponse: mockAI
    })
  });
  const ana = await anaRes.json();
  console.log('   Analysis Created | ID:', ana.analysis.id, '| Findings Created:', ana.findings.length);

  // 4. Review & Approve Findings
  console.log('4. Manager Review & Finding Approval');
  const finding = ana.findings[0];
  const revRes = await fetch(base + `/knowledge/findings/${finding.id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      review_status: 'approved',
      reviewed_by: 'Rachel Green (Manager)',
      reviewer_notes: 'Verified against AWS infrastructure commit history'
    })
  });
  const rev = await revRes.json();
  console.log('   Finding Status:', rev.review_status, '| Reviewer:', rev.reviewed_by);

  // 5. Compile Handover Package
  console.log('5. Compiling Handover Package');
  const pkgRes = await fetch(base + '/handovers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: ana.analysis.id, created_by: 'Rachel Green' })
  });
  const pkg = await pkgRes.json();
  console.log('   Package Compiled | ID:', pkg.id, '| Status:', pkg.status, '| Verified Findings Count:', pkg.package_content?.verified_findings?.length);

  // 6. Assign Replacement Employee
  console.log('6. Assigning Replacement Successor');
  const assignRes = await fetch(base + `/handovers/${pkg.id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replacement_employee_id: 'e2222222-2222-2222-2222-222222222222' }) // Alex Chen
  });
  const assign = await assignRes.json();
  console.log('   Successor Assigned:', assign.assignment?.employees?.full_name, '| Designation:', assign.assignment?.employees?.designation);

  // 7. Day-1 Onboarding Briefing
  console.log('7. Compiling & Retrieving Day-1 Replacement Briefing');
  const briefRes = await (await fetch(base + `/handovers/${pkg.id}/briefing`)).json();
  console.log('   Predecessor:', briefRes.predecessor?.full_name, '-> Successor:', briefRes.successor?.full_name);
  console.log('   Actionable Next Steps:', briefRes.day_one_briefing?.actionable_next_steps);
  console.log('   Verified Findings Shown in Briefing:', briefRes.verification_status?.total_verified_findings);

  // 8. Audit Trail History
  console.log('8. Retrieving Handover Status History');
  const hist = await (await fetch(base + `/handovers/${pkg.id}/history`)).json();
  console.log('   Audit Trail Events:');
  for (const h of hist) {
    console.log(`     - [${h.status}] changed by ${h.changed_by} at ${h.changed_at}`);
  }

  console.log('========================================================');
  console.log('🎉 Full End-to-End Workflow Completed Successfully!');
  console.log('========================================================');
}

runEndToEnd().catch(console.error);

