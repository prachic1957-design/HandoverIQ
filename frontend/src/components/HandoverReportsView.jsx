import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Eye,
  RefreshCw,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export default function HandoverReportsView() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [packages, setPackages] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const [pkgRes, anaRes, empRes] = await Promise.all([
        fetch(`${apiBase}/handovers`),
        fetch(`${apiBase}/knowledge/analyses`),
        fetch(`${apiBase}/employees`)
      ]);

      const [pkgs, anas, emps] = await Promise.all([
        pkgRes.json(),
        anaRes.json(),
        empRes.json()
      ]);

      const packageList = Array.isArray(pkgs) ? pkgs : (Array.isArray(pkgs?.data) ? pkgs.data : []);
      const analysisList = Array.isArray(anas) ? anas : (Array.isArray(anas?.data) ? anas.data : []);
      const employeeList = Array.isArray(emps?.data) ? emps.data : (Array.isArray(emps) ? emps : []);

      setPackages(packageList);
      setAnalyses(analysisList);
      setEmployees(employeeList);
      if (packageList.length > 0 && !selectedPackage) {
        loadPackageDetails(packageList[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load handover packages or reference data');
    } finally {
      setLoading(false);
    }
  };

  const loadPackageDetails = async (packageId) => {
    try {
      setActionLoading(true);
      const [pkgRes, briefRes, histRes] = await Promise.all([
        fetch(`${apiBase}/handovers/${packageId}`),
        fetch(`${apiBase}/handovers/${packageId}/briefing`),
        fetch(`${apiBase}/handovers/${packageId}/history`)
      ]);

      const [pkgData, briefData, histData] = await Promise.all([
        pkgRes.json(),
        briefRes.json(),
        histRes.json()
      ]);

      setSelectedPackage(pkgData);
      setBriefing(briefData);
      setHistory(Array.isArray(histData) ? histData : []);
      setNewStatus(pkgData.status);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch package details or briefing');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = async () => {
    if (!selectedAnalysisId) {
      setError('Please select a completed AI knowledge analysis');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await fetch(`${apiBase}/handovers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: selectedAnalysisId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compile handover package');

      setSuccessMsg('Handover package compiled successfully.');
      setSelectedAnalysisId('');
      await fetchPackages();
      await loadPackageDetails(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedPackage || !newStatus) return;
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await fetch(`${apiBase}/handovers/${selectedPackage.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, changed_by: 'Manager' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');

      setSuccessMsg(`Status updated to "${newStatus}"`);
      await fetchPackages();
      await loadPackageDetails(selectedPackage.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignReplacement = async () => {
    if (!selectedPackage || !selectedReplacementId) {
      setError('Select a successor replacement employee');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await fetch(`${apiBase}/handovers/${selectedPackage.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacement_employee_id: selectedReplacementId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');

      if (!data.assignment?.replacement_employee && !data.assignment?.employees) {
        console.warn('[HandoverIQ] Assignment response missing nested replacement_employee:', data);
      }

      setSuccessMsg(data.message || 'Replacement employee assigned successfully.');
      setSelectedReplacementId('');
      await fetchPackages();
      await loadPackageDetails(selectedPackage.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getSuccessor = (pkg) => {
    if (!pkg) return null;
    return (
      pkg.assignment?.replacement_employee ||
      pkg.assignment?.employees ||
      (Array.isArray(pkg.package_assignments) && (
        pkg.package_assignments[0]?.replacement_employee ||
        pkg.package_assignments[0]?.employees
      )) ||
      null
    );
  };

  const getPredecessor = (pkg) => {
    if (!pkg) return null;
    return pkg.departing_employee || pkg.employees || null;
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'bg-slate-700 text-slate-300 border-slate-600',
      under_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      assigned: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_progress: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      completed: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${map[status] || map.draft}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#14213D]/70 border border-slate-800/80 p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Handover Packages & Management (Phase 5)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manager-reviewed handover dossiers, replacement matching & Day-1 briefing</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPackages}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Compile Handover Package Form */}
      <div className="rounded-xl bg-[#14213D]/60 border border-slate-800/80 p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-400" />
          Compile New Handover Package from AI Analysis
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedAnalysisId}
            onChange={(e) => setSelectedAnalysisId(e.target.value)}
            className="flex-1 bg-[#0E172E] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select Completed Knowledge Analysis --</option>
            {analyses.map(a => (
              <option key={a.id} value={a.id}>
                Analysis #{a.id.slice(0, 8)} - Model: {a.model_name} ({new Date(a.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button
            onClick={handleCreatePackage}
            disabled={actionLoading || !selectedAnalysisId}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compile Package</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Package List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Package Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Active Packages ({packages.length})
          </div>
          {packages.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#14213D]/40 border border-slate-800 text-center text-xs text-slate-400">
              No handover packages compiled yet. Run an AI Knowledge Reconstruction and compile a package above.
            </div>
          ) : (
            packages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => loadPackageDetails(pkg.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedPackage?.id === pkg.id
                    ? 'bg-[#14213D] border-blue-500/50 shadow-md'
                    : 'bg-[#14213D]/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {pkg.projects?.name || 'Project'}
                  </span>
                  {getStatusBadge(pkg.status)}
                </div>
                <div className="text-[11px] text-slate-300">
                  Predecessor: <span className="font-semibold text-slate-100">{getPredecessor(pkg)?.full_name || 'N/A'}</span>
                </div>
                {(() => {
                  const successor = getSuccessor(pkg);
                  return successor ? (
                    <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3" />
                      <span>Assigned: {successor.full_name}</span>
                    </div>
                  ) : null;
                })()}
                <div className="text-[10px] text-slate-500 mt-2">
                  Created {new Date(pkg.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Package Detail & Day-1 Briefing (8 cols) */}
        <div className="lg:col-span-8">
          {selectedPackage ? (
            <div className="space-y-6">
              {/* Management Actions & Status Ribbon */}
              <div className="rounded-xl bg-[#14213D]/80 border border-slate-800/80 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedPackage.projects?.name}</span>
                      {getStatusBadge(selectedPackage.status)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Package ID: {selectedPackage.id}</p>
                  </div>

                  {/* Status update control */}
                  <div className="flex items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="bg-[#0E172E] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none"
                    >
                      <option value="draft">draft</option>
                      <option value="under_review">under_review</option>
                      <option value="approved">approved</option>
                      <option value="assigned">assigned</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="rejected">rejected</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Replacement Assignment Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Successor Assignment:</span>
                    {(() => {
                      const successor = getSuccessor(selectedPackage);
                      return successor ? (
                        <span className="ml-2 text-xs font-bold text-emerald-400">
                          {successor.full_name} ({successor.designation})
                        </span>
                      ) : (
                        <span className="ml-2 text-xs text-amber-400 font-medium">Unassigned</span>
                      );
                    })()}
                  </div>

                  {!getSuccessor(selectedPackage) && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={selectedReplacementId}
                        onChange={(e) => setSelectedReplacementId(e.target.value)}
                        className="bg-[#0E172E] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none w-full sm:w-auto"
                      >
                        <option value="">-- Select Replacement Employee --</option>
                        {employees
                          .filter(e => e.id !== (selectedPackage.departing_employee_id || getPredecessor(selectedPackage)?.id))
                          .map(e => (
                            <option key={e.id} value={e.id}>
                              {e.full_name} ({e.designation})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleAssignReplacement}
                        disabled={actionLoading || !selectedReplacementId}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Day-1 Briefing Card */}
              {briefing && (
                <div className="rounded-xl bg-[#14213D]/70 border border-slate-800/80 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      Day-1 Replacement Briefing
                    </h4>
                    <span className="text-xs text-slate-400">
                      Verified Findings: <strong className="text-emerald-400">{briefing.verification_status?.total_verified_findings}</strong>
                    </span>
                  </div>

                  {/* Summary */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-300">Executive Summary</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-[#0E172E] p-3 rounded-lg border border-slate-800">
                      {briefing.summary}
                    </p>
                  </div>

                  {/* Successor Notification */}
                  {(briefing.successor || getSuccessor(selectedPackage)) && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        Assigned Successor: <strong className="text-white">{(briefing.successor || getSuccessor(selectedPackage)).full_name}</strong> ({ (briefing.successor || getSuccessor(selectedPackage)).designation })
                      </span>
                    </div>
                  )}

                  {/* Predecessor Responsibilities */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-300">Predecessor Handled Responsibilities</h5>
                    <p className="text-xs text-slate-400 mt-1">
                      {briefing.day_one_briefing?.predecessor_role}
                    </p>
                  </div>

                  {/* Verified Milestones & Tasks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-[#0E172E] border border-slate-800">
                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                        Verified Completed Work
                      </h5>
                      {briefing.day_one_briefing?.completed_milestones?.length === 0 ? (
                        <p className="text-xs text-slate-500">No approved completed milestones found.</p>
                      ) : (
                        <ul className="space-y-2 text-xs text-slate-300">
                          {briefing.day_one_briefing.completed_milestones.map((m, idx) => (
                            <li key={idx} className="border-l-2 border-emerald-500 pl-2">
                              <div className="font-semibold text-white">{m.title}</div>
                              <div className="text-[11px] text-slate-400">{m.description}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-[#0E172E] border border-slate-800">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                        Critical Pending Deliverables
                      </h5>
                      {briefing.day_one_briefing?.critical_pending_tasks?.length === 0 ? (
                        <p className="text-xs text-slate-500">No approved pending tasks found.</p>
                      ) : (
                        <ul className="space-y-2 text-xs text-slate-300">
                          {briefing.day_one_briefing.critical_pending_tasks.map((t, idx) => (
                            <li key={idx} className="border-l-2 border-amber-500 pl-2">
                              <div className="font-semibold text-white">{t.title}</div>
                              <div className="text-[11px] text-slate-400">{t.description}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Next Steps Guidance */}
                  <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs">
                    <span className="font-bold text-blue-400">Actionable Next Steps: </span>
                    <span className="text-slate-200">{briefing.day_one_briefing?.actionable_next_steps}</span>
                  </div>
                </div>
              )}

              {/* Status History Audit Trail */}
              <div className="rounded-xl bg-[#14213D]/50 border border-slate-800/80 p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Status Audit Trail
                </h4>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={h.id || i} className="text-xs flex items-center justify-between p-2 rounded bg-[#0E172E] border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(h.status)}
                        <span className="text-slate-300">Changed by <strong className="text-white">{h.changed_by}</strong></span>
                      </div>
                      <span className="text-[11px] text-slate-500">{new Date(h.changed_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-[#14213D]/40 border border-slate-800 text-center text-slate-400 text-xs">
              Select a handover package from the list to view its complete manager dossier, replacement assignment and briefing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

