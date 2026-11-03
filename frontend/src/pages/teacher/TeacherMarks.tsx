import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Award, Plus, CheckCircle2, X } from 'lucide-react';
import { Examination, Batch, Subject } from '../../types';

export const TeacherMarks: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [marksEntries, setMarksEntries] = useState<any[]>([]);
  const [isEnteringMarks, setIsEnteringMarks] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marks/examinations');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleOpenMarksEntry = async (exam: Examination) => {
    try {
      const resStudents = await api.get('/admin/students', { params: { batchId: exam.batchId } });
      const resResults = await api.get(`/marks/examinations/${exam.id}/results`);
      const existing = resResults.data.results || [];

      const list = resStudents.data.map((s: any) => {
        const found = existing.find((r: any) => r.studentId === s.id);
        return {
          studentId: s.id,
          studentName: s.user.name,
          rollNumber: s.rollNumber,
          marksObtained: found ? found.marksObtained : 0,
          remarks: found ? found.remarks || '' : '',
        };
      });

      setMarksEntries(list);
      setSelectedExam(exam);
      setIsEnteringMarks(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    try {
      await api.post(`/marks/examinations/${selectedExam.id}/results`, {
        results: marksEntries.map((m) => ({
          studentId: m.studentId,
          marksObtained: Number(m.marksObtained),
          remarks: m.remarks,
        })),
      });

      setIsEnteringMarks(false);
      loadExams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save marks');
    }
  };

  const handleTogglePublish = async (examId: string, current: boolean) => {
    try {
      await api.put(`/marks/examinations/${examId}/publish`, { isPublished: !current });
      loadExams();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Test Marks Entry & Publishing</h1>
        <p className="text-xs text-slate-500">Record scores for weekly assessments and release report cards</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Examination</th>
                <th className="py-3.5 px-6">Subject & Batch</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Total Marks</th>
                <th className="py-3.5 px-6">Publish Status</th>
                <th className="py-3.5 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading assessments...</td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{exam.title}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-indigo-700">{exam.subject?.name}</span>
                      <p className="text-[11px] text-slate-400">{exam.batch?.name}</p>
                    </td>
                    <td className="py-3.5 px-6 font-mono">{new Date(exam.examDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{exam.totalMarks}</td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          exam.isPublished
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exam.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleOpenMarksEntry(exam)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Enter Marks
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Marks Entry Modal */}
      {isEnteringMarks && (
        <Card className="p-6 space-y-4 border-2 border-indigo-500 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                Enter Scores
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {selectedExam?.title} (Max: {selectedExam?.totalMarks} Marks)
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
                    <th className="py-2 px-4 w-36">Marks</th>
                    <th className="py-2 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksEntries.map((m, idx) => (
                    <tr key={m.studentId}>
                      <td className="py-2 px-4 font-bold text-slate-800">{m.studentName}</td>
                      <td className="py-2 px-4 font-mono text-slate-400">{m.rollNumber}</td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={selectedExam?.totalMarks}
                          value={m.marksObtained}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...marksEntries];
                            copy[idx].marksObtained = val;
                            setMarksEntries(copy);
                          }}
                          className="w-28 bg-slate-50 border border-slate-300 px-3 py-1 rounded-xl font-bold text-center"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={m.remarks}
                          onChange={(e) => {
                            const copy = [...marksEntries];
                            copy[idx].remarks = e.target.value;
                            setMarksEntries(copy);
                          }}
                          placeholder="e.g. Good grasp of concepts"
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
    </div>
  );
};

