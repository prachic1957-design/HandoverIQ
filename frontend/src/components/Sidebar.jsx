import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  UploadCloud,
  FileText,
  UserCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen = false, setMobileOpen = () => {} }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'upload', label: 'Knowledge Upload', icon: UploadCloud },
    { id: 'reports', label: 'Handover Reports', icon: FileText },
    { id: 'knowledge', label: 'Knowledge Reconstruction', icon: Sparkles },
    { id: 'replacements', label: 'Replacements', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Handover<span className="text-blue-500">IQ</span></span>
              </div>
              <p className="text-[10px] tracking-wider font-semibold uppercase text-blue-400/90 mt-0.5">ROGUENOVA</p>
            </div>
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-3 pb-1 md:block">
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Preserve Knowledge. Power Continuity.
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#14213D]/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0B1020]/50 m-3 rounded-xl border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Enterprise AI Engine</div>
            <div className="text-[11px] text-slate-400">Phase 1 Foundation v1.0</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden below md: 768px) */}
      <aside className="hidden md:flex w-64 bg-[#0E172E] border-r border-slate-800/80 flex-col justify-between shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0E172E] border-r border-slate-800 h-full flex flex-col justify-between z-50 select-none shadow-2xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
