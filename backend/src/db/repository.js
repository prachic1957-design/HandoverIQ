// Full repository file (original content up to line 1195) reconstructed from backup
import { supabase, isConfigured } from '../config/supabase.js';
import crypto from 'crypto';

// ==============================================================================
// Synthetic Demo Initial State (strictly typed & relational)
// ==============================================================================
let mockDepartments = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    name: 'Information Technology',
    description: 'Enterprise cloud infrastructure, cybersecurity, and internal platforms.',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    name: 'Human Resources',
    description: 'Talent acquisition, employee onboarding, culture, and organizational governance.',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    name: 'Finance',
    description: 'Financial forecasting, statutory compliance, budget allocations, and accounting.',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

let mockEmployees = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    full_name: 'Sarah Jenkins',
    email: 'sarah.jenkins@handoveriq.internal',
    designation: 'Lead Cloud Architect',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    joining_date: '2022-03-15',
    employment_status: 'handover_pending',
    salary: 145000.00,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString()
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    full_name: 'Alex Chen',
    email: 'alex.chen@handoveriq.internal',
    designation: 'Senior DevOps Engineer',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    joining_date: '2023-01-10',
    employment_status: 'active',
    salary: 120000.00,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString()
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    full_name: 'Rachel Green',
    email: 'rachel.green@handoveriq.internal',
    designation: 'People Operations Lead',
    department_id: 'd2222222-2222-2222-2222-222222222222',
    joining_date: '2021-08-01',
    employment_status: 'active',
    salary: 110000.00,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString()
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    full_name: 'David Miller',
    email: 'david.miller@handoveriq.internal',
    designation: 'Senior Financial Analyst',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    joining_date: '2022-11-20',
    employment_status: 'handover_pending',
    salary: 118000.00,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString()
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    full_name: 'Priya Sharma',
    email: 'priya.sharma@handoveriq.internal',
    designation: 'Finance Automation Specialist',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    joining_date: '2023-06-05',
    employment_status: 'active',
    salary: 98000.00,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString()
  }
];

let mockProjects = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    name: 'Core Infrastructure Migration',
    description: 'Migration of legacy monolithic services to Kubernetes cluster with automated zero-downtime deployment pipelines.',
    status: 'in_progress',
    start_date: '2026-01-15',
    end_date: '2026-06-30',
    created_at: new Date('2026-01-03T00:00:00Z').toISOString()
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    name: 'Q4 Budget Automation',
    description: 'Implementation of automated reconciliation and multi-currency reporting pipelines for enterprise finance.',
    status: 'in_progress',
    start_date: '2026-02-01',
    end_date: '2026-05-15',
    created_at: new Date('2026-01-03T00:00:00Z').toISOString()
  }
];

let mockProjectMembers = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    project_id: 'p1111111-1111-1111-1111-111111111111',
    employee_id: 'e1111111-1111-1111-1111-111111111111',
    responsibility: 'Lead architect for VPC peering, Kubernetes cluster provisioning, and security compliance policies.',
    work_status: 'completed',
    created_at: new Date('2026-01-04T00:00:00Z').toISOString()
  },
  {
    id: 'm2222222-2222-2222-2222-222222222222',
    project_id: 'p1111111-1111-1111-1111-111111111111',
    employee_id: 'e2222222-2222-2222-2222-222222222222',
    responsibility: 'Implementation of GitHub Actions CI/CD pipelines and Helm chart deployment configurations.',
    work_status: 'in_progress',
    created_at: new Date('2026-01-04T00:00:00Z').toISOString()
  },
  {
    id: 'm3333333-3333-3333-3333-333333333333',
    project_id: 'p2222222-2222-2222-2222-222222222222',
    employee_id: 'e4444444-4444-4444-4444-444444444444',
    responsibility: 'Financial logic validation, currency fluctuation modeling, and variance report generation.',
    work_status: 'in_progress',
    created_at: new Date('2026-01-04T00:00:00Z').toISOString()
  },
  {
    id: 'm4444444-4444-4444-4444-444444444444',
    project_id: 'p2222222-2222-2222-2222-222222222222',
    employee_id: 'e5555555-5555-5555-5555-555555555555',
    responsibility: 'ETL script pipeline to ingest raw bank CSV statements and reconcile general ledger entries.',
    work_status: 'completed',
    created_at: new Date('2026-01-04T00:00:00Z').toISOString()
  }
];

// Phase 3 Ingested Documents
let mockDocuments = [
  {
    id: 'doc-1111-1111-1111-111111111111',
    project_id: 'p1111111-1111-1111-1111-111111111111',
    employee_id: 'e1111111-1111-1111-1111-111111111111',
    original_filename: 'kubernetes_migration_plan_v2.txt',
    storage_path: 'projects/p1111111-1111-1111-1111-111111111111/kubernetes_migration_plan_v2.txt',
    mime_type: 'text/plain',
    file_size: 4820,
    file_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    extracted_text: `Project: Core Infrastructure Migration\nAuthor: Sarah Jenkins\nObjective: Zero-downtime cutover to AWS EKS.\nKey Milestone 1: VPC CNI and dual NAT Gateway topology provisioned.\nKey Milestone 2: Secret management migrated to HashiCorp Vault.\nRisk: Stateful legacy database replica synchronization latency during peak traffic hours.`,
    processing_status: 'completed',
    processing_error: null,
    uploaded_at: new Date('2026-01-10T10:30:00Z').toISOString()
  },
  {
    id: 'doc-2222-2222-2222-222222222222',
    project_id: 'p2222222-2222-2222-2222-222222222222',
    employee_id: 'e4444444-4444-4444-4444-444444444444',
    original_filename: 'q4_gl_reconciliation_rules.csv',
    storage_path: 'projects/p2222222-2222-2222-2222-222222222222/q4_gl_reconciliation_rules.csv',
    mime_type: 'text/csv',
    file_size: 2340,
    file_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    extracted_text: `CSV Dataset Schema: [Rule_ID | Category | Tolerance | Approval_Lead]\nRow 1: { Rule_ID: \"REC-01\", Category: \"Cloud Infrastructure\", Tolerance: \"5%\", Approval_Lead: \"David Miller\" }\nRow 2: { Rule_ID: \"REC-02\", Category: \"Software Licensing\", Tolerance: \"2%\", Approval_Lead: \"David Miller\" }`,
    processing_status: 'completed',
    processing_error: null,
    uploaded_at: new Date('2026-01-12T14:15:00Z').toISOString()
  }
];

