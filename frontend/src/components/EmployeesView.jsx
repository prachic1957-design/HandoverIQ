import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Unlock,
  Shield,
  Building2,
  X,
  Filter
} from 'lucide-react';

export default function EmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isHRMode, setIsHRMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [deletingEmp, setDeletingEmp] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('active');
  const [salary, setSalary] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (isHRMode) {
        headers['Authorization'] = 'Bearer roguenova-hr-authorized-passcode';
      }

      const [empRes, deptRes] = await Promise.all([
        fetch(`${API_BASE}/employees`, { headers }),
        fetch(`${API_BASE}/departments`)
      ]);

      const empData = await empRes.json();
      const deptData = await deptRes.json();

      if (empData.success) {
        setEmployees(empData.data);
      } else {
        throw new Error(empData.error || 'Failed to fetch employees');
      }

      if (deptData.success) {
        setDepartments(deptData.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isHRMode]);

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !selectedDept || emp.department_id === selectedDept;
    const matchesStatus = !selectedStatus || emp.employment_status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setFullName('');
    setEmail('');
    setDesignation('');
    setDepartmentId(departments[0]?.id || '');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setEmploymentStatus('active');
    setSalary('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setFullName(emp.full_name);
    setEmail(emp.email);
    setDesignation(emp.designation);
    setDepartmentId(emp.department_id);
    setJoiningDate(emp.joining_date || '');
    setEmploymentStatus(emp.employment_status || 'active');
    setSalary(emp.salary !== undefined && emp.salary !== null ? String(emp.salary) : '');
  };

  // Handle Create
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !designation.trim() || !departmentId) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isHRMode) {
        headers['Authorization'] = 'Bearer roguenova-hr-authorized-passcode';
      }

      const payload = {
        full_name: fullName,
        email,
        designation,
        department_id: departmentId,
        joining_date: joiningDate,
        employment_status: employmentStatus
      };

      if (isHRMode && salary) {
        payload.salary = Number(salary);
      }

      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to create employee');
      }

      setSuccess(`Employee "${data.data.full_name}" registered successfully.`);
      setShowAddModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isHRMode) {
        headers['Authorization'] = 'Bearer roguenova-hr-authorized-passcode';
      }

      const payload = {
        full_name: fullName,
        email,
        designation,
        department_id: departmentId,
        joining_date: joiningDate,
        employment_status: employmentStatus
      };

      if (isHRMode && salary !== '') {
        payload.salary = Number(salary);
      }

      const res = await fetch(`${API_BASE}/employees/${editingEmp.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to update employee');
      }

      setSuccess(`Employee "${data.data.full_name}" updated successfully.`);
      setEditingEmp(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deletingEmp) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/employees/${deletingEmp.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to delete employee');
      }

      setSuccess(`Employee "${deletingEmp.full_name}" removed successfully.`);
      setDeletingEmp(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
      setDeletingEmp(null);
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>;
      case 'handover_pending':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Handover Pending</span>;
      case 'handover_completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Handover Completed</span>;
      case 'resigned':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Resigned</span>;
      case 'terminated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Terminated</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & HR Privacy Shield */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Employee Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff directory, department assignments, and knowledge transition states.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* HR Salary Access Toggle */}
          <button
            onClick={() => setIsHRMode(!isHRMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
              isHRMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-[#0E172E] border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
            title="Toggle authorized HR role mode (Controls access to confidential salary field)"
          >
            {isHRMode ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>HR Confidential Mode: <strong>Active</strong></span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>HR Salary Shield: <strong>Protected</strong></span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Salary Security Guard Notice */}
      <div className="p-3.5 rounded-lg bg-[#0E172E] border border-blue-500/20 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Confidentiality Enforced:</strong> Sensitive compensation data is isolated to HR views on the backend and is <strong>never passed to AI reconstruction models</strong>.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">Backend RBAC Enabled</span>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="handover_pending">Handover Pending</option>
              <option value="handover_completed">Handover Completed</option>
              <option value="resigned">Resigned</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Showing: <strong className="text-white">{filteredEmployees.length}</strong> of {employees.length}</span>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh employee data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0E172E]/50">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Compensation (Salary)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Loading employees...</span>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">No employees match criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {search || selectedDept || selectedStatus ? 'Try clearing your filters' : 'Add the first employee to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#0E172E]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{emp.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {emp.designation}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0E172E] text-slate-300 border border-slate-700">
                        <Building2 className="w-3 h-3 text-blue-400" />
                        <span>{emp.departments?.name || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {emp.joining_date || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(emp.employment_status)}
                    </td>
                    <td className="py-3 px-4">
                      {isHRMode && emp.salary !== undefined ? (
                        <span className="font-mono font-semibold text-emerald-400">
                          ${Number(emp.salary).toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/80">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Restricted (HR Shield)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingEmp(emp)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingEmp) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E172E] border border-slate-700 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{editingEmp ? 'Edit Employee Profile' : 'Register New Employee'}</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingEmp(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingEmp ? handleUpdate : handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.jenkins@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Designation / Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Cloud Architect"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="handover_pending">Handover Pending</option>
                    <option value="handover_completed">Handover Completed</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Salary Field (Available only when HR mode is active) */}
              <div className="p-3.5 rounded-lg bg-[#0B1020] border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Annual Compensation / Salary (USD)</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">HR Protected</span>
                </div>
                {isHRMode ? (
                  <input
                    type="number"
                    placeholder="e.g. 145000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E172E] border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Field locked. Activate HR Confidential Mode to set or edit salary.</span>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingEmp(null); }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingEmp ? 'Save Changes' : 'Register Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0E172E] border border-rose-500/30 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Employee?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{deletingEmp.full_name}"</strong> from HandoverIQ? This will also remove their project assignments.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingEmp(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={formSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

