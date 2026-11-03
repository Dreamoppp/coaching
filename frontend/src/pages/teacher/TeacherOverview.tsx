import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card, StatCard } from '../../components/common/Card';
import {
  Calendar,
  Clock,
  Award,
  Users,
  BookOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherOverview: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        setLoading(true);
        const [resSchedule, resExams] = await Promise.all([
          api.get('/timetable/my'),
          api.get('/marks/examinations'),
        ]);
        setSchedule(resSchedule.data);
        setExams(resExams.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTeacherData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white p-7 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
            Instructor Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-xs text-violet-200">
            Assigned Batches: JEE Pinnacle & NEET Cohorts • Faculty of Physical Sciences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/teacher/attendance"
            className="px-4 py-2 bg-white text-indigo-900 hover:bg-violet-50 rounded-2xl text-xs font-bold transition-all"
          >
            Mark Batch Attendance
          </Link>
          <Link
            to="/teacher/marks"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold transition-all shadow"
          >
            Enter Test Marks
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Weekly Lectures"
          value={schedule.length}
          subtitle="Assigned across Mon - Sat"
          icon={Calendar}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Active Tests"
          value={exams.length}
          subtitle="Examinations & Assessments"
          icon={Award}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatCard
          title="Study Modules"
          value="4 Topics"
          subtitle="Uploaded PDF materials"
          icon={BookOpen}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Forum Inquiries"
          value="Active"
          subtitle="Student doubt channels"
          icon={MessageSquare}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Schedule Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Upcoming Assigned Lectures</h3>
              </div>
              <Link to="/teacher/timetable" className="text-xs text-indigo-600 hover:underline font-semibold">
                Full Schedule →
              </Link>
            </div>

            <div className="space-y-3">
              {schedule.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-sm">{s.subject?.name}</span>
                    <p className="text-slate-500 text-[11px] font-semibold">{s.batch?.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {s.startTime} - {s.endTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        {s.roomNumber}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-xl text-[10px] font-extrabold uppercase">
                    Day {s.dayOfWeek}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Recent Tests (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-slate-800 text-sm">Examinations & Result Publishing</h3>
              </div>
              <Link to="/teacher/marks" className="text-xs text-violet-600 hover:underline font-semibold">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {exams.slice(0, 3).map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 truncate">{e.title}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      e.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {e.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{e.batch?.name} • Max: {e.totalMarks}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Discussion Hub Shortcut */}
          <Link
            to="/teacher/messages"
            className="block p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Real-Time Messaging</span>
                <h4 className="font-bold text-sm mt-0.5">Batch Phoenix Discussion Forum</h4>
                <p className="text-[11px] text-indigo-100 mt-1">Live doubt clearing and student messages</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