// Phase 3 Ingested Document Chunks
let mockDocumentChunks = [
  {
    id: 'chk-1111-1111-1111-111111111111',
    document_id: 'doc-1111-1111-1111-111111111111',
    chunk_index: 0,
    extracted_content: 'Project: Core Infrastructure Migration\nAuthor: Sarah Jenkins\nObjective: Zero-downtime cutover to AWS EKS.\nKey Milestone 1: VPC CNI and dual NAT Gateway topology provisioned.',
    page_number: null,
    section_reference: 'Section 1: Architecture Baseline',
    created_at: new Date('2026-01-10T10:30:05Z').toISOString()
  },
  {
    id: 'chk-2222-2222-2222-222222222222',
    document_id: 'doc-1111-1111-1111-111111111111',
    chunk_index: 1,
    extracted_content: 'Key Milestone 2: Secret management migrated to HashiCorp Vault.\nRisk: Stateful legacy database replica synchronization latency during peak traffic hours.',
    page_number: null,
    section_reference: 'Section 2: Security & Identified Risks',
    created_at: new Date('2026-01-10T10:30:05Z').toISOString()
  },
  {
    id: 'chk-3333-3333-3333-333333333333',
    document_id: 'doc-2222-2222-2222-222222222222',
    chunk_index: 0,
    extracted_content: 'CSV Dataset Schema: [Rule_ID | Category | Tolerance | Approval_Lead]\nRow 1: { Rule_ID: \"REC-01\", Category: \"Cloud Infrastructure\", Tolerance: \"5%\", Approval_Lead: \"David Miller\" }',
    page_number: null,
    section_reference: 'Rows 1-1',
    created_at: new Date('2026-01-12T14:15:05Z').toISOString()
  },
  {
    id: 'chk-4444-4444-4444-444444444444',
    document_id: 'doc-2222-2222-2222-222222222222',
    chunk_index: 1,
    extracted_content: 'Row 2: { Rule_ID: \"REC-02\", Category: \"Software Licensing\", Tolerance: \"2%\", Approval_Lead: \"David Miller\" }',
    page_number: null,
    section_reference: 'Rows 2-2',
    created_at: new Date('2026-01-12T14:15:05Z').toISOString()
  }
];

// Helper to sanitize employee record based on HR authorization
function sanitizeEmployee(emp, isHR = false) {
  if (!emp) return null;
  const clone = { ...emp };
  if (!isHR) {
    delete clone.salary;
  }
  return clone;
}

