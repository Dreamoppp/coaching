import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  MapPin,
  GraduationCap,
  X,
} from 'lucide-react';
import { Batch, Subject, Teacher, TimetableSession } from '../../types';

export const AdminTimetable: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Session Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    roomNumber: 'Hall A-101',
  });
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const days = [
    { dayNumber: 1, name: 'Monday' },
    { dayNumber: 2, name: 'Tuesday' },
    { dayNumber: 3, name: 'Wednesday' },
    { dayNumber: 4, name: 'Thursday' },
    { dayNumber: 5, name: 'Friday' },
    { dayNumber: 6, name: 'Saturday' },
    { dayNumber: 7, name: 'Sunday' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [resBatches, resSubjects, resTeachers] = await Promise.all([
        api.get('/admin/batches'),
        api.get('/admin/subjects'),
        api.get('/admin/teachers'),
      ]);

      setBatches(resBatches.data);
      setSubjects(resSubjects.data);
      setTeachers(resTeachers.data);

      if (resBatches.data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(resBatches.data[0].id);
        setFormData((prev) => ({
          ...prev,
          batchId: resBatches.data[0].id,
          subjectId: resSubjects.data[0]?.id || '',
          teacherId: resTeachers.data[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!selectedBatchId) return;
    try {
      const res = await api.get(`/timetable/batch/${selectedBatchId}`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadSessions();
      setFormData((prev) => ({ ...prev, batchId: selectedBatchId }));
    }
  }, [selectedBatchId]);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setSaving(true);

    try {
      await api.post('/timetable', {
        ...formData,
        dayOfWeek: Number(formData.dayOfWeek),
      });

      setIsAddOpen(false);
      loadSessions();
    } catch (err: any) {
      setConflictError(err.response?.data?.error || 'Failed to save timetable session');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Delete this timetable session?')) {
      try {
        await api.delete(`/timetable/${id}`);
        loadSessions();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Weekly Visual Timetable Grid</h1>
          <p className="text-xs text-slate-500">Color-coded class schedules with real-time room & faculty conflict prevention</p>
        </div>

        <button
          onClick={() => {
            setConflictError(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Timetable Session</span>
        </button>
      </div>

      {/* Cohort / Batch Selector Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Display Schedule for Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.batchCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Physics
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Chemistry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Mathematics
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Biology
          </span>
        </div>
      </Card>

      {/* Weekly Grid (Monday to Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {days.map((day) => {
          const daySessions = sessions.filter((s) => s.dayOfWeek === day.dayNumber);

          return (
            <div key={day.dayNumber} className="flex flex-col space-y-3">
              {/* Day Column Header */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl text-center shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider">{day.name}</span>
                <span className="block text-[10px] text-indigo-300 font-medium">
                  {daySessions.length} {daySessions.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>

              {/* Day Sessions List */}
              <div className="space-y-3 min-h-[350px]">
                {daySessions.length === 0 ? (
                  <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center p-3">
                    <span className="text-[11px] font-medium">No Lectures Scheduled</span>
                  </div>
                ) : (
                  daySessions.map((s) => {
                    const color = s.subject?.colorHex || '#6366f1';
                    return (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl p-3.5 border shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        style={{ borderLeftWidth: '5px', borderLeftColor: color }}
                      >
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1.5">
                          <span
                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block"
                            style={{ backgroundColor: `${color}15`, color: color }}
                          >
                            {s.subject?.name}
                          </span>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {s.startTime} - {s.endTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{s.teacher?.user?.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.roomNumber}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Session Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Schedule Class Session</h3>
                <p className="text-xs text-slate-400">Validates faculty availability and room allocations</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleAddSession} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Faculty Member</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Day of Week</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {days.map((d) => (
                    <option key={d.dayNumber} value={d.dayNumber}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Room / Lecture Hall</label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. Hall A-101"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  {saving ? 'Validating...' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

