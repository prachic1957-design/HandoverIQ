import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import DepartmentsView from './components/DepartmentsView';
import EmployeesView from './components/EmployeesView';
import ProjectsView from './components/ProjectsView';
import ModulePlaceholder from './components/ModulePlaceholder';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check backend health endpoint
  const checkBackendHealth = async () => {
    setCheckingStatus(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
      } else {
        setBackendStatus({ status: 'error', code: res.status });
      }
    } catch (err) {
      setBackendStatus({ status: 'offline', message: err.message });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Poll every 15 seconds to keep connection status fresh
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview backendStatus={backendStatus} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'departments':
        return <DepartmentsView />;
      case 'employees':
        return <EmployeesView />;
      case 'projects':
        return <ProjectsView />;
      default:
        return <ModulePlaceholder moduleId={activeTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1020] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          backendStatus={backendStatus}
          onRefreshStatus={checkBackendHealth}
          checkingStatus={checkingStatus}
        />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
