import React from 'react';
import { Shield, Activity, RefreshCw } from 'lucide-react';

export default function Header({ activeTab, backendStatus, onRefreshStatus, checkingStatus }) {
  const titles = {
    dashboard: 'Enterprise Operations Dashboard',
    departments: 'Department Management',
    employees: 'Employee Directory & Role Mapping',
    projects: 'Project & Responsibility Tracking',
    upload: 'Knowledge Document Ingestion',
    reports: 'Evidence-Linked Handover Reports',
    replacements: 'Replacement & Transition Management',
    settings: 'System & Security Settings'
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0E172E]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          {titles[activeTab] || 'Dashboard'}
        </h1>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Phase 1 Foundation
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Backend Connection Indicator */}
        <div 
          onClick={onRefreshStatus}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1020] border border-slate-800 text-xs font-medium cursor-pointer hover:border-slate-700 transition-colors"
          title="Click to re-check backend connection"
        >
          <span className="relative flex h-2 w-2">
            {backendStatus?.status === 'online' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span className="text-slate-300">
            Backend: {backendStatus?.status === 'online' ? 'Online (5000)' : 'Connecting...'}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ${checkingStatus ? 'animate-spin' : ''}`} />
        </div>

        {/* Team Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-xs text-blue-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>ROGUENOVA</span>
        </div>
      </div>
    </header>
  );
}

