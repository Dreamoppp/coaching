import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../common/Sidebar';
import { Navbar } from '../common/Navbar';
import { Role } from '../../types';

interface DashboardLayoutProps {
  allowedRoles?: Role[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-indigo-300">Loading ACE Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their default dashboard
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  // Determine Title from URL
  const path = location.pathname;
  let title = 'Dashboard';
  if (path.includes('/students')) title = 'Student Directory & Admissions';
  else if (path.includes('/teachers')) title = 'Faculty & Educator Roster';
  else if (path.includes('/batches')) title = 'Cohorts & Academic Programs';
  else if (path.includes('/timetable')) title = 'Weekly Timetable Matrix';
  else if (path.includes('/attendance')) title = 'Gate QR & Attendance Operations';
  else if (path.includes('/marks')) title = 'Examinations & Performance';
  else if (path.includes('/notes')) title = 'Curriculum Study Materials';
  else if (path.includes('/fees')) title = 'Fee Invoices & Ledger';
  else if (path.includes('/whatsapp')) title = 'WhatsApp Progress Reports';
  else if (path.includes('/settings')) title = 'Institute Control & Audit';
  else if (path.includes('/id-card')) title = 'Student Digital ID Pass';
  else if (path.includes('/messages')) title = 'Faculty & Peer Communication';

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

