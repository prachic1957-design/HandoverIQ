import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  ArrowRight,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function ProjectsView() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  // Project Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Member Form
  const [memberEmployeeId, setMemberEmployeeId] = useState('');
  const [memberResponsibility, setMemberResponsibility] = useState('');
  const [memberWorkStatus, setMemberWorkStatus] = useState('in_progress');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/employees`)
      ]);

      const projData = await projRes.json();
      const empData = await empRes.json();

      if (projData.success) {
        setProjects(projData.data);
        // If a project was selected, refresh its details too
        if (selectedProject) {
          const updated = projData.data.find(p => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        }
      } else {
        throw new Error(projData.error || 'Failed to fetch projects');
      }

      if (empData.success) {
        setEmployees(empData.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open Add Project Modal
  const handleOpenAddProject = () => {
    setName('');
    setDescription('');
    setStatus('in_progress');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setShowAddProjectModal(true);
  };

  // Open Edit Project Modal
  const handleOpenEditProject = (proj, e) => {
    if (e) e.stopPropagation();
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setStatus(proj.status);
    setStartDate(proj.start_date || '');
    setEndDate(proj.end_date || '');
  };

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, start_date: startDate, end_date: endDate })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to create project');
      }

      setSuccess(`Project "${data.data.name}" created successfully.`);
      setShowAddProjectModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update Project
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject || !name.trim()) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, start_date: startDate, end_date: endDate })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to update project');
      }

      setSuccess(`Project "${data.data.name}" updated successfully.`);
      setEditingProject(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${deletingProject.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to delete project');
      }

      setSuccess(`Project "${deletingProject.name}" deleted successfully.`);
      if (selectedProject?.id === deletingProject.id) {
        setSelectedProject(null);
      }
      setDeletingProject(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
      setDeletingProject(null);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Add Member Modal
  const handleOpenAddMember = () => {
    // Filter out employees already assigned to this project
    const assignedIds = (selectedProject?.project_members || []).map(m => m.employee_id);
    const available = employees.filter(e => !assignedIds.includes(e.id));
    setMemberEmployeeId(available[0]?.id || '');
    setMemberResponsibility('');
    setMemberWorkStatus('in_progress');
    setShowAddMemberModal(true);
  };

  // Add Member to Project
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedProject || !memberEmployeeId || !memberResponsibility.trim()) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: memberEmployeeId,
          responsibility: memberResponsibility,
          work_status: memberWorkStatus
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to assign team member');
      }

      setSuccess('Team member assigned to project with responsibilities.');
      setShowAddMemberModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Remove Member from Project
  const handleRemoveMember = async () => {
    if (!selectedProject || !deletingMember) return;

    setFormSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProject.id}/members/${deletingMember.employee_id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to remove member');
      }

      setSuccess('Member assignment removed from project.');
      setDeletingMember(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
      setDeletingMember(null);
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'planning':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Planning</span>;
      case 'on_hold':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">On Hold</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">{st}</span>;
    }
  };

  const getWorkStatusBadge = (ws) => {
    switch (ws) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">In Progress</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Pending</span>;
      case 'blocked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Blocked</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">{ws}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project & Responsibility Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track deliverables, map employee responsibilities, and identify critical handover deliverables.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddProject}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
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

      {/* Main Grid: Projects List + Selected Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects Overview List */}
        <div className="lg:col-span-1 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Projects ({projects.length})</span>
              <button
                onClick={fetchData}
                className="p-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh projects"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[620px]">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                <span className="text-xs">Loading projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Briefcase className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                <span>No projects match filters.</span>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = selectedProject?.id === p.id;
                const memberCount = (p.project_members || []).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-4 border-l-blue-500 text-white'
                        : 'hover:bg-[#0E172E]/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-xs text-white line-clamp-1">{p.name}</h4>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'No description provided'}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span>{memberCount} staff assigned</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditProject(p, e)}
                          className="p-1 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingProject(p); }}
                          className="p-1 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Project Details & Assigned Responsibilities */}
        <div className="lg:col-span-2 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg p-6">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white">{selectedProject.name}</h3>
                    {getStatusBadge(selectedProject.status)}
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                    {selectedProject.description || 'No detailed description available.'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Start: {selectedProject.start_date || 'N/A'}
                    </span>
                    {selectedProject.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Target End: {selectedProject.end_date}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleOpenAddMember}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold self-start sm:self-auto shadow-sm shadow-blue-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Employee</span>
                </button>
              </div>

              {/* Assigned Team Members Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Assigned Team Responsibilities & Work Status
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Specific ownership mapped to each individual for AI handover dossier generation.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {(selectedProject.project_members || []).length} Members
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0E172E]/60">
                        <th className="py-2.5 px-3">Team Member</th>
                        <th className="py-2.5 px-3">Assigned Responsibility</th>
                        <th className="py-2.5 px-3">Work Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {(!selectedProject.project_members || selectedProject.project_members.length === 0) ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-400">
                            <Users className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                            <p className="font-medium text-slate-300">No employees assigned to this project yet.</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Click "Assign Employee" to map deliverables and responsibilities.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        selectedProject.project_members.map((member) => (
                          <tr key={member.id} className="hover:bg-[#0E172E]/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white">{member.employees?.full_name || 'Unknown'}</div>
                              <div className="text-[11px] text-slate-400">{member.employees?.designation}</div>
                              <div className="text-[10px] text-blue-400 font-mono">{member.employees?.departments?.name}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-200 max-w-xs">
                              <p className="text-xs leading-relaxed">{member.responsibility}</p>
                            </td>
                            <td className="py-3 px-3">
                              {getWorkStatusBadge(member.work_status)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setDeletingMember(member)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="Remove assignment"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h4 className="font-bold text-white text-base">Select a Project to Inspect</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Choose any project from the left column to view its assigned employees, their exact ownership responsibilities, and work deliverables.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Project Modal */}
      {(showAddProjectModal || editingProject) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E172E] border border-slate-700 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>{editingProject ? 'Edit Project' : 'Create New Enterprise Project'}</span>
              </h3>
              <button
                onClick={() => { setShowAddProjectModal(false); setEditingProject(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Infrastructure Migration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows="3"
                  placeholder="Outline objectives, tech stack, and deliverable targets..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddProjectModal(false); setEditingProject(null); }}
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
                  <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0E172E] border border-slate-700 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Assign Employee to Project</span>
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Employee <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={memberEmployeeId}
                  onChange={(e) => setMemberEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.designation} - {emp.departments?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Responsibility / Ownership <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Lead architect for VPC peering and CI/CD automation pipelines..."
                  value={memberResponsibility}
                  onChange={(e) => setMemberResponsibility(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Deliverable Work Status
                </label>
                <select
                  value={memberWorkStatus}
                  onChange={(e) => setMemberWorkStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
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
                  <span>Assign to Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0E172E] border border-rose-500/30 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Project?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deletingProject.name}"</strong>? All associated member responsibility assignments will also be deleted.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
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

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0E172E] border border-rose-500/30 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <UserMinus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Remove Team Member?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Remove <strong className="text-white">"{deletingMember.employees?.full_name}"</strong> from this project? Their recorded responsibility history on this project will be detached.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingMember(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={formSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