// ===========================================================================
// REPOSITORY IMPLEMENTATION
// ===========================================================================
export const db = {
  // --------------------------------------------------------------------------
  // DEPARTMENTS
  // --------------------------------------------------------------------------
  async getAllDepartments() {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
    return [...mockDepartments].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getDepartmentById(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    return mockDepartments.find(d => d.id === id) || null;
  },

  async createDepartment({ name, description }) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .insert([{ name: name.trim(), description: description?.trim() || null }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const trimmedName = name.trim();
    if (mockDepartments.some(d => d.name.toLowerCase() === trimmedName.toLowerCase())) {
      const err = new Error(`Department with name \"${trimmedName}\" already exists.`);
      err.code = '23505';
      throw err;
    }

    const newDept = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: description?.trim() || null,
      created_at: new Date().toISOString()
    };
    mockDepartments.push(newDept);
    return newDept;
  },

  async updateDepartment(id, { name, description }) {
    if (isConfigured) {
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description?.trim() || null;

      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockDepartments.findIndex(d => d.id === id);
    if (idx === -1) return null;

    if (name) {
      const trimmed = name.trim();
      const conflict = mockDepartments.some(d => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase());
      if (conflict) {
        const err = new Error(`Department with name \"${trimmed}\" already exists.`);
        err.code = '23505';
        throw err;
      }
      mockDepartments[idx].name = trimmed;
    }
    if (description !== undefined) {
      mockDepartments[idx].description = description?.trim() || null;
    }
    return mockDepartments[idx];
  },

  async deleteDepartment(id) {
    if (isConfigured) {
      const { count, error: countErr } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);
      if (countErr) throw countErr;
      if (count > 0) {
        const err = new Error(`Cannot delete department: ${count} employees are currently assigned to it.`);
        err.code = '23503';
        throw err;
      }

      const { data, error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const assignedCount = mockEmployees.filter(e => e.department_id === id).length;
    if (assignedCount > 0) {
      const err = new Error(`Cannot delete department: ${assignedCount} employees are currently assigned to it.`);
      err.code = '23503';
      throw err;
    }

    const idx = mockDepartments.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const removed = mockDepartments.splice(idx, 1)[0];
    return removed;
  },

  // --------------------------------------------------------------------------
  // EMPLOYEES
  // --------------------------------------------------------------------------
  async getAllEmployees({ department_id, search, isHR = false }) {
    if (isConfigured) {
      let query = supabase.from('employees').select(`
        id,
        full_name,
        email,
        designation,
        department_id,
        joining_date,
        employment_status,
        ${isHR ? 'salary,' : ''}
        created_at,
        departments ( id, name )
      `);

      if (department_id) {
        query = query.eq('department_id', department_id);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,designation.ilike.%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    let result = mockEmployees.map(emp => {
      const dept = mockDepartments.find(d => d.id === emp.department_id);
      const sanitized = sanitizeEmployee(emp, isHR);
      return {
        ...sanitized,
        departments: dept ? { id: dept.id, name: dept.name } : null
      };
    });

    if (department_id) {
      result = result.filter(e => e.department_id === department_id);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getEmployeeById(id, { isHR = false } = {}) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          designation,
          department_id,
          joining_date,
          employment_status,
          ${isHR ? 'salary,' : ''}
          created_at,
          departments ( id, name, description )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }

    const emp = mockEmployees.find(e => e.id === id);
    if (!emp) return null;
    const dept = mockDepartments.find(d => d.id === emp.department_id);
    return {
      ...sanitizeEmployee(emp, isHR),
      departments: dept ? { id: dept.id, name: dept.name, description: dept.description } : null
    };
  },

  async createEmployee({ full_name, email, designation, department_id, joining_date, employment_status, salary, isHR = false }) {
    if (isConfigured) {
      const payload = {
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        designation: designation.trim(),
        department_id,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        employment_status: employment_status || 'active'
      };
      if (isHR && salary !== undefined && salary !== null && salary !== '') {
        payload.salary = Number(salary);
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([payload])
        .select(`*, departments(id, name)`)
        .single();
      if (error) throw error;
      return sanitizeEmployee(data, isHR);
    }

    if (!mockDepartments.some(d => d.id === department_id)) {
      const err = new Error(`Department ID \"${department_id}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (mockEmployees.some(e => e.email.toLowerCase() === cleanEmail)) {
      const err = new Error(`Employee with email \"${cleanEmail}\" already exists.`);
      err.code = '23505';
      throw err;
    }

    const newEmp = {
      id: crypto.randomUUID(),
      full_name: full_name.trim(),
      email: cleanEmail,
      designation: designation.trim(),
      department_id,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      employment_status: employment_status || 'active',
      salary: (isHR && salary !== undefined && salary !== null && salary !== '') ? Number(salary) : null,
      created_at: new Date().toISOString()
    };
    mockEmployees.push(newEmp);

    const dept = mockDepartments.find(d => d.id === department_id);
    return {
      ...sanitizeEmployee(newEmp, isHR),
      departments: dept ? { id: dept.id, name: dept.name } : null
    };
  },

  async updateEmployee(id, updates, { isHR = false } = {}) {
    if (isConfigured) {
      const patch = {};
      if (updates.full_name) patch.full_name = updates.full_name.trim();
      if (updates.email) patch.email = updates.email.trim().toLowerCase();
      if (updates.designation) patch.designation = updates.designation.trim();
      if (updates.department_id) patch.department_id = updates.department_id;
      if (updates.joining_date) patch.joining_date = updates.joining_date;
      if (updates.employment_status) patch.employment_status = updates.employment_status;
      if (isHR && updates.salary !== undefined) {
        patch.salary = updates.salary !== null && updates.salary !== '' ? Number(updates.salary) : null;
      }

      const { data, error } = await supabase
        .from('employees')
        .update(patch)
        .eq('id', id)
        .select(`*, departments(id, name)`)
        .single();
      if (error) throw error;
      return sanitizeEmployee(data, isHR);
    }

    const idx = mockEmployees.findIndex(e => e.id === id);
    if (idx === -1) return null;

    if (updates.department_id && !mockDepartments.some(d => d.id === updates.department_id)) {
      const err = new Error(`Department ID \"${updates.department_id}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const conflict = mockEmployees.some(e => e.id !== id && e.email.toLowerCase() === cleanEmail);
      if (conflict) {
        const err = new Error(`Employee with email \"${cleanEmail}\" already exists.`);
        err.code = '23505';
        throw err;
      }
      mockEmployees[idx].email = cleanEmail;
    }

    if (updates.full_name) mockEmployees[idx].full_name = updates.full_name.trim();
    if (updates.designation) mockEmployees[idx].designation = updates.designation.trim();
    if (updates.department_id) mockEmployees[idx].department_id = updates.department_id;
    if (updates.joining_date) mockEmployees[idx].joining_date = updates.joining_date;
    if (updates.employment_status) mockEmployees[idx].employment_status = updates.employment_status;
    if (isHR && updates.salary !== undefined) {
      mockEmployees[idx].salary = updates.salary !== null && updates.salary !== '' ? Number(updates.salary) : null;
    }

    const dept = mockDepartments.find(d => d.id === mockEmployees[idx].department_id);
    return {
      ...sanitizeEmployee(mockEmployees[idx], isHR),
      departments: dept ? { id: dept.id, name: dept.name } : null
    };
  },

  async deleteEmployee(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockEmployees.findIndex(e => e.id === id);
    if (idx === -1) return null;

    mockProjectMembers = mockProjectMembers.filter(m => m.employee_id !== id);
    const removed = mockEmployees.splice(idx, 1)[0];
    return removed;
  },

  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  async getAllProjects({ status, search } = {}) {
    if (isConfigured) {
      let query = supabase.from('projects').select(`
        *,
        project_members (
          id,
          responsibility,
          work_status,
          employees ( id, full_name, designation, email )
        )
      `);

      if (status) query = query.eq('status', status);
      if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    let result = mockProjects.map(proj => {
      const members = mockProjectMembers
        .filter(m => m.project_id === proj.id)
        .map(m => {
          const emp = mockEmployees.find(e => e.id === m.employee_id);
          return {
            id: m.id,
            employee_id: m.employee_id,
            responsibility: m.responsibility,
            work_status: m.work_status,
            created_at: m.created_at,
            employees: emp ? {
              id: emp.id,
              full_name: emp.full_name,
              designation: emp.designation,
              email: emp.email
            } : null
          };
        });
      return { ...proj, project_members: members };
    });

    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getProjectById(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members (
            id,
            employee_id,
            responsibility,
            work_status,
            created_at,
            employees (
              id,
              full_name,
              designation,
              email,
              department_id,
              departments ( name )
            )
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }

    const proj = mockProjects.find(p => p.id === id);
    if (!proj) return null;

    const members = mockProjectMembers
      .filter(m => m.project_id === proj.id)
      .map(m => {
        const emp = mockEmployees.find(e => e.id === m.employee_id);
        const dept = emp ? mockDepartments.find(d => d.id === emp.department_id) : null;
        return {
          id: m.id,
          employee_id: m.employee_id,
          responsibility: m.responsibility,
          work_status: m.work_status,
          created_at: m.created_at,
          employees: emp ? {
            id: emp.id,
            full_name: emp.full_name,
            designation: emp.designation,
            email: emp.email,
            department_id: emp.department_id,
            departments: dept ? { name: dept.name } : null
          } : null
        };
      });

    return { ...proj, project_members: members };
  },

  async createProject({ name, description, status, start_date, end_date }) {
    if (isConfigured) {
      const payload = {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'planning',
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || null
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return { ...data, project_members: [] };
    }

    const newProject = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description?.trim() || null,
      status: status || 'planning',
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      created_at: new Date().toISOString()
    };
    mockProjects.push(newProject);
    return { ...newProject, project_members: [] };
  },

  async updateProject(id, updates) {
    if (isConfigured) {
      const patch = {};
      if (updates.name) patch.name = updates.name.trim();
      if (updates.description !== undefined) patch.description = updates.description?.trim() || null;
      if (updates.status) patch.status = updates.status;
      if (updates.start_date) patch.start_date = updates.start_date;
      if (updates.end_date !== undefined) patch.end_date = updates.end_date || null;

      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockProjects.findIndex(p => p.id === id);
    if (idx === -1) return null;

    if (updates.name) mockProjects[idx].name = updates.name.trim();
    if (updates.description !== undefined) mockProjects[idx].description = updates.description?.trim() || null;
    if (updates.status) mockProjects[idx].status = updates.status;
    if (updates.start_date) mockProjects[idx].start_date = updates.start_date;
    if (updates.end_date !== undefined) mockProjects[idx].end_date = updates.end_date || null;

    return mockProjects[idx];
  },

  async deleteProject(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockProjects.findIndex(p => p.id === id);
    if (idx === -1) return null;

    mockProjectMembers = mockProjectMembers.filter(m => m.project_id !== id);
    const removed = mockProjects.splice(idx, 1)[0];
    return removed;
  },

  // --------------------------------------------------------------------------
  // PROJECT MEMBERS
  // --------------------------------------------------------------------------
  async getProjectMembers(projectId) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          employees (
            id,
            full_name,
            designation,
            email,
            department_id,
            departments ( name )
          )
        `)
        .eq('project_id', projectId);
      if (error) throw error;
      return data;
    }
    return mockProjectMembers
      .filter(m => m.project_id === projectId)
      .map(m => {
        const emp = mockEmployees.find(e => e.id === m.employee_id);
        const dept = emp ? mockDepartments.find(d => d.id === emp.department_id) : null;
        return {
          ...m,
          employees: emp ? {
            id: emp.id,
            full_name: emp.full_name,
            designation: emp.designation,
            email: emp.email,
            department_id: emp.department_id,
            departments: dept ? { name: dept.name } : null
          } : null
        };
      });
  },

  async addProjectMember(projectId, { employee_id, responsibility, work_status }) {
    if (isConfigured) {
      const payload = {
        project_id: projectId,
        employee_id,
        responsibility: responsibility.trim(),
        work_status: work_status || 'in_progress'
      };

      const { data, error } = await supabase
        .from('project_members')
        .insert([payload])
        .select(`
          *,
          employees (
            id,
            full_name,
            designation,
            email,
            department_id,
            departments ( name )
          )
        `)
        .single();
      if (error) throw error;
      return data;
    }

    if (!mockProjects.some(p => p.id === projectId)) {
      const err = new Error(`Project ID \"${projectId}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    const emp = mockEmployees.find(e => e.id === employee_id);
    if (!emp) {
      const err = new Error(`Employee ID \"${employee_id}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    if (mockProjectMembers.some(m => m.project_id === projectId && m.employee_id === employee_id)) {
      const err = new Error(`Employee is already assigned to this project.`);
      err.code = '23505';
      throw err;
    }

    const newMember = {
      id: crypto.randomUUID(),
      project_id: projectId,
      employee_id,
      responsibility: responsibility.trim(),
      work_status: work_status || 'in_progress',
      created_at: new Date().toISOString()
    };
    mockProjectMembers.push(newMember);

    const dept = mockDepartments.find(d => d.id === emp.department_id);
    return {
      ...newMember,
      employees: {
        id: emp.id,
        full_name: emp.full_name,
        designation: emp.designation,
        email: emp.email,
        department_id: emp.department_id,
        departments: dept ? { name: dept.name } : null
      }
    };
  },

  async removeProjectMember(projectId, employeeId) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('employee_id', employeeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockProjectMembers.findIndex(m => m.project_id === projectId && m.employee_id === employeeId);
    if (idx === -1) return null;
    const removed = mockProjectMembers.splice(idx, 1)[0];
    return removed;
  },

  // --------------------------------------------------------------------------
  // DOCUMENTS (PHASE 3)
  // --------------------------------------------------------------------------
  async getAllDocuments({ project_id, employee_id, processing_status, search } = {}) {
    if (isConfigured) {
      let query = supabase.from('documents').select(`
        *,
        projects ( id, name ),
        employees ( id, full_name, designation, email )
      `);

      if (project_id) query = query.eq('project_id', project_id);
      if (employee_id) query = query.eq('employee_id', employee_id);
      if (processing_status) query = query.eq('processing_status', processing_status);
      if (search) query = query.ilike('original_filename', `%${search}%`);

      const { data, error } = await query.order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    let result = mockDocuments.map(doc => {
      const proj = mockProjects.find(p => p.id === doc.project_id);
      const emp = mockEmployees.find(e => e.id === doc.employee_id);
      const chunks = mockDocumentChunks.filter(c => c.document_id === doc.id);
      return {
        ...doc,
        projects: proj ? { id: proj.id, name: proj.name } : null,
        employees: emp ? { id: emp.id, full_name: emp.full_name, designation: emp.designation, email: emp.email } : null,
        chunk_count: chunks.length
      };
    });

    if (project_id) result = result.filter(d => d.project_id === project_id);
    if (employee_id) result = result.filter(d => d.employee_id === employee_id);
    if (processing_status) result = result.filter(d => d.processing_status === processing_status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.original_filename.toLowerCase().includes(q));
    }

    return result.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
  },

  async getDocumentById(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          projects ( id, name, status ),
          employees ( id, full_name, designation, email, department_id )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;

      // Also get chunks count and preview
      const { data: chunks, error: chunkErr } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', id)
        .order('chunk_index', { ascending: true });
      if (chunkErr) throw chunkErr;

      return {
        ...data,
        chunks: chunks || []
      };
    }

    const doc = mockDocuments.find(d => d.id === id);
    if (!doc) return null;

    const proj = mockProjects.find(p => p.id === doc.project_id);
    const emp = mockEmployees.find(e => e.id === doc.employee_id);
    const chunks = mockDocumentChunks
      .filter(c => c.document_id === doc.id)
      .sort((a, b) => a.chunk_index - b.chunk_index);

    return {
      ...doc,
      projects: proj ? { id: proj.id, name: proj.name, status: proj.status } : null,
      employees: emp ? { id: emp.id, full_name: emp.full_name, designation: emp.designation, email: emp.email } : null,
      chunks
    };
  },

  async getDocumentChunks(documentId) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });
      if (error) throw error;
      return data;
    }
    return mockDocumentChunks
      .filter(c => c.document_id === documentId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
  },

  async getDocumentChunksByProject(projectId) {
    if (isConfigured) {
      const { data: docs, error: docErr } = await supabase
        .from('documents')
        .select('id')
        .eq('project_id', projectId);
      if (docErr) throw docErr;
      if (!docs || docs.length === 0) return [];
      const docIds = docs.map(d => d.id);
      const { data: chunks, error: chunkErr } = await supabase
        .from('document_chunks')
        .select('*, documents(id, project_id, employee_id, original_filename)')
        .in('document_id', docIds)
        .order('chunk_index', { ascending: true });
      if (chunkErr) throw chunkErr;
      return (chunks || []).map(c => ({
        ...c,
        project_id: c.documents?.project_id || projectId,
        employee_id: c.documents?.employee_id || null,
        original_filename: c.documents?.original_filename || 'document.txt'
      }));
    }
    const projectDocs = mockDocuments.filter(d => d.project_id === projectId);
    const projectDocIds = new Set(projectDocs.map(d => d.id));
    const docMap = new Map(projectDocs.map(d => [d.id, d]));
    return mockDocumentChunks
      .filter(c => projectDocIds.has(c.document_id))
      .map(c => {
        const doc = docMap.get(c.document_id);
        return {
          ...c,
          project_id: doc ? doc.project_id : projectId,
          employee_id: doc ? doc.employee_id : null,
          original_filename: doc ? doc.original_filename : 'document.txt'
        };
      })
      .sort((a, b) => a.chunk_index - b.chunk_index);
  },

  async findDocumentByHash(projectId, fileHash) {
    if (!fileHash) return null;

    if (isConfigured) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('file_hash', fileHash)
        .maybeSingle();
      if (error) return null;
      return data;
    }

    return mockDocuments.find(d => d.project_id === projectId && d.file_hash === fileHash) || null;
  },

  async createDocument({ project_id, employee_id, original_filename, storage_path, mime_type, file_size, file_hash, extracted_text, processing_status, processing_error }) {
    if (isConfigured) {
      const payload = {
        project_id,
        employee_id: employee_id || null,
        original_filename,
        storage_path,
        mime_type,
        file_size,
        file_hash,
        extracted_text,
        processing_status: processing_status || 'uploaded',
        processing_error: processing_error || null
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([payload])
        .select(`
          *,
          projects ( id, name ),
          employees ( id, full_name, designation )
        `)
        .single();
      if (error) throw error;
      return data;
    }

    // Verify project exists
    if (!mockProjects.some(p => p.id === project_id)) {
      const err = new Error(`Project ID \"${project_id}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    // Verify employee if provided
    if (employee_id && !mockEmployees.some(e => e.id === employee_id)) {
      const err = new Error(`Employee ID \"${employee_id}\" does not exist.`);
      err.code = '23503';
      throw err;
    }

    const newDoc = {
      id: crypto.randomUUID(),
      project_id,
      employee_id: employee_id || null,
      original_filename,
      storage_path,
      mime_type,
      file_size,
      file_hash,
      extracted_text: extracted_text || null,
      processing_status: processing_status || 'uploaded',
      processing_error: processing_error || null,
      uploaded_at: new Date().toISOString()
    };
    mockDocuments.push(newDoc);

    const proj = mockProjects.find(p => p.id === project_id);
    const emp = employee_id ? mockEmployees.find(e => e.id === employee_id) : null;

    return {
      ...newDoc,
      projects: proj ? { id: proj.id, name: proj.name } : null,
      employees: emp ? { id: emp.id, full_name: emp.full_name, designation: emp.designation } : null
    };
  },

  async saveDocumentChunks(documentId, chunks = []) {
    if (chunks.length === 0) return [];

    if (isConfigured) {
      const payloads = chunks.map(c => ({
        document_id: documentId,
        chunk_index: c.chunk_index,
        extracted_content: c.extracted_content,
        page_number: c.page_number !== undefined ? c.page_number : null,
        section_reference: c.section_reference || null,
        is_ocr: Boolean(c.is_ocr)
      }));

      const { data, error } = await supabase
        .from('document_chunks')
        .insert(payloads)
        .select();
      if (error) throw error;
      return data;
    }

    const created = chunks.map(c => {
      const chunkObj = {
        id: crypto.randomUUID(),
        document_id: documentId,
        chunk_index: c.chunk_index,
        extracted_content: c.extracted_content,
        page_number: c.page_number !== undefined ? c.page_number : null,
        section_reference: c.section_reference || null,
        is_ocr: Boolean(c.is_ocr),
        created_at: new Date().toISOString()
      };
      mockDocumentChunks.push(chunkObj);
      return chunkObj;
    });

    return created;
  },

  async deleteDocument(id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockDocuments.findIndex(d => d.id === id);
    if (idx === -1) return null;

    // Delete associated chunks (ON DELETE CASCADE)
    mockDocumentChunks = mockDocumentChunks.filter(c => c.document_id !== id);
    const removed = mockDocuments.splice(idx, 1)[0];
    return removed;
  },

  // --------------------------------------------------------------------------
  // DASHBOARD AGGREGATE COUNTS
  // --------------------------------------------------------------------------
  async getDashboardStats() {
    if (isConfigured) {
      const [
        { count: deptCount, error: deptErr },
        { count: empCount, error: empErr },
        { count: projCount, error: projErr },
        { count: activeProjCount, error: activeErr },
        { count: pendingHandoverCount, error: handErr },
        { count: docCount, error: docErr }
      ] = await Promise.all([
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('employees').select('*', { count: 'exact', head: true }).in('employment_status', ['handover_pending', 'resigned']),
        supabase.from('documents').select('*', { count: 'exact', head: true })
      ]);

      if (deptErr || empErr || projErr) {
        console.warn('[HandoverIQ] Failed to query exact counts from Supabase:', deptErr || empErr || projErr);
      }

      return {
        departments: deptCount ?? 0,
        employees: empCount ?? 0,
        projects: projCount ?? 0,
        activeProjects: activeProjCount ?? 0,
        handoverPending: pendingHandoverCount ?? 0,
        documents: docCount ?? 0
      };
    }

    return {
      departments: mockDepartments.length,
      employees: mockEmployees.length,
      projects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === 'in_progress').length,
      handoverPending: mockEmployees.filter(e => e.employment_status === 'handover_pending' || e.employment_status === 'resigned').length,
      documents: mockDocuments.length,
      totalChunks: mockDocumentChunks.length
    };
  },

  // ---------------------------------------------------------------------------
  // KNOWLEDGE RECONSTRUCTION (PHASE 4)
  // ---------------------------------------------------------------------------
  async createKnowledgeAnalysis({ project_id, employee_id, model_name, analysis_summary, structured_result }) {
    if (isConfigured) {
      const payload = { project_id, employee_id, model_name, analysis_summary, structured_result, status: 'completed' };
      const { data, error } = await supabase.from('knowledge_analyses').insert([payload]).select().single();
      if (error) throw error;
      return data;
    }
    const newAnalysis = {
      id: crypto.randomUUID(),
      project_id,
      employee_id,
      status: 'completed',
      model_name,
      analysis_summary,
      structured_result,
      evidence_coverage: structured_result?.evidence_coverage || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!global.mockKnowledgeAnalyses) global.mockKnowledgeAnalyses = [];
    global.mockKnowledgeAnalyses.push(newAnalysis);
    return newAnalysis;
  },

  async getKnowledgeAnalysisById(id) {
    if (isConfigured) {
      const { data, error } = await supabase.from('knowledge_analyses').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }
    if (!global.mockKnowledgeAnalyses) return null;
    return global.mockKnowledgeAnalyses.find(a => a.id === id) || null;
  },

  async listKnowledgeAnalyses({ project_id, employee_id } = {}) {
    if (isConfigured) {
      let query = supabase.from('knowledge_analyses').select('*');
      if (project_id) query = query.eq('project_id', project_id);
      if (employee_id) query = query.eq('employee_id', employee_id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    if (!global.mockKnowledgeAnalyses) return [];
    let result = [...global.mockKnowledgeAnalyses];
    if (project_id) result = result.filter(a => a.project_id === project_id);
    if (employee_id) result = result.filter(a => a.employee_id === employee_id);
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async createKnowledgeFindings(analysis_id, findings = []) {
    if (!Array.isArray(findings) || findings.length === 0) return [];
    
    // Canonical finding_type validator & normalizer
    const validFindingTypes = new Set(['work_history', 'milestone', 'pending_task', 'risk_blocker', 'knowledge_gap', 'replacement_brief']);
    const safeType = (type) => {
      if (!type) return 'work_history';
      const clean = String(type).trim().toLowerCase();
      if (validFindingTypes.has(clean)) return clean;
      if (clean === 'risk' || clean === 'risks' || clean === 'risks_and_blockers' || clean === 'blocker' || clean === 'blockers') return 'risk_blocker';
      if (clean === 'task' || clean === 'tasks' || clean === 'pending_tasks') return 'pending_task';
      if (clean === 'milestones') return 'milestone';
      if (clean === 'work' || clean === 'history' || clean === 'employee_work_history') return 'work_history';
      if (clean === 'gap' || clean === 'gaps' || clean === 'knowledge_gaps') return 'knowledge_gap';
      if (clean === 'brief' || clean === 'briefing') return 'replacement_brief';
      return 'work_history';
    };

    if (isConfigured) {
      const payloads = findings.map(f => ({
        analysis_id,
        finding_type: safeType(f.finding_type),
        title: f.title,
        description: f.description,
        status: f.status || null,
        confidence: f.confidence || 'medium',
        evidence_references: f.evidence_references || [],
        review_status: 'needs_review',
        reviewed_by: null,
        reviewed_at: null
      }));
      const { data, error } = await supabase.from('knowledge_findings').insert(payloads).select();
      if (error) throw error;
      return data;
    }
    if (!global.mockKnowledgeFindings) global.mockKnowledgeFindings = [];
    const created = findings.map(f => {
      const newFinding = {
        id: crypto.randomUUID(),
        analysis_id,
        finding_type: safeType(f.finding_type),
        title: f.title,
        description: f.description,
        status: f.status || null,
        confidence: f.confidence || 'medium',
        grounding_status: f.grounding_status || (Array.isArray(f.evidence_references) && f.evidence_references.length > 0 ? 'grounded' : 'unsupported'),
        evidence_references: f.evidence_references || [],
        review_status: 'needs_review',
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      };
      global.mockKnowledgeFindings.push(newFinding);
      return newFinding;
    });
    return created;
  },

  async getKnowledgeFindingsByAnalysis(analysis_id) {
    if (isConfigured) {
      const { data, error } = await supabase.from('knowledge_findings').select('*').eq('analysis_id', analysis_id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    if (!global.mockKnowledgeFindings) return [];
    return global.mockKnowledgeFindings.filter(f => f.analysis_id === analysis_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async reviewKnowledgeFinding(finding_id, { review_status, reviewed_by, reviewer_notes }) {
    if (isConfigured) {
      const payload = { review_status, reviewed_by: reviewed_by || null, reviewed_at: new Date().toISOString(), reviewer_notes: reviewer_notes || null };
      const { data, error } = await supabase.from('knowledge_findings').update(payload).eq('id', finding_id).select().single();
      if (error) throw error;
      return data;
    }
    if (!global.mockKnowledgeFindings) return null;
    const idx = global.mockKnowledgeFindings.findIndex(f => f.id === finding_id);
    if (idx === -1) return null;
    const f = global.mockKnowledgeFindings[idx];
    f.review_status = review_status;
    f.reviewed_by = reviewed_by || null;
    f.reviewed_at = new Date().toISOString();
    f.reviewer_notes = reviewer_notes || null;
    return f;
  },

  // ---------------------------------------------------------------------------
  // HANDOVER PACKAGES & REPLACEMENTS (PHASE 5)
  // ---------------------------------------------------------------------------
  async createHandoverPackage({ analysis_id, departing_employee_id, project_id, package_summary, package_content, created_by }) {
    const validStatuses = ['draft', 'under_review', 'approved', 'assigned', 'in_progress', 'completed', 'rejected'];
    const initialStatus = 'draft';

    if (isConfigured) {
      const payload = {
        analysis_id,
        departing_employee_id,
        project_id,
        status: initialStatus,
        package_summary: package_summary || null,
        package_content: package_content || {}
      };
      const { data, error } = await supabase.from('handover_packages').insert([payload]).select().single();
      if (error) throw error;

      // Record initial status history
      await supabase.from('handover_status_history').insert([{
        package_id: data.id,
        status: initialStatus,
        changed_by: created_by || 'system'
      }]);

      return data;
    }

    if (!global.mockHandoverPackages) global.mockHandoverPackages = [];
    if (!global.mockHandoverStatusHistory) global.mockHandoverStatusHistory = [];

    const newPkg = {
      id: crypto.randomUUID(),
      analysis_id,
      departing_employee_id,
      project_id,
      status: initialStatus,
      package_summary: package_summary || '',
      package_content: package_content || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    global.mockHandoverPackages.push(newPkg);

    global.mockHandoverStatusHistory.push({
      id: crypto.randomUUID(),
      package_id: newPkg.id,
      status: initialStatus,
      changed_by: created_by || 'Manager',
      changed_at: new Date().toISOString()
    });

    return newPkg;
  },

  _normalizeHandoverPackage(pkg) {
    if (!pkg) return null;
    // Departing employee
    const departingEmployee = pkg.departing_employee || pkg.employees || null;

    // Handle package_assignments which PostgREST returns as an object (single record due to UNIQUE(package_id)) or array
    let rawAssignment = pkg.assignment || null;
    let rawList = [];

    if (Array.isArray(pkg.package_assignments)) {
      rawList = pkg.package_assignments;
      if (!rawAssignment && rawList.length > 0) {
        rawAssignment = rawList[0];
      }
    } else if (pkg.package_assignments && typeof pkg.package_assignments === 'object') {
      // PostgREST 1:1 relation returns an object, not an array
      if (!rawAssignment) {
        rawAssignment = pkg.package_assignments;
      }
      rawList = [pkg.package_assignments];
    } else if (rawAssignment) {
      rawList = [rawAssignment];
    }

    let assignment = null;
    if (rawAssignment) {
      const repEmp = rawAssignment.replacement_employee || rawAssignment.employees || null;
      assignment = {
        ...rawAssignment,
        replacement_employee: repEmp,
        employees: repEmp
      };
    }

    const packageAssignments = rawList.map(a => {
      const repEmp = a.replacement_employee || a.employees || null;
      return {
        ...a,
        replacement_employee: repEmp,
        employees: repEmp
      };
    });

    return {
      ...pkg,
      departing_employee: departingEmployee,
      employees: departingEmployee,
      assignment,
      package_assignments: packageAssignments
    };
  },

  async listHandoverPackages({ project_id, departing_employee_id, status } = {}) {
    if (isConfigured) {
      let query = supabase.from('handover_packages').select(`
        *,
        projects ( id, name ),
        departing_employee:departing_employee_id ( id, full_name, designation, email ),
        package_assignments (
          id,
          replacement_employee_id,
          assigned_at,
          replacement_employee:replacement_employee_id ( id, full_name, designation, email )
        )
      `);
      if (project_id) query = query.eq('project_id', project_id);
      if (departing_employee_id) query = query.eq('departing_employee_id', departing_employee_id);
      if (status) query = query.eq('status', status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(pkg => this._normalizeHandoverPackage(pkg));
    }

    if (!global.mockHandoverPackages) global.mockHandoverPackages = [];
    let list = [...global.mockHandoverPackages];
    if (project_id) list = list.filter(p => p.project_id === project_id);
    if (departing_employee_id) list = list.filter(p => p.departing_employee_id === departing_employee_id);
    if (status) list = list.filter(p => p.status === status);

    return list.map(pkg => {
      const proj = mockProjects.find(p => p.id === pkg.project_id);
      const emp = mockEmployees.find(e => e.id === pkg.departing_employee_id);
      const assignment = (global.mockPackageAssignments || []).find(a => a.package_id === pkg.id);
      let replacement = null;
      if (assignment) {
        const repEmp = mockEmployees.find(e => e.id === assignment.replacement_employee_id);
        replacement = repEmp ? { id: repEmp.id, full_name: repEmp.full_name, designation: repEmp.designation } : null;
      }
      return this._normalizeHandoverPackage({
        ...pkg,
        projects: proj ? { id: proj.id, name: proj.name } : null,
        departing_employee: emp ? { id: emp.id, full_name: emp.full_name, designation: emp.designation, email: emp.email } : null,
        assignment: assignment ? { ...assignment, replacement_employee: replacement, employees: replacement } : null
      });
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getHandoverPackageById(id) {
    if (isConfigured) {
      const { data, error } = await supabase.from('handover_packages').select(`
        *,
        projects ( id, name, description ),
        departing_employee:departing_employee_id ( id, full_name, designation, email ),
        package_assignments (
          id,
          replacement_employee_id,
          assigned_at,
          replacement_employee:replacement_employee_id ( id, full_name, designation, email )
        )
      `).eq('id', id).single();
      if (error) throw error;
      return this._normalizeHandoverPackage(data);
    }

    if (!global.mockHandoverPackages) return null;
    const pkg = global.mockHandoverPackages.find(p => p.id === id);
    if (!pkg) return null;

    const proj = mockProjects.find(p => p.id === pkg.project_id);
    const emp = mockEmployees.find(e => e.id === pkg.departing_employee_id);
    const assignment = (global.mockPackageAssignments || []).find(a => a.package_id === pkg.id);
    let replacement = null;
    if (assignment) {
      const repEmp = mockEmployees.find(e => e.id === assignment.replacement_employee_id);
      replacement = repEmp ? { id: repEmp.id, full_name: repEmp.full_name, designation: repEmp.designation, email: repEmp.email } : null;
    }

    return this._normalizeHandoverPackage({
      ...pkg,
      projects: proj ? { id: proj.id, name: proj.name, description: proj.description } : null,
      departing_employee: emp ? { id: emp.id, full_name: emp.full_name, designation: emp.designation, email: emp.email } : null,
      assignment: assignment ? { ...assignment, replacement_employee: replacement, employees: replacement } : null
    });
  },

  async updateHandoverPackageStatus(package_id, newStatus, changed_by) {
    const validStatuses = ['draft', 'under_review', 'approved', 'assigned', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Invalid status: ${newStatus}. Allowed: ${validStatuses.join(', ')}`);
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (isConfigured) {
      const { data, error } = await supabase
        .from('handover_packages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', package_id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('handover_status_history').insert([{
        package_id,
        status: newStatus,
        changed_by: changed_by || 'Manager'
      }]);

      return data;
    }

    if (!global.mockHandoverPackages) return null;
    const pkg = global.mockHandoverPackages.find(p => p.id === package_id);
    if (!pkg) return null;

    pkg.status = newStatus;
    pkg.updated_at = new Date().toISOString();

    if (!global.mockHandoverStatusHistory) global.mockHandoverStatusHistory = [];
    global.mockHandoverStatusHistory.push({
      id: crypto.randomUUID(),
      package_id,
      status: newStatus,
      changed_by: changed_by || 'Manager',
      changed_at: new Date().toISOString()
    });

    return pkg;
  },

  async assignReplacementEmployee(package_id, replacement_employee_id) {
    if (isConfigured) {
      // Check if assignment exists
      const { data: existing } = await supabase
        .from('package_assignments')
        .select('*')
        .eq('package_id', package_id)
        .maybeSingle();

      if (existing) {
        const err = new Error('Handover package is already assigned to a replacement employee.');
        err.code = 'DUPLICATE_ASSIGNMENT';
        throw err;
      }

      const { data, error } = await supabase
        .from('package_assignments')
        .insert([{ package_id, replacement_employee_id }])
        .select(`
          *,
          replacement_employee:replacement_employee_id ( id, full_name, designation, email )
        `)
        .single();
      if (error) throw error;

      // Update package status to assigned
      await this.updateHandoverPackageStatus(package_id, 'assigned', 'Manager');
      const repEmp = data.replacement_employee || data.employees || null;
      return {
        ...data,
        employees: repEmp,
        replacement_employee: repEmp
      };
    }

    if (!global.mockPackageAssignments) global.mockPackageAssignments = [];
    const existing = global.mockPackageAssignments.find(a => a.package_id === package_id);
    if (existing) {
      const err = new Error('Handover package is already assigned to a replacement employee.');
      err.code = 'DUPLICATE_ASSIGNMENT';
      throw err;
    }

    const assignment = {
      id: crypto.randomUUID(),
      package_id,
      replacement_employee_id,
      assigned_at: new Date().toISOString()
    };
    global.mockPackageAssignments.push(assignment);

    await this.updateHandoverPackageStatus(package_id, 'assigned', 'Manager');

    const repEmp = mockEmployees.find(e => e.id === replacement_employee_id);
    const replacement = repEmp ? { id: repEmp.id, full_name: repEmp.full_name, designation: repEmp.designation, email: repEmp.email } : null;
    return {
      ...assignment,
      employees: replacement,
      replacement_employee: replacement
    };
  },

  async getHandoverStatusHistory(package_id) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('handover_status_history')
        .select('*')
        .eq('package_id', package_id)
        .order('changed_at', { ascending: true });
      if (error) throw error;
      return data;
    }

    if (!global.mockHandoverStatusHistory) return [];
    return global.mockHandoverStatusHistory
      .filter(h => h.package_id === package_id)
      .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  }
};

export const repository = db;
export default db;
