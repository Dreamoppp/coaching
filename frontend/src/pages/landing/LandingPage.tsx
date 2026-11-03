import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  GraduationCap,
  Award,
  QrCode,
  Calendar,
  Send,
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { switchRole, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (targetRole: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    await switchRole(targetRole);
    if (targetRole === 'ADMIN') navigate('/admin');
    if (targetRole === 'TEACHER') navigate('/teacher');
    if (targetRole === 'STUDENT') navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">ACE ACADEMY</span>
              <span className="block text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Premier Coaching Institute</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Platform Features</a>
            <a href="#courses" className="hover:text-indigo-600 transition-colors">Courses</a>
            <a href="#faculty" className="hover:text-indigo-600 transition-colors">Faculty</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Instant Demo</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/student'}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>Enter {role} Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>Portal Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Coaching Institute Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Empowering Academic Excellence with <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Smart Automation</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The complete management platform for elite coaching institutes. Real-time QR attendance, interactive visual timetables, chapter-wise study notes, and automatic parent WhatsApp progress reports.
          </p>

          {/* Quick Demo Access Bar */}
          <div id="demo" className="pt-6 max-w-3xl mx-auto">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Active Portals:</span>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ● Real Database Connected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="p-4 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">Admin Portal</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Institute stats, fee records, QR desk & settings</p>
                </button>

                <button
                  onClick={() => handleQuickDemo('TEACHER')}
                  className="p-4 rounded-2xl bg-violet-50/70 hover:bg-violet-100/70 border border-violet-200/80 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-violet-600">Teacher Portal</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Marks entry, notes upload & batch discussions</p>
                </button>

                <button
                  onClick={() => handleQuickDemo('STUDENT')}
                  className="p-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/80 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-sm">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-600">Student Portal</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Digital ID QR, scorecards & download notes</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-slate-100/60 border-y border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Engineered for Operational Excellence</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Every feature is built around the daily realities of faculty, students, and institute management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">QR Code Attendance & 30-Min Cutoff Alerts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan digital student ID badges at the reception gate. Automated detection identifies students not checked in 30 minutes after batch start for immediate parent phone verification.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Visual Weekly Timetable with Conflict Validation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Color-coded schedule blocks across Monday through Sunday. Smart algorithms prevent teacher double-booking, room overlaps, and timing clashes.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Automated Parent WhatsApp Progress Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Parents stay informed without logging into portals. Monthly progress summaries with attendance %, subject scores, and teacher remarks delivered directly to WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Offered */}
      <section id="courses" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Flagship Academic Programs</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Targeted coaching programs structured for national competitive examinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-[11px] font-bold uppercase tracking-wider border border-indigo-400/30">
                Engineering Entrance
              </span>
              <h3 className="text-2xl font-black">IIT-JEE Pinnacle (2-Year Integrated)</h3>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Comprehensive coaching for JEE Main & JEE Advanced covering advanced Mechanics, Organic Reaction Mechanisms, and Differential Calculus.
              </p>
            </div>
            <div className="space-y-2 text-xs text-indigo-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Top AIR Faculty from IIT Bombay & IISc</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Weekly CBT Mock Drill Series with Detailed Analytics</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-900 to-purple-950 text-white p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-violet-500/30 text-violet-200 rounded-full text-[11px] font-bold uppercase tracking-wider border border-violet-400/30">
                Medical Entrance
              </span>
              <h3 className="text-2xl font-black">NEET Apex Medical (2-Year Integrated)</h3>
              <p className="text-xs text-violet-200 leading-relaxed">
                Targeted preparation for AIIMS & Top Medical Colleges covering Human Physiology, Genetics, Chemical Bonding, and Physics Problem Solving.
              </p>
            </div>
            <div className="space-y-2 text-xs text-violet-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Doctor Mentors with 10+ Years NEET Track Record</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chapter-wise Concept Maps and Question Banks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">ACE Academy Platform</p>
              <p className="text-[10px] text-slate-400">© 2026 ACE Academy Inc. All rights reserved.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-indigo-600 font-semibold">Portal Sign In</Link>
            <span>•</span>
            <span>Knowledge Park, Pune</span>
            <span>•</span>
            <span>+91 98765 43210</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

