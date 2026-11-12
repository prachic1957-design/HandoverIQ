/**
 * Comprehensive Automated Verification Test for Phase 2
 * HandoverIQ - Team ROGUENOVA
 */

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 2 AUTOMATED TEST SUITE ---');
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
    // 1. Dashboard Stats
    console.log('\n[TEST 1] Verifying Dashboard Live Stats...');
    const statsRes = await fetch(`${API_BASE}/dashboard/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success, 'GET /api/dashboard/stats returned 200');
    assert(statsData.data.departments >= 3, 'Stats shows at least 3 departments');
    assert(statsData.data.employees >= 5, 'Stats shows at least 5 employees');
    assert(statsData.data.projects >= 2, 'Stats shows at least 2 projects');

    // 2. Department CRUD
    console.log('\n[TEST 2] Verifying Department CRUD...');
    const createDeptRes = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Legal & Compliance', description: 'Internal legal counsel and compliance.' })
    });
    const createDeptData = await createDeptRes.json();
    assert(createDeptRes.status === 201 && createDeptData.success, 'POST /api/departments created new department');
    const newDeptId = createDeptData.data.id;

    // Duplicate Department Name validation
    const dupDeptRes = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Legal & Compliance' })
    });
    assert(dupDeptRes.status === 409, 'POST duplicate department name correctly rejected with 409 Conflict');

    // Update Department
    const updateDeptRes = await fetch(`${API_BASE}/departments/${newDeptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Global Legal & Regulatory', description: 'Updated description' })
    });
    const updateDeptData = await updateDeptRes.json();
    assert(updateDeptRes.status === 200 && updateDeptData.data.name === 'Global Legal & Regulatory', 'PUT /api/departments/:id updated department name');

    // Foreign Key RESTRICT check
    const itDeptRes = await fetch(`${API_BASE}/departments`);
    const itDepts = await itDeptRes.json();
    const itDept = itDepts.data.find(d => d.name === 'Information Technology');
    const deleteITRes = await fetch(`${API_BASE}/departments/${itDept.id}`, { method: 'DELETE' });
    const deleteITData = await deleteITRes.json();
    assert(deleteITRes.status === 400 && deleteITData.error === 'Foreign Key Violation', 'DELETE department with assigned employees blocked with Foreign Key Violation (400)');

    // Delete created department
    const deleteDeptRes = await fetch(`${API_BASE}/departments/${newDeptId}`, { method: 'DELETE' });
    assert(deleteDeptRes.status === 200, 'DELETE empty department succeeded with 200');

    // 3. Employee CRUD & Confidential Salary Protection
    console.log('\n[TEST 3] Verifying Employee CRUD & Confidential Salary RBAC...');
    // Non-HR query should not receive salary
    const empStandardRes = await fetch(`${API_BASE}/employees`);
    const empStandardData = await empStandardRes.json();
    assert(empStandardRes.status === 200, 'GET /api/employees (standard) returned 200');
    assert(empStandardData.hrView === false, 'Response indicates standard (non-HR) view');
    assert(!empStandardData.data.some(e => e.salary !== undefined), 'Confidential salary field is strictly omitted for standard requests');

    // HR query should receive salary
    const empHRRes = await fetch(`${API_BASE}/employees`, {
      headers: { 'x-user-role': 'hr' }
    });
    const empHRData = await empHRRes.json();
    assert(empHRRes.status === 200, 'GET /api/employees (HR role) returned 200');
    assert(empHRData.hrView === true, 'Response indicates HR view active');
    const sarahHR = empHRData.data.find(e => e.email === 'sarah.jenkins@handoveriq.internal');
    assert(sarahHR && sarahHR.salary === 145000, 'HR query successfully retrieved authorized salary ($145,000)');

    // Attempting to create employee with salary WITHOUT HR role must be 403
    const forbiddenCreateRes = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Attacker',
        email: 'test.attacker@handoveriq.internal',
        designation: 'Hacker',
        department_id: itDept.id,
        salary: 200000
      })
    });
    assert(forbiddenCreateRes.status === 403, 'POST /api/employees setting salary without HR credentials rejected with 403 Forbidden');

    // Create valid employee with HR role
    const validCreateRes = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'hr' },
      body: JSON.stringify({
        full_name: 'Marcus Vance',
        email: 'marcus.vance@handoveriq.internal',
        designation: 'Operations Specialist',
        department_id: itDept.id,
        employment_status: 'active',
        salary: 92000
      })
    });
    const validCreateData = await validCreateRes.json();
    assert(validCreateRes.status === 201 && validCreateData.success, 'POST /api/employees with HR authorization succeeded (201)');
    const marcusId = validCreateData.data.id;

    // Update employee status
    const updateEmpRes = await fetch(`${API_BASE}/employees/${marcusId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employment_status: 'handover_pending' })
    });
    const updateEmpData = await updateEmpRes.json();
    assert(updateEmpRes.status === 200 && updateEmpData.data.employment_status === 'handover_pending', 'PUT /api/employees/:id updated employment status to handover_pending');

    // 4. Project CRUD & Member Assignments
    console.log('\n[TEST 4] Verifying Project CRUD & Member Assignment...');
    const createProjRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Zero-Trust Identity Governance',
        description: 'Implementation of least-privilege RBAC across cloud services.',
        status: 'in_progress',
        start_date: '2026-03-01'
      })
    });
    const createProjData = await createProjRes.json();
    assert(createProjRes.status === 201 && createProjData.success, 'POST /api/projects created project');
    const newProjId = createProjData.data.id;

    // Assign Marcus to this project
    const assignMemberRes = await fetch(`${API_BASE}/projects/${newProjId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: marcusId,
        responsibility: 'Lead security policies audit and SSO integration.',
        work_status: 'in_progress'
      })
    });
    const assignMemberData = await assignMemberRes.json();
    assert(assignMemberRes.status === 201 && assignMemberData.success, 'POST /api/projects/:id/members assigned employee with responsibility');

    // Duplicate assignment check
    const dupAssignRes = await fetch(`${API_BASE}/projects/${newProjId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: marcusId,
        responsibility: 'Duplicate test'
      })
    });
    assert(dupAssignRes.status === 409, 'Duplicate employee assignment rejected with 409 Conflict');

    // Verify Project details include member
    const getProjRes = await fetch(`${API_BASE}/projects/${newProjId}`);
    const getProjData = await getProjRes.json();
    assert(getProjData.data.project_members.length === 1, 'GET /api/projects/:id returns assigned project members array');
    assert(getProjData.data.project_members[0].responsibility.includes('SSO integration'), 'Project member responsibility verified');

    // Remove member from project
    const removeMemberRes = await fetch(`${API_BASE}/projects/${newProjId}/members/${marcusId}`, {
      method: 'DELETE'
    });
    assert(removeMemberRes.status === 200, 'DELETE /api/projects/:id/members/:employeeId removed member assignment');

    // Delete test project and test employee
    const deleteProjRes = await fetch(`${API_BASE}/projects/${newProjId}`, { method: 'DELETE' });
    assert(deleteProjRes.status === 200, 'DELETE /api/projects/:id deleted test project');

    const deleteEmpRes = await fetch(`${API_BASE}/employees/${marcusId}`, { method: 'DELETE' });
    assert(deleteEmpRes.status === 200, 'DELETE /api/employees/:id deleted test employee');

    console.log(`\n========================================`);
    console.log(`TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);

  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
