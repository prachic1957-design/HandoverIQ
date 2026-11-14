import React from 'react';
import { Shield, Activity, RefreshCw, Menu } from 'lucide-react';

export default function Header({
  activeTab,
  backendStatus,
  onRefreshStatus,
  checkingStatus,
  onToggleMobileMenu
}) {
  const titles = {
    dashboard: 'Enterprise Operations Dashboard',
    departments: 'Department Management',
    employees: 'Employee Directory & Role Mapping',
    projects: 'Project & Responsibility Tracking',
    upload: 'Knowledge Document Ingestion',
    reports: 'Evidence-Linked Handover Reports',
    knowledge: 'AI Knowledge Reconstruction',
    replacements: 'Replacement & Transition Management',
    settings: 'System & Security Settings'
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0E172E]/80 backdrop-blur-md px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button (visible below md: 768px) */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg bg-[#0B1020] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 text-blue-400" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
          {titles[activeTab] || 'Dashboard'}
        </h1>
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
          Phase 1 Foundation
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Live Backend Connection Indicator */}
        <div 
          onClick={onRefreshStatus}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0B1020] border border-slate-800 text-[11px] sm:text-xs font-medium cursor-pointer hover:border-slate-700 transition-colors"
          title="Click to re-check backend connection"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {backendStatus?.status === 'online' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Backend: {backendStatus?.status === 'online' ? 'Online (5000)' : 'Connecting...'}
          </span>
          <span className="text-slate-300 sm:hidden">
            {backendStatus?.status === 'online' ? 'Online' : 'Offline'}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 shrink-0 ${checkingStatus ? 'animate-spin' : ''}`} />
        </div>

        {/* Team Badge */}
        <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-[11px] sm:text-xs text-blue-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>ROGUENOVA</span>
        </div>
      </div>
    </header>
  );
}
