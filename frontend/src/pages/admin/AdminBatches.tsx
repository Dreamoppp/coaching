import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Layers, Plus, BookOpen, Calendar, Users, MapPin, Clock, X, AlertCircle } from 'lucide-react';
import { Batch, Course } from '../../types';

export const AdminBatches: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Batch Form
  const [batchForm, setBatchForm] = useState({
    courseId: '',
    name: '',
    batchCode: '',
    maxCapacity: 40,
    defaultRoom: 'Hall A-101',
    classStartTime: '09:00',
    startDate: new Date().toISOString().slice(0, 10),
  });

  // Course Form
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    durationMonths: 24,
    totalFees: 180000,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resBatches, resCourses] = await Promise.all([
        api.get('/admin/batches'),
        api.get('/admin/courses'),
      ]);
      setBatches(resBatches.data);
      setCourses(resCourses.data);
      if (resCourses.data.length > 0 && !batchForm.courseId) {
        setBatchForm((prev) => ({ ...prev, courseId: resCourses.data[0].id }));
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/admin/batches', batchForm);
      setIsBatchModalOpen(false);
      setBatchForm({
        courseId: courses[0]?.id || '',
        name: '',
        batchCode: '',
        maxCapacity: 40,
        defaultRoom: 'Hall A-101',
        classStartTime: '09:00',
        startDate: new Date().toISOString().slice(0, 10),
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create batch');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/admin/courses', courseForm);
      setIsCourseModalOpen(false);
      setCourseForm({
        code: '',
        name: '',
        description: '',
        durationMonths: 24,
        totalFees: 180000,
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create course');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Batches & Academic Programs</h1>
          <p className="text-xs text-slate-500">Manage cohorts, class timings, intake capacities, and curricula</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormError(null);
              setIsCourseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>New Course</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsBatchModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Active Cohorts / Batches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-8 text-center text-slate-400">Loading batches...</div>
          ) : (
            batches.map((b) => (
              <Card key={b.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {b.batchCode}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-800 mt-2 leading-tight">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{b.course?.name}</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-100 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      Class Start
                    </span>
                    <p className="font-bold text-slate-700 font-mono">{b.classStartTime}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      Room
                    </span>
                    <p className="font-bold text-slate-700">{b.defaultRoom || 'Hall A'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {b._count?.enrollments || 0} / {b.maxCapacity} Enrolled
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    In Progress
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Registered Courses & Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <Card key={c.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md">
                    {c.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-800 mt-2">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold">
                <span className="text-slate-600">Duration: {c.durationMonths} Months</span>
                <span className="text-emerald-700 font-extrabold text-sm">₹{c.totalFees.toLocaleString()} Total</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Create Cohort Batch</h3>
                <p className="text-xs text-slate-400">Assign program, daily timing, and intake strength</p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course / Program *</label>
                <select
                  value={batchForm.courseId}
                  onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Batch Display Name *</label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Batch Apex (NEET 2026)"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Batch Code *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchCode}
                    onChange={(e) => setBatchForm({ ...batchForm, batchCode: e.target.value })}
                    placeholder="APEX-NEET-26"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl uppercase font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max Capacity</label>
                  <input
                    type="number"
                    value={batchForm.maxCapacity}
                    onChange={(e) => setBatchForm({ ...batchForm, maxCapacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Class Scheduled Start *</label>
                  <input
                    type="time"
                    required
                    value={batchForm.classStartTime}
                    onChange={(e) => setBatchForm({ ...batchForm, classStartTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Default Lecture Hall</label>
                  <input
                    type="text"
                    value={batchForm.defaultRoom}
                    onChange={(e) => setBatchForm({ ...batchForm, defaultRoom: e.target.value })}
                    placeholder="Hall B-204"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add Academic Course</h3>
                <p className="text-xs text-slate-400">Define curriculum syllabus and total fee structure</p>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course Code *</label>
                <input
                  type="text"
                  required
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="JEE-ADV-2YR"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="IIT-JEE Pinnacle 2-Year"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration (Months)</label>
                  <input
                    type="number"
                    value={courseForm.durationMonths}
                    onChange={(e) => setCourseForm({ ...courseForm, durationMonths: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Program Fee (₹)</label>
                  <input
                    type="number"
                    value={courseForm.totalFees}
                    onChange={(e) => setCourseForm({ ...courseForm, totalFees: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

