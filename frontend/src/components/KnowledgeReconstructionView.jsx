import React, { useEffect, useState } from 'react';

export default function KnowledgeReconstructionView() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [findings, setFindings] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load projects & employees on mount
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const [projRes, empRes] = await Promise.all([
          fetch(`${apiBase}/projects`),
          fetch(`${apiBase}/employees`)
        ]);

        if (!projRes.ok) {
          throw new Error(`Failed to fetch projects (HTTP ${projRes.status})`);
        }
        if (!empRes.ok) {
          throw new Error(`Failed to fetch employees (HTTP ${empRes.status})`);
        }

        const [projJson, empJson] = await Promise.all([
          projRes.json(),
          empRes.json()
        ]);

        if (projJson && projJson.success === false) {
          throw new Error(projJson.error || 'Failed to load projects');
        }
        if (empJson && empJson.success === false) {
          throw new Error(empJson.error || 'Failed to load employees');
        }

        // Backend returns { success: true, data: [...], count: n }
        const projectList = Array.isArray(projJson.data)
          ? projJson.data
          : Array.isArray(projJson)
          ? projJson
          : null;

        const employeeList = Array.isArray(empJson.data)
          ? empJson.data
          : Array.isArray(empJson)
          ? empJson
          : null;

        if (!projectList) {
          throw new Error('Invalid project response data structure from API');
        }
        if (!employeeList) {
          throw new Error('Invalid employee response data structure from API');
        }

        setProjects(projectList);
        setEmployees(employeeList);
      } catch (e) {
        console.error('Error loading projects/employees for Knowledge Reconstruction:', e);
        setError(e.message || 'Failed to load projects or employees');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [apiBase]);

  const startAnalysis = async () => {
    if (!selectedProject || !selectedEmployee) {
      setError('Select both project and employee');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/knowledge/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject, employee_id: selectedEmployee })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis || data);

      const findingsList = Array.isArray(data.findings)
        ? data.findings
        : Array.isArray(data.data?.findings)
        ? data.data.findings
        : [];
      setFindings(findingsList);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (findingId, status, notes = '') => {
    try {
      setError('');
      const res = await fetch(`${apiBase}/knowledge/findings/${findingId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: status, reviewer_notes: notes })
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Update failed');
      const updatedItem = updated.data || updated;
      setFindings(prev => prev.map(f => (f.id === findingId ? { ...f, ...updatedItem } : f)));
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to update review status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Knowledge Reconstruction</h2>
          <p className="text-sm text-slate-400 mt-1">
            Synthesize unstructured project documents into structured knowledge findings and risk analysis.
          </p>
        </div>
        {initialLoading && (
          <span className="text-xs text-blue-400 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Loading data...
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-900/60 border border-red-500/40 text-red-200 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-300 hover:text-white font-bold text-sm px-2 py-0.5 rounded"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Project</label>
          <select
            className="w-full p-2.5 rounded-lg bg-[#0E172E] text-white border border-slate-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            disabled={initialLoading || loading}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {!initialLoading && projects.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">No projects available. Please create a project first.</p>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Departing Employee</label>
          <select
            className="w-full p-2.5 rounded-lg bg-[#0E172E] text-white border border-slate-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            disabled={initialLoading || loading}
          >
            <option value="">Select Employee</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.full_name || e.name}
              </option>
            ))}
          </select>
          {!initialLoading && employees.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">No employees available. Please register an employee first.</p>
          )}
        </div>

        <div className="sm:self-end">
          <button
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={startAnalysis}
            disabled={loading || initialLoading || !selectedProject || !selectedEmployee}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Analyzing…</span>
              </>
            ) : (
              'Analyze Knowledge'
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="p-5 bg-[#0E172E] rounded-xl border border-slate-700/80 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-lg font-semibold text-white">Reconstruction Summary</h3>
            {analysis.model_name && (
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded font-mono">
                {analysis.model_name}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {analysis.analysis_summary || 'No summary text provided.'}
          </p>
        </div>
      )}

      {analysis && findings.length === 0 && (
        <div className="p-8 text-center bg-[#0E172E]/50 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">No structured findings or risks extracted for this analysis.</p>
        </div>
      )}

      {findings.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Extracted Findings ({findings.length})</h3>
          </div>
          <div className="space-y-3">
            {findings.map(f => (
              <div key={f.id} className="p-4 bg-[#0E172E] rounded-xl border border-slate-700/80 space-y-2.5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-semibold text-white text-base">{f.title}</span>
                    {f.finding_type && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 uppercase tracking-wide">
                        {f.finding_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-medium capitalize ${
                      f.review_status === 'approved' || f.review_status === 'verified'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                        : f.review_status === 'rejected'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {f.review_status || 'pending'}
                  </span>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{f.description}</p>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                  <div className="text-xs text-slate-400">
                    Confidence: <span className="font-medium text-slate-200 capitalize">{f.confidence || 'medium'}</span>
                    {f.reviewer_notes && (
                      <span className="ml-3 italic text-slate-400">Note: "{f.reviewer_notes}"</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors"
                      onClick={() => updateReview(f.id, 'approved', '')}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs transition-colors"
                      onClick={() => updateReview(f.id, 'rejected', '')}
                    >
                      Reject
                    </button>
                    <button
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
                      onClick={() => {
                        const notes = prompt('Enter reviewer notes:', f.reviewer_notes || '');
                        if (notes !== null) updateReview(f.id, 'needs_review', notes);
                      }}
                    >
                      Review / Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
