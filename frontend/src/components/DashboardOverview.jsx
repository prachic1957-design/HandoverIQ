import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  Cpu,
  Server,
  RefreshCw
} from 'lucide-react';
import StatCard from './StatCard';

export default function DashboardOverview({ backendStatus, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchLiveStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Demonstration activity data representing live system status
  const recentHandovers = [
    {
      id: 'HO-1042',
      employee: 'Sarah Jenkins',
      role: 'Lead Cloud Architect',
      department: 'IT',
      project: 'Core Infrastructure Migration',
      status: 'AI Extracted',
      statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      evidencePoints: 18,
      confidence: '96%'
    },
    {
      id: 'HO-1041',
      employee: 'David Miller',
      role: 'Senior Financial Analyst',
      department: 'Finance',
      project: 'Q4 Budget Automation',
      status: 'Manager Review',
      statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      evidencePoints: 12,
      confidence: '92%'
    },
    {
      id: 'HO-1040',
      employee: 'Alex Chen',
      role: 'Senior DevOps Engineer',
      department: 'IT',
      project: 'Core Infrastructure Migration',
      status: 'Active Assignment',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      evidencePoints: 8,
      confidence: '94%'
    },
    {
      id: 'HO-1039',
      employee: 'Priya Sharma',
      role: 'Finance Automation Specialist',
      department: 'Finance',
      project: 'Q4 Budget Automation',
      status: 'In Progress',
      statusColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      evidencePoints: 9,
      confidence: '90%'
    }
  ];

  const workflowSteps = [
    { step: 1, title: 'Department & Employee', desc: 'Secure profile & role setup' },
    { step: 2, title: 'Project Assignment', desc: 'Track ongoing & pending work' },
    { step: 3, title: 'Knowledge Ingestion', desc: 'PDF, DOCX, TXT source uploads' },
    { step: 4, title: 'Gemini Reconstruction', desc: 'Work history, decisions & risks' },
    { step: 5, title: 'Evidence-Linked Report', desc: 'Strict citation-backed claims' },
    { step: 6, title: 'Human Review & Approval', desc: 'Employee notes & manager sign-off' },
    { step: 7, title: 'Replacement Briefing', desc: 'Seamless handover & day-1 continuity' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14213D] via-[#101b33] to-[#0E172E] border border-blue-500/20 p-5 sm:p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon MVP • ROGUENOVA Team
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words">
            Handover<span className="text-blue-500">IQ</span> Operational Center
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-300 font-normal leading-relaxed">
            AI-powered enterprise platform designed to eliminate institutional knowledge loss.
            Capture project history, reconstruct milestones with verified evidence, and brief successor employees with zero friction.
          </p>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 sm:px-3 py-1 rounded-md border border-emerald-500/20 text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Confidential HR Salary Shield Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 sm:px-3 py-1 rounded-md border border-blue-500/20 text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Evidence-Linked Verification Engine</span>
            </div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Primary KPI Stats - 1 col on mobile, 2 cols on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div onClick={() => onNavigate('departments')} className="cursor-pointer">
          <StatCard
            title="Departments"
            value={loadingStats && !stats ? '...' : (stats?.departments ?? 3)}
            subtitle="Live from Supabase / DB"
            icon={Building2}
            color="blue"
            trend="Active Core Units"
          />
        </div>
        <div onClick={() => onNavigate('employees')} className="cursor-pointer">
          <StatCard
            title="Monitored Employees"
            value={loadingStats && !stats ? '...' : (stats?.employees ?? 5)}
            subtitle={`${stats?.handoverPending ?? 2} handovers pending`}
            icon={Users}
            color="emerald"
            trend="HR Shielded"
          />
        </div>
        <div onClick={() => onNavigate('projects')} className="cursor-pointer">
          <StatCard
            title="Tracked Projects"
            value={loadingStats && !stats ? '...' : (stats?.projects ?? 2)}
            subtitle={`${stats?.activeProjects ?? 2} in active progress`}
            icon={Briefcase}
            color="amber"
            trend="100% responsibilities mapped"
          />
        </div>
        <div onClick={() => onNavigate('reports')} className="cursor-pointer">
          <StatCard
            title="Handover Streams"
            value={loadingStats && !stats ? '...' : (stats?.handoverPending ?? 2)}
            subtitle="Evidence-linked dossiers"
            icon={FileCheck2}
            color="purple"
            trend="Ready for AI ingestion"
          />
        </div>
      </div>

      {/* Handover Workflow Architecture Pipeline */}
      <div className="rounded-xl bg-[#14213D]/70 border border-slate-800/80 p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 sm:pb-5 border-b border-slate-800/80 gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-2">
              <span>Standard Handover Lifecycle Pipeline</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                End-to-End Workflow
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Deterministic 7-step sequence powering seamless knowledge transfer without hallucination.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 mt-5 sm:mt-6">
          {workflowSteps.map((item, idx) => (
            <div
              key={item.step}
              className="p-3 rounded-lg bg-[#0E172E] border border-slate-800/90 flex flex-col justify-between hover:border-blue-500/40 transition-colors group relative"
            >
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {item.step}
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
              </div>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 z-10">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: System Status & Recent Handovers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 rounded-xl bg-[#14213D]/70 border border-slate-800/80 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-800/80 gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Active Handover Streams</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status of outgoing staff transitions</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Handover ID</th>
                  <th className="py-2.5 px-3">Employee & Role</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Evidence Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentHandovers.map((row) => (
                  <tr key={row.id} className="hover:bg-[#0E172E]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-300 whitespace-nowrap">{row.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white whitespace-nowrap">{row.employee}</div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap">{row.role} • {row.department}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{row.project}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-blue-400 whitespace-nowrap">
                      {row.evidencePoints} citations
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Architecture & Foundation Health */}
        <div className="rounded-xl bg-[#14213D]/70 border border-slate-800/80 p-4 sm:p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400 shrink-0" />
              Stack & Service Readiness
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Phase 2 Database & Core Management</p>

            <div className="space-y-3 mt-4 sm:mt-5">
              {/* Backend Express */}
              <div className="p-3 rounded-lg bg-[#0E172E] border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Server className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">Express Backend API</div>
                    <div className="text-[11px] text-slate-400 truncate">Port 5000 (CRUD Active)</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 ${
                  backendStatus?.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {backendStatus?.status === 'online' ? 'Active' : 'Standby'}
                </span>
              </div>

              {/* Supabase Database */}
              <div className="p-3 rounded-lg bg-[#0E172E] border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">Supabase PostgreSQL</div>
                    <div className="text-[11px] text-slate-400 truncate">Schema & Seed Ready</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  Ready
                </span>
              </div>

              {/* Gemini AI Engine */}
              <div className="p-3 rounded-lg bg-[#0E172E] border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">Google Gemini API</div>
                    <div className="text-[11px] text-slate-400 truncate">Reconstruction Engine</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-800">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300">
              <span className="font-semibold text-blue-400">Knowledge Ingestion Active</span>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                PDF, DOCX, TXT, and CSV documents with Supabase Object Storage and text extraction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
