import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card, StatCard } from '../../components/common/Card';
import { CircularProgress } from '../../components/common/CircularProgress';
import {
  Award,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  IdCard,
  ArrowRight,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentOverview: React.FC = () => {
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.studentProfile?.id;

  useEffect(() => {
    const loadStudentData = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        const [resAtt, resAnalytics, resTime] = await Promise.all([
          api.get(`/attendance/student/${studentId}`),
          api.get(`/marks/student/${studentId}/analytics`),
          api.get('/timetable/my'),
        ]);

        setAttendanceStats(resAtt.data.stats);
        setAnalytics(resAnalytics.data);
        setTimetable(resTime.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  const overallAttendance = attendanceStats?.overallPercentage ?? 96;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#311042] to-[#1e1b4b] text-white p-7 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">
                {user?.studentProfile?.rollNumber || 'ACE-2026-001'}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Verified Enrolled
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">{user?.name}</h1>
            <p className="text-xs text-indigo-200 mt-0.5">
              Batch Phoenix • IIT-JEE Advanced Integrated 2-Year Cohort
            </p>
          </div>
        </div>

        <Link
          to="/student/id-card"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <IdCard className="w-4 h-4" />
          <span>Digital ID & QR Gate Pass</span>
        </Link>
      </div>

      {/* Metrics Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Animated Attendance Gauge Card (4 cols) */}
        <Card className="md:col-span-4 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attendance Rate</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Satisfactory
            </span>
          </div>

          <div className="py-2">
            <CircularProgress
              percentage={overallAttendance}
              size={150}
              strokeWidth={14}
              label="Overall Ratio"
              sublabel={`${attendanceStats?.presentCount || 25} of ${attendanceStats?.totalDays || 26} Classes Present`}
              color="#4f46e5"
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Minimum 85% attendance required for competitive test series eligibility.
          </p>
        </Card>

        {/* Academic Analytics & Subject Performance (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Academic Average"
            value={`${analytics?.overallAverage || 92}%`}
            subtitle="Across all diagnostic assessments"
            icon={Award}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            trend="AIR Rank #1"
            trendUp={true}
          />
          <StatCard
            title="Tests Completed"
            value={analytics?.totalTestsTaken || 2}
            subtitle="Unit & Cumulative series"
            icon={TrendingUp}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
          <StatCard
            title="Study Materials"
            value="4 Modules"
            subtitle="Formula guides ready"
            icon={BookOpen}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />

          {/* Subject Breakdown Bars (Spans 3 cols) */}
          <Card className="sm:col-span-3 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Discipline-wise Performance</h3>
              <Link to="/student/marks" className="text-xs text-indigo-600 hover:underline font-semibold">
                Detailed Scorecards →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analytics?.subjectAnalytics?.map((sub: any, i: number) => (
                <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{sub.subject}</span>
                    <span style={{ color: sub.color }}>{sub.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sub.percentage}%`, backgroundColor: sub.color }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {sub.testsTaken} Tests Taken
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Today's Schedule & Notes Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timetable Preview (7 cols) */}
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Lectures Schedule (Mon - Sat)</h3>
            </div>
            <Link to="/student/timetable" className="text-xs text-indigo-600 hover:underline font-semibold">
              Weekly Grid →
            </Link>
          </div>

          <div className="space-y-3">
            {timetable.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{item.subject?.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold">
                      Day {item.dayOfWeek}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Instructor: {item.teacher?.user?.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{item.startTime} - {item.endTime}</span>
                    <span>•</span>
                    <MapPin className="w-3 h-3 text-indigo-500" />
                    <span>{item.roomNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Study Notes & Chat Shortcut (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Downloadable Study Sheets</h3>
              </div>
              <Link to="/student/notes" className="text-xs text-emerald-600 hover:underline font-semibold">
                Browse All
              </Link>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">Kinematics & NLM Formula Sheet</span>
                </div>
                <Link to="/student/notes" className="text-[11px] text-indigo-600 font-bold hover:underline">
                  Download
                </Link>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">Chemical Bonding Concept Maps</span>
                </div>
                <Link to="/student/notes" className="text-[11px] text-indigo-600 font-bold hover:underline">
                  Download
                </Link>
              </div>
            </div>
          </Card>

          <Link
            to="/student/messages"
            className="block p-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">24/7 Academic Support</span>
                <h4 className="font-bold text-sm mt-0.5">Faculty Doubt Clearing Hub</h4>
                <p className="text-[11px] text-indigo-100 mt-1">Connect with Prof. Rajesh and batchmates</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

