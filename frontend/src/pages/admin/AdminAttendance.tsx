import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import { useSocket } from '../../context/SocketContext';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneCall,
  UserCheck,
  Calendar,
  Layers,
  Filter,
  Search,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Batch } from '../../types';

export const AdminAttendance: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'absentee'>('absentee');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Absentee update modal state
  const [selectedAbsentee, setSelectedAbsentee] = useState<any | null>(null);
  const [callStatus, setCallStatus] = useState('CALLED_CONFIRMED');
  const [absenteeRemarks, setAbsenteeRemarks] = useState('');
  const [statusOverride, setStatusOverride] = useState('ABSENT');

  const { socket } = useSocket();

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

  const loadBatchAttendance = async () => {
    if (!selectedBatchId) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance/batch/${selectedBatchId}`, {
        params: { date: selectedDate },
      });
      setAttendanceData(res.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAbsenteeAlerts = async () => {
    try {
      const res = await api.get('/attendance/absentee-alerts');
      setAbsentees(res.data.absentees || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBatches();
    loadAbsenteeAlerts();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchAttendance();
    }
  }, [selectedBatchId, selectedDate]);

  // Real-time socket attendance listener
  useEffect(() => {
    if (socket) {
      socket.on('attendance_update', () => {
        loadBatchAttendance();
        loadAbsenteeAlerts();
      });
      return () => {
        socket.off('attendance_update');
      };
    }
  }, [socket, selectedBatchId]);

  const handleUpdateAbsentee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsentee) return;

    try {
      await api.put('/attendance/absentee-status', {
        studentId: selectedAbsentee.studentId,
        batchId: selectedAbsentee.batchId,
        status: statusOverride,
        callStatus: callStatus,
        remarks: absenteeRemarks,
      });

      setSelectedAbsentee(null);
      setAbsenteeRemarks('');
      loadAbsenteeAlerts();
      loadBatchAttendance();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update absentee record');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">QR Gate Attendance & Absentee Desk</h1>
          <p className="text-xs text-slate-500">Live reception check-ins, automated 30-minute cutoff alerts & parent verification</p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Launch QR Scanner Desk</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('absentee')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'absentee'
              ? 'border-rose-600 text-rose-700 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>30-Min Absentee Cutoff Alert Board</span>
          {absentees.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
              {absentees.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'daily'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Batch Register & History</span>
        </button>
      </div>

      {/* TAB 1: ABSENTEE WORKFLOW (30-min Cutoff Alert Board) */}
      {activeTab === 'absentee' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950">
              <h4 className="font-bold text-sm">Automated Absentee Intelligence System</h4>
              <p className="mt-0.5 leading-relaxed">
                Students without a recorded check-in 30 minutes after their batch's scheduled start time are automatically surfaced below. Staff can call parents and log the response status (Confirmed, No Answer, Metro Delay, etc.).
              </p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Student Name</th>
                    <th className="py-3.5 px-6">Batch & Scheduled Start</th>
                    <th className="py-3.5 px-6">Parent Phone & WhatsApp</th>
                    <th className="py-3.5 px-6">Check-in Status</th>
                    <th className="py-3.5 px-6">Verification / Call Status</th>
                    <th className="py-3.5 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {absentees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">100% Turnout Achieved!</p>
                        <p className="text-[11px] text-slate-400">No overdue absentees detected across all active batches.</p>
                      </td>
                    </tr>
                  ) : (
                    absentees.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={a.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${a.studentName}`}
                              alt={a.studentName}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-800">{a.studentName}</p>
                              <p className="text-[10px] font-mono text-slate-400">{a.rollNumber}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-slate-800">{a.batchName}</p>
                          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Scheduled: {a.scheduledArrival}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700">
                            <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{a.parentPhone}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{a.parentName}</p>
                        </td>

                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            a.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            a.callStatus === 'CALLED_CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.callStatus === 'NO_ANSWER'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {a.callStatus.replace('_', ' ')}
                          </span>
                          {a.remarks && (
                            <p className="text-[11px] text-slate-500 mt-1 max-w-xs truncate">{a.remarks}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => {
                              setSelectedAbsentee(a);
                              setCallStatus(a.callStatus);
                              setAbsenteeRemarks(a.remarks || '');
                              setStatusOverride(a.status);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Update Log
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DAILY BATCH REGISTER */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.classStartTime})
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
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400">Total Enrolled:</span>{' '}
              <strong className="text-slate-800">{attendanceData.length} Students</strong>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Roll & Student</th>
                    <th className="py-3.5 px-6">Check-In Time</th>
                    <th className="py-3.5 px-6">Verification Method</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading attendance...
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((item) => (
                      <tr key={item.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                              alt={item.name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{item.rollNumber}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 font-mono text-xs">
                          {item.checkInTime
                            ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>

                        <td className="py-3.5 px-6">
                          <span className="text-[11px] font-medium text-slate-600">
                            {item.scanMethod === 'QR' ? '📷 QR Gate Scanner' : item.scanMethod || 'Manual'}
                          </span>
                        </td>

                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                await api.put('/attendance/absentee-status', {
                                  studentId: item.studentId,
                                  batchId: selectedBatchId,
                                  status: 'PRESENT',
                                  callStatus: 'NOT_REQUIRED',
                                });
                                loadBatchAttendance();
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold"
                            >
                              Present
                            </button>
                            <button
                              onClick={async () => {
                                await api.put('/attendance/absentee-status', {
                                  studentId: item.studentId,
                                  batchId: selectedBatchId,
                                  status: 'LATE',
                                  callStatus: 'NOT_REQUIRED',
                                });
                                loadBatchAttendance();
                              }}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold"
                            >
                              Late
                            </button>
                            <button
                              onClick={async () => {
                                await api.put('/attendance/absentee-status', {
                                  studentId: item.studentId,
                                  batchId: selectedBatchId,
                                  status: 'ABSENT',
                                  callStatus: 'PENDING',
                                });
                                loadBatchAttendance();
                              }}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold"
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
        </div>
      )}

      {/* Absentee Verification Modal */}
      {selectedAbsentee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full">
                Absentee Call & Verification
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2">
                {selectedAbsentee.studentName} ({selectedAbsentee.rollNumber})
              </h3>
              <p className="text-xs text-slate-500">
                Parent: {selectedAbsentee.parentName} ({selectedAbsentee.parentPhone})
              </p>
            </div>

            <form onSubmit={handleUpdateAbsentee} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Attendance Status</label>
                <select
                  value={statusOverride}
                  onChange={(e) => setStatusOverride(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold"
                >
                  <option value="ABSENT">Absent (Confirmed)</option>
                  <option value="LATE">Late (Expected to arrive)</option>
                  <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
                  <option value="EXCUSED">Excused (Medical / Prior Notice)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Parent Phone Verification Status</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-semibold"
                >
                  <option value="CALLED_CONFIRMED">Called & Parent Confirmed</option>
                  <option value="NO_ANSWER">No Answer / Ringing</option>
                  <option value="NOT_REACHABLE">Phone Switched Off / Not Reachable</option>
                  <option value="PENDING">Pending Staff Call</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Staff Remarks / Reason</label>
                <textarea
                  rows={2}
                  value={absenteeRemarks}
                  onChange={(e) => setAbsenteeRemarks(e.target.value)}
                  placeholder="e.g. Parent informed student has high fever; taking day off."
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAbsentee(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          loadBatchAttendance();
          loadAbsenteeAlerts();
        }}
        onScanSuccess={() => {
          loadBatchAttendance();
          loadAbsenteeAlerts();
        }}
        batchId={selectedBatchId}
      />
    </div>
  );
};

