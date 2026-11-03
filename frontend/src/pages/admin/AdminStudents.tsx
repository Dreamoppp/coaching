import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Layers,
  Download,
} from 'lucide-react';
import { Student, Batch } from '../../types';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeQRStudent, setActiveQRStudent] = useState<Student | null>(null);

  // New Student Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    gender: 'Male',
    bloodGroup: 'B+',
    batchId: '',
    parentName: '',
    parentPhone: '',
    whatsappNumber: '',
    feeAmount: 90000,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedBatch) params.batchId = selectedBatch;

      const [resStudents, resBatches] = await Promise.all([
        api.get('/admin/students', { params }),
        api.get('/admin/batches'),
      ]);

      setStudents(resStudents.data);
      setBatches(resBatches.data);
      if (resBatches.data.length > 0 && !formData.batchId) {
        setFormData((prev) => ({ ...prev, batchId: resBatches.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await api.post('/admin/students', formData);
      setIsRegisterOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        rollNumber: '',
        gender: 'Male',
        bloodGroup: 'B+',
        batchId: batches[0]?.id || '',
        parentName: '',
        parentPhone: '',
        whatsappNumber: '',
        feeAmount: 90000,
      });
      fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student ${name}? This will remove all their enrollments and attendance records.`)) {
      try {
        await api.delete(`/admin/students/${id}`);
        fetchStudents();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete student');
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Directory & Enrollment</h1>
          <p className="text-xs text-slate-500">Manage student profiles, QR badges, and batch assignments</p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll number, email..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Layers className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-auto"
          >
            <option value="">All Cohorts / Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Student Info</th>
                <th className="py-3.5 px-6">Roll & QR Code</th>
                <th className="py-3.5 px-6">Batch & Course</th>
                <th className="py-3.5 px-6">Parent WhatsApp</th>
                <th className="py-3.5 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.user.name}`}
                          alt={s.user.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{s.user.name}</p>
                          <p className="text-[11px] text-slate-400">{s.user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {s.rollNumber}
                        </span>
                        <button
                          onClick={() => setActiveQRStudent(s)}
                          className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-800">
                        {s.enrollments?.[0]?.batch?.name || 'Not Enrolled'}
                      </p>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {s.enrollments?.[0]?.batch?.course?.code || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-mono">{s.parentContact?.whatsappNumber || 'N/A'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{s.parentContact?.fatherName || 'Parent'}</p>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveQRStudent(s)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Show QR
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.user.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Register Student Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">Register Student</h3>
                <p className="text-xs text-slate-400">Generates unique student ID, QR badge & parent contact</p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ishan Verma"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ishan@student.aceacademy.edu"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="ACE-2026-006"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl uppercase font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Blood Group</label>
                  <input
                    type="text"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    placeholder="O+"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Enroll in Batch *</label>
                <select
                  required
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.batchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Parent / Guardian WhatsApp Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Parent Name</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Ramesh Verma"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">WhatsApp Phone (+91...) *</label>
                    <input
                      type="text"
                      required
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="+919876543210"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  {submitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Badge Modal */}
      {activeQRStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                ACE Student Identity Pass
              </span>
              <button
                onClick={() => setActiveQRStudent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={activeQRStudent.qrCode}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-800">{activeQRStudent.user.name}</h3>
              <p className="text-xs font-mono font-bold text-indigo-600">{activeQRStudent.rollNumber}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {activeQRStudent.enrollments?.[0]?.batch?.name}
              </p>
            </div>

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              Scan with the Gate Desk Scanner or Mobile Reception device to log instant arrival.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

