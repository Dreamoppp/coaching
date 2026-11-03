import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import {
  Award,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  FileText,
  Eye,
  Edit,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Examination, Batch, Subject } from '../../types';

export const AdminMarks: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState<any | null>(null);
  const [isEnteringMarks, setIsEnteringMarks] = useState(false);

  // Create Form
  const [examForm, setExamForm] = useState({
    title: '',
    examType: 'UNIT_TEST',
    courseId: '',
    batchId: '',
    subjectId: '',
    examDate: new Date().toISOString().slice(0, 10),
    totalMarks: 100,
    passingMarks: 40,
  });

  // Marks Entry Form
  const [marksEntries, setMarksEntries] = useState<{ studentId: string; studentName: string; rollNumber: string; marksObtained: number; remarks: string }[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resExams, resBatches, resSubjects] = await Promise.all([
        api.get('/marks/examinations'),
        api.get('/admin/batches'),
        api.get('/admin/subjects'),
      ]);

      setExams(resExams.data);
      setBatches(resBatches.data);
      setSubjects(resSubjects.data);

      if (resBatches.data.length > 0 && !examForm.batchId) {
        setExamForm((prev) => ({
          ...prev,
          batchId: resBatches.data[0].id,
          courseId: resBatches.data[0].courseId,
          subjectId: resSubjects.data[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/marks/examinations', {
        ...examForm,
        totalMarks: Number(examForm.totalMarks),
        passingMarks: Number(examForm.passingMarks),
      });

      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create exam');
    }
  };

  const handleViewResults = async (examId: string) => {
    try {
      const res = await api.get(`/marks/examinations/${examId}/results`);
      setSelectedExamDetails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMarksEntry = async (exam: Examination) => {
    try {
      // Fetch students in this batch
      const res = await api.get('/admin/students', { params: { batchId: exam.batchId } });
      const students = res.data;

      // Fetch existing results
      const resResults = await api.get(`/marks/examinations/${exam.id}/results`);
      const existingResults = resResults.data.results || [];

      const initialEntries = students.map((s: any) => {
        const found = existingResults.find((r: any) => r.studentId === s.id);
        return {
          studentId: s.id,
          studentName: s.user.name,
          rollNumber: s.rollNumber,
          marksObtained: found ? found.marksObtained : 0,
          remarks: found ? found.remarks || '' : '',
        };
      });

      setMarksEntries(initialEntries);
      setSelectedExamDetails({ exam });
      setIsEnteringMarks(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamDetails?.exam?.id) return;

    try {
      await api.post(`/marks/examinations/${selectedExamDetails.exam.id}/results`, {
        results: marksEntries.map((m) => ({
          studentId: m.studentId,
          marksObtained: Number(m.marksObtained),
          remarks: m.remarks,
        })),
      });

      setIsEnteringMarks(false);
      handleViewResults(selectedExamDetails.exam.id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save marks');
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      await api.put(`/marks/examinations/${examId}/publish`, {
        isPublished: !currentStatus,
      });
      loadData();
      if (selectedExamDetails?.exam?.id === examId) {
        handleViewResults(examId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Examinations, Marks & Merit Ranks</h1>
          <p className="text-xs text-slate-500">Configure tests, enter student marks, auto-compute ranks and publish scorecards</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Examination</span>
        </button>
      </div>

      {/* Examinations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Exam Title</th>
                <th className="py-3.5 px-6">Subject & Cohort</th>
                <th className="py-3.5 px-6">Exam Date</th>
                <th className="py-3.5 px-6">Max / Pass Marks</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading exams...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No examinations registered. Click "Create Examination" to start.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{exam.title}</p>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {exam.examType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: `${exam.subject?.colorHex}15`,
                          color: exam.subject?.colorHex,
                        }}
                      >
                        {exam.subject?.name}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 font-semibold">{exam.batch?.name}</p>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-slate-600">
                      {new Date(exam.examDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-800">{exam.totalMarks} Marks</span>
                      <p className="text-[10px] text-slate-400">Pass: {exam.passingMarks}</p>
                    </td>

                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          exam.isPublished
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle publish state"
                      >
                        {exam.isPublished ? '● Published' : '○ Draft (Unpublished)'}
                      </button>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewResults(exam.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Scorecard
                        </button>
                        <button
                          onClick={() => handleOpenMarksEntry(exam)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Enter Marks
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Exam Results View */}
      {selectedExamDetails && !isEnteringMarks && (
        <Card className="p-6 space-y-5 animate-in fade-in duration-200 border-2 border-indigo-100">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                Examination Performance Breakdown
              </span>
              <h2 className="text-xl font-black text-slate-800 mt-2">
                {selectedExamDetails.exam?.title}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedExamDetails.exam?.batch?.name} • Max: {selectedExamDetails.exam?.totalMarks} Marks
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenMarksEntry(selectedExamDetails.exam)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Edit Marks
              </button>
              <button
                onClick={() => setSelectedExamDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Performance Stats Cards */}
          {selectedExamDetails.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-indigo-600">Batch Average</span>
                <p className="text-xl font-black text-indigo-950 mt-1">
                  {selectedExamDetails.stats.averageMarks} / {selectedExamDetails.exam?.totalMarks}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Top Score</span>
                <p className="text-xl font-black text-emerald-950 mt-1">
                  {selectedExamDetails.stats.highestMarks}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
                <span className="text-[10px] font-bold uppercase text-sky-600">Pass Rate</span>
                <p className="text-xl font-black text-sky-950 mt-1">
                  {selectedExamDetails.stats.passPercentage}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Submissions</span>
                <p className="text-xl font-black text-slate-800 mt-1">
                  {selectedExamDetails.stats.totalSubmissions}
                </p>
              </div>
            </div>
          )}

          {/* Results Table with Ranks & Percentiles */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-4">Rank</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Marks Obtained</th>
                  <th className="py-2.5 px-4">Percentage</th>
                  <th className="py-2.5 px-4">Percentile</th>
                  <th className="py-2.5 px-4">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedExamDetails.results?.map((res: any) => {
                  const pct = Math.round((res.marksObtained / selectedExamDetails.exam.totalMarks) * 100);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          res.rank === 1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : res.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : res.rank === 3
                            ? 'bg-orange-100 text-orange-800'
                            : 'text-slate-600'
                        }`}>
                          {res.rank}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{res.student?.user?.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{res.student?.rollNumber}</p>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-sm text-slate-800">
                        {res.marksObtained}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700">
                        {pct}%
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {res.percentile ? `${res.percentile}%ile` : '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {res.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Marks Entry Interface */}
      {isEnteringMarks && (
        <Card className="p-6 space-y-4 border-2 border-indigo-500 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                Interactive Marks Entry Console
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {selectedExamDetails.exam?.title} (Max: {selectedExamDetails.exam?.totalMarks} Marks)
              </h3>
            </div>
            <button
              onClick={() => setIsEnteringMarks(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveMarks} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase">
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4">Roll</th>
                    <th className="py-2 px-4 w-36">Marks Obtained</th>
                    <th className="py-2 px-4">Performance Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksEntries.map((m, idx) => (
                    <tr key={m.studentId}>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{m.studentName}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{m.rollNumber}</td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={selectedExamDetails.exam?.totalMarks}
                          value={m.marksObtained}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...marksEntries];
                            copy[idx].marksObtained = val;
                            setMarksEntries(copy);
                          }}
                          className="w-28 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl font-extrabold text-sm text-slate-800 text-center"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={m.remarks}
                          onChange={(e) => {
                            const copy = [...marksEntries];
                            copy[idx].remarks = e.target.value;
                            setMarksEntries(copy);
                          }}
                          placeholder="e.g. Excellent problem solving"
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEnteringMarks(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
              >
                Save & Compute Merit Ranks
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Create Examination Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Schedule Examination</h3>
                <p className="text-xs text-slate-400">Configure target cohort, maximum marks, and syllabus topic</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="Monthly Cumulative Test - Mechanics"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cohort / Batch *</label>
                  <select
                    value={examForm.batchId}
                    onChange={(e) => {
                      const b = batches.find((x) => x.id === e.target.value);
                      setExamForm({
                        ...examForm,
                        batchId: e.target.value,
                        courseId: b ? b.courseId : examForm.courseId,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject Discipline *</label>
                  <select
                    value={examForm.subjectId}
                    onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max Marks</label>
                  <input
                    type="number"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pass Marks</label>
                  <input
                    type="number"
                    value={examForm.passingMarks}
                    onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Schedule Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

