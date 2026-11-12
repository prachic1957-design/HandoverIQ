import React, { useEffect, useState } from 'react';

export default function KnowledgeReconstructionView() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load projects & employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, empRes] = await Promise.all([
          fetch(`${apiBase}/projects`),
          fetch(`${apiBase}/employees`)
        ]);
        const [projJson, empJson] = await Promise.all([projRes.json(), empRes.json()]);
        setProjects(projJson);
        setEmployees(empJson);
      } catch (e) {
        console.error(e);
        setError('Failed to load projects or employees');
      }
    };
    fetchData();
  }, []);

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
      setAnalysis(data.analysis);
      setFindings(data.findings);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (findingId, status, notes) => {
    try {
      const res = await fetch(`${apiBase}/knowledge/findings/${findingId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: status, reviewer_notes: notes })
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Update failed');
      setFindings(prev => prev.map(f => (f.id === findingId ? updated : f)));
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">AI Knowledge Reconstruction</h2>

      {error && <div className="p-2 bg-red-600 text-white rounded">{error}</div>}

      <div className="flex gap-4">
        <select
          className="flex-1 p-2 rounded bg-[#0E172E] text-white"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="flex-1 p-2 rounded bg-[#0E172E] text-white"
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </select>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
          onClick={startAnalysis}
          disabled={loading}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Summary</h3>
          <p className="text-slate-300">{analysis.analysis_summary}</p>
        </div>
      )}

      {findings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Findings</h3>
          {findings.map(f => (
            <div key={f.id} className="p-4 bg-[#0E172E] rounded border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">{f.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  f.review_status === 'approved' ? 'bg-green-600' : f.review_status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                }`}> {f.review_status} </span>
              </div>
              <p className="text-slate-300 mb-2">{f.description}</p>
              <div className="text-sm text-slate-400 mb-2">
                Confidence: {f.confidence}
              </div>
              {/* Simple review controls */}
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 bg-green-600 rounded text-xs"
                  onClick={() => updateReview(f.id, 'approved', '')}
                >
                  Approve
                </button>
                <button
                  className="px-2 py-1 bg-red-600 rounded text-xs"
                  onClick={() => updateReview(f.id, 'rejected', '')}
                >
                  Reject
                </button>
                <button
                  className="px-2 py-1 bg-blue-600 rounded text-xs"
                  onClick={() => {
                    const notes = prompt('Reviewer notes:');
                    if (notes !== null) updateReview(f.id, 'needs_review', notes);
                  }}
                >
                  Add Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
