import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import { QrCode, CheckCircle2, Clock, Calendar, Users, Layers } from 'lucide-react';
import { Batch } from '../../types';

export const TeacherAttendance: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [studentsAttendance, setStudentsAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const loadBatches = async () => {
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data);
      if (res.data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    if (!selectedBatchId) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance/batch/${selectedBatchId}`, {
        params: { date: selectedDate },
      });
      setStudentsAttendance(res.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadAttendance();
    }
  }, [selectedBatchId, selectedDate]);

  const handleToggle = async (studentId: string, status: string) => {
    try {
      await api.put('/attendance/absentee-status', {
        studentId,
        batchId: selectedBatchId,
        status,
        callStatus: status === 'PRESENT' ? 'NOT_REQUIRED' : 'PENDING',
      });
      loadAttendance();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lecture Attendance Register</h1>
          <p className="text-xs text-slate-500">Scan student badges or mark presence manually for your assigned cohort</p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Launch QR Scanner</span>
        </button>
      </div>

      {/* Filter bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Batch Cohort</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none font-mono"
            />
          </div>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          {studentsAttendance.filter((s) => s.status === 'PRESENT').length} of {studentsAttendance.length} Present
        </span>
      </Card>

      {/* Attendance Register Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Roll & Student Name</th>
                <th className="py-3.5 px-6">Check-in Time</th>
                <th className="py-3.5 px-6">Method</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Quick Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading register...</td>
                </tr>
              ) : (
                studentsAttendance.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.name}`}
                          alt={s.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{s.rollNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono">
                      {s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>

                    <td className="py-3.5 px-6">
                      {s.scanMethod === 'QR' ? '📷 QR Scan' : s.scanMethod || 'Manual'}
                    </td>

                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'LATE'
                          ? 'bg-amber-100 text-amber-800'
                          : s.status === 'ABSENT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggle(s.studentId, 'PRESENT')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleToggle(s.studentId, 'LATE')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold"
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleToggle(s.studentId, 'ABSENT')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold"
                        >
                          Absent
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

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          loadAttendance();
        }}
        onScanSuccess={() => {
          loadAttendance();
        }}
        batchId={selectedBatchId}
      />
    </div>
  );
};

