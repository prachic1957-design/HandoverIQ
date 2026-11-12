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

// Helper to sanitize employee record based on HR authorization
function sanitizeEmployee(emp, isHR = false) {
  if (!emp) return null;
  const clone = { ...emp };
  if (!isHR) {
    delete clone.salary;
  }
  return clone;
}

// ==============================================================================
// REPOSITORY IMPLEMENTATION
// ==============================================================================
export const db = {
  // ----------------------------------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------------------------------
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
      const err = new Error(`Department with name "${trimmedName}" already exists.`);
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
        const err = new Error(`Department with name "${trimmed}" already exists.`);
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
      // Check if employees exist in this department (ON DELETE RESTRICT)
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

    // Check if any mock employee belongs to this department
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

  // ----------------------------------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------------------------------
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

    // Validate foreign key
    if (!mockDepartments.some(d => d.id === department_id)) {
      const err = new Error(`Department ID "${department_id}" does not exist.`);
      err.code = '23503';
      throw err;
    }

    // Validate unique email
    const cleanEmail = email.trim().toLowerCase();
    if (mockEmployees.some(e => e.email.toLowerCase() === cleanEmail)) {
      const err = new Error(`Employee with email "${cleanEmail}" already exists.`);
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
      const err = new Error(`Department ID "${updates.department_id}" does not exist.`);
      err.code = '23503';
      throw err;
    }

    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const conflict = mockEmployees.some(e => e.id !== id && e.email.toLowerCase() === cleanEmail);
      if (conflict) {
        const err = new Error(`Employee with email "${cleanEmail}" already exists.`);
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

    // Remove from project_members first
    mockProjectMembers = mockProjectMembers.filter(m => m.employee_id !== id);
    const removed = mockEmployees.splice(idx, 1)[0];
    return removed;
  },

  // ----------------------------------------------------------------------------
  // PROJECTS
  // ----------------------------------------------------------------------------
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

    // Delete associated members (ON DELETE CASCADE)
    mockProjectMembers = mockProjectMembers.filter(m => m.project_id !== id);
    const removed = mockProjects.splice(idx, 1)[0];
    return removed;
  },

  // ----------------------------------------------------------------------------
  // PROJECT MEMBERS
  // ----------------------------------------------------------------------------
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

    // Verify project exists
    if (!mockProjects.some(p => p.id === projectId)) {
      const err = new Error(`Project ID "${projectId}" does not exist.`);
      err.code = '23503';
      throw err;
    }

    // Verify employee exists
    const emp = mockEmployees.find(e => e.id === employee_id);
    if (!emp) {
      const err = new Error(`Employee ID "${employee_id}" does not exist.`);
      err.code = '23503';
      throw err;
    }

    // Check unique (project_id, employee_id)
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

  // ----------------------------------------------------------------------------
  // DASHBOARD AGGREGATE COUNTS
  // ----------------------------------------------------------------------------
  async getDashboardStats() {
    if (isConfigured) {
      const [
        { count: deptCount, error: deptErr },
        { count: empCount, error: empErr },
        { count: projCount, error: projErr },
        { count: activeProjCount, error: activeErr },
        { count: pendingHandoverCount, error: handErr }
      ] = await Promise.all([
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('employees').select('*', { count: 'exact', head: true }).in('employment_status', ['handover_pending', 'resigned'])
      ]);

      if (deptErr || empErr || projErr) {
        console.warn('[HandoverIQ] Failed to query exact counts from Supabase:', deptErr || empErr || projErr);
      }

      return {
        departments: deptCount ?? 0,
        employees: empCount ?? 0,
        projects: projCount ?? 0,
        activeProjects: activeProjCount ?? 0,
        handoverPending: pendingHandoverCount ?? 0
      };
    }

    return {
      departments: mockDepartments.length,
      employees: mockEmployees.length,
      projects: mockProjects.length,
      activeProjects: mockProjects.filter(p => p.status === 'in_progress').length,
      handoverPending: mockEmployees.filter(e => e.employment_status === 'handover_pending' || e.employment_status === 'resigned').length
    };
  }
};
