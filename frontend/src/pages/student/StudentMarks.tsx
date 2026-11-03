import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import {
  Award,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Sparkles,
  BarChart2,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const StudentMarks: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.studentProfile?.id;

  useEffect(() => {
    const loadMarks = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        const res = await api.get(`/marks/student/${studentId}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMarks();
  }, [studentId]);

  const timelineData = analytics?.timelineData || [];
  const subjectData = analytics?.subjectAnalytics || [];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Academic Scorecards & Merit Analytics</h1>
        <p className="text-xs text-slate-500">Official published test scores, batch rankings, and progress trajectories</p>
      </div>

      {/* Summary Scorecard Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-tr from-indigo-50 to-white">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            {analytics?.overallAverage || 92}%
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Cumulative Average</span>
            <h3 className="font-bold text-slate-800 text-sm">Distinction Merit Band</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-gradient-to-tr from-emerald-50 to-white">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            #1
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-600">Cohort Rank</span>
            <h3 className="font-bold text-slate-800 text-sm">Batch Phoenix Leader</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-gradient-to-tr from-sky-50 to-white">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            {analytics?.totalTestsTaken || 2}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-sky-600">Total Assessments</span>
            <h3 className="font-bold text-slate-800 text-sm">100% Cleared</h3>
          </div>
        </Card>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Performance Bar Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Subject Proficiency (%)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Real Test Aggregates</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Score']}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="percentage" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Improvement Over Time Progression */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Improvement Progression Over Time</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Score Progression</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Score']}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Published Scorecards List */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Detailed Scorecard Records</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {timelineData.map((item: any, i: number) => (
            <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800">{item.examTitle}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                    {item.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {item.date}
                  </span>
                  <span>•</span>
                  <span>Max Marks: {item.totalMarks}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{item.marksObtained}</span>
                  <span className="text-xs text-slate-400"> / {item.totalMarks}</span>
                  <p className="text-[11px] font-bold text-emerald-600">{item.percentage}% Score</p>
                </div>

                <div className="text-right pl-4 border-l border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Rank</span>
                  <span className="text-base font-black text-indigo-600">#{item.rank}</span>
                  <span className="text-[10px] font-mono text-slate-400 block">{item.percentile}%ile</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

