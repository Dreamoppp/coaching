import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, StatCard } from '../../components/common/Card';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import {
  Users,
  GraduationCap,
  Layers,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const counts = data?.counts || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Executive Dashboard</span>
          <h1 className="text-2xl font-black tracking-tight">ACE Academy Central Command</h1>
          <p className="text-xs text-indigo-200">
            Real-time operations, attendance alerts, and academic analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Launch QR Gate Desk</span>
          </button>
        </div>
      </div>

      {/* Primary Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value={counts.totalStudents || 0}
          subtitle="Enrolled across active batches"
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          trend="+12% growth"
          trendUp={true}
        />
        <StatCard
          title="Faculty Mentors"
          value={counts.totalTeachers || 0}
          subtitle="Senior subject specialists"
          icon={GraduationCap}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          trend="100% active"
          trendUp={true}
        />
        <StatCard
          title="Active Batches"
          value={counts.totalBatches || 0}
          subtitle="JEE Advanced & NEET cohorts"
          icon={Layers}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <StatCard
          title="Today's Attendance"
          value={`${counts.attendancePercentage || 0}%`}
          subtitle={`${counts.todayPresent || 0} Present • ${counts.todayAbsent || 0} Absent`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={counts.todayAbsent > 0 ? `${counts.todayAbsent} alerts` : 'Full turnout'}
          trendUp={counts.todayAbsent === 0}
        />
      </div>

      {/* Secondary Metrics: Fee Management & Attendance Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Visual Snapshot */}
        <Card className="p-6 lg:col-span-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Today's Check-in Ratio</h3>
              <p className="text-xs text-slate-400">Live gate scanner records</p>
            </div>
            <Link to="/admin/attendance" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              <span>View Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Present On Time
                </span>
                <span className="text-slate-700 font-bold">{counts.todayPresent || 0} Students</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${counts.attendancePercentage || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Late Arrivals
                </span>
                <span className="text-slate-700 font-bold">{counts.todayLate || 0} Students</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  Unverified / Absent
                </span>
                <span className="text-slate-700 font-bold">{counts.todayAbsent || 0} Students</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>30-Min Absentee Rule Active:</strong> Parents of unrecorded students are surfaced for telephone verification on the Attendance Board.
            </p>
          </div>
        </Card>

        {/* Fee Collection Statistics */}
        <Card className="p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tuition & Material Fee Ledger</h3>
              <p className="text-xs text-slate-400">Total expected vs realized collections</p>
            </div>
            <Link to="/admin/fees" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              <span>Fee Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</span>
              <p className="text-xl font-black text-slate-800 mt-1">
                ₹{((counts.totalFeesExpected || 0) / 1000).toFixed(0)}k
              </p>
              <span className="text-[10px] text-slate-500">Term 1 Admissions</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected</span>
              <p className="text-xl font-black text-emerald-800 mt-1">
                ₹{((counts.totalFeesCollected || 0) / 1000).toFixed(0)}k
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Cleared via UPI & NetBanking</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Pending Balance</span>
              <p className="text-xl font-black text-rose-800 mt-1">
                ₹{((counts.pendingFees || 0) / 1000).toFixed(0)}k
              </p>
              <span className="text-[10px] text-rose-600 font-medium">Installments Due</span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              to="/admin/students"
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
            >
              + Add Student
            </Link>
            <Link
              to="/admin/timetable"
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
            >
              Weekly Schedule
            </Link>
            <Link
              to="/admin/marks"
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
            >
              Exams & Results
            </Link>
            <Link
              to="/admin/whatsapp"
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
            >
              WhatsApp Reports
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity Log & Recent Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Log Stream */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">System Audit & Activity Logs</h3>
            </div>
            <Link to="/admin/settings" className="text-xs text-indigo-600 hover:underline font-semibold">
              Full Logs
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentLogs?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit logs.</p>
            ) : (
              data?.recentLogs?.map((log: any) => (
                <div key={log.id} className="flex items-start justify-between gap-3 text-xs border-b border-slate-50 pb-2">
                  <div>
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Students */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Recently Enrolled Students</h3>
            </div>
            <Link to="/admin/students" className="text-xs text-indigo-600 hover:underline font-semibold">
              Manage All
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentStudents?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No students registered yet.</p>
            ) : (
              data?.recentStudents?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.user.name}`}
                      alt={s.user.name}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{s.user.name}</p>
                      <p className="text-[11px] text-slate-400">{s.rollNumber} • {s.enrollments?.[0]?.batch?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                    Active
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          fetchOverview();
        }}
        onScanSuccess={() => {
          fetchOverview();
        }}
      />
    </div>
  );
};

