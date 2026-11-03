import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarDays,
  QrCode,
  Award,
  BookOpen,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Send,
  UserCheck,
  IdCard,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Batches & Courses', path: '/admin/batches', icon: Layers },
    { name: 'Weekly Timetable', path: '/admin/timetable', icon: CalendarDays },
    { name: 'QR Attendance & Alerts', path: '/admin/attendance', icon: QrCode },
    { name: 'Marks & Exams', path: '/admin/marks', icon: Award },
    { name: 'Study Notes & Files', path: '/admin/notes', icon: BookOpen },
    { name: 'Fee Invoices', path: '/admin/fees', icon: CreditCard },
    { name: 'WhatsApp Reports', path: '/admin/whatsapp', icon: Send },
    { name: 'Settings & Audit', path: '/admin/settings', icon: Settings },
  ];

  const teacherNav = [
    { name: 'Overview', path: '/teacher', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/teacher/attendance', icon: UserCheck },
    { name: 'Test Marks Entry', path: '/teacher/marks', icon: Award },
    { name: 'Upload Notes', path: '/teacher/notes', icon: BookOpen },
    { name: 'My Timetable', path: '/teacher/timetable', icon: CalendarDays },
    { name: 'Messages & Forum', path: '/teacher/messages', icon: MessageSquare },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'Digital ID & QR', path: '/student/id-card', icon: IdCard },
    { name: 'Class Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Scorecards & Marks', path: '/student/marks', icon: Award },
    { name: 'Chapter Notes', path: '/student/notes', icon: BookOpen },
    { name: 'Faculty Chat', path: '/student/messages', icon: MessageSquare },
  ];

  const items = role === 'ADMIN' ? adminNav : role === 'TEACHER' ? teacherNav : studentNav;

  return (
    <aside className="w-64 bg-[#1e1b4b] text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-indigo-950/60 shadow-xl select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-indigo-900/50 bg-[#17143c]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base">ACE ACADEMY</h1>
          <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">Coaching Suite</p>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3">
        <div className="bg-indigo-950/80 border border-indigo-800/60 rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider">{role} PORTAL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/teacher' || item.path === '/student'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Demo Switcher Quick Action Footer */}
      <div className="p-3 border-t border-indigo-900/40 bg-[#17143c]/60">
        <div className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
          <span>Demo Role Switcher</span>
        </div>
        <div className="grid grid-cols-3 gap-1 mb-3">
          <button
            onClick={() => switchRole('ADMIN')}
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-all ${
              role === 'ADMIN'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole('TEACHER')}
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-all ${
              role === 'TEACHER'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => switchRole('STUDENT')}
            className={`py-1.5 text-[11px] font-medium rounded-lg transition-all ${
              role === 'STUDENT'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Student
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

