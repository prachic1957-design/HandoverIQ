// ReplacementsView – dedicated UI for viewing replacement information
// This component mirrors the data fetching strategy of HandoverReportsView
// but presents only the replacement‑focused fields.

import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function ReplacementsView() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to find the successor (replacement) employee from the package payload
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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/handovers`);
      if (!res.ok) throw new Error(`Failed to fetch handovers (${res.status})`);
      const data = await res.json();
      const pkgList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setPackages(pkgList);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load handover packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Loading replacement data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 text-red-300 rounded-md">
        <AlertTriangle className="w-5 h-5 inline mr-1" /> {error}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="p-4 text-slate-400">
        <FileText className="w-5 h-5 inline mr-1" /> No handover packages found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">Replacements Overview</h2>
      <ul className="space-y-4">
        {packages.map((pkg) => {
          const predecessor = pkg.departing_employee || {};
          const successor = getSuccessor(pkg) || {};
          const project = pkg.project || {};
          return (
            <li key={pkg.id} className="p-4 bg-[#0E172E] rounded-lg border border-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <span className="font-medium text-slate-200">Package ID:</span> {pkg.id}
                </div>
                <div>
                  <span className="font-medium text-slate-200">Status:</span> {pkg.status || 'unknown'}
                </div>
                <div>
                  <span className="font-medium text-slate-200">Project:</span> {project.name || '—'}
                </div>
                <div>
                  <span className="font-medium text-slate-200">Predecessor:</span>{' '}
                  {predecessor.full_name ? `${predecessor.full_name} (${predecessor.designation || ''})` : '—'}
                </div>
                <div>
                  <span className="font-medium text-slate-200">Successor:</span>{' '}
                  {successor.full_name ? `${successor.full_name} (${successor.designation || ''})` : '—'}
                </div>
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">{pkg.package_summary || 'No summary available'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

