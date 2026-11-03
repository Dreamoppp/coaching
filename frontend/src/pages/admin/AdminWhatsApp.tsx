import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Eye,
  RefreshCw,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Student, WhatsAppLog } from '../../types';

export const AdminWhatsApp: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any | null>(null);

  const loadStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
      if (res.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/whatsapp/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPreview = async (studentId: string) => {
    if (!studentId) return;
    setLoadingPreview(true);
    setSendResult(null);
    try {
      const res = await api.get(`/whatsapp/preview-report/${studentId}`);
      setPreviewData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadLogs();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadPreview(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleSendReport = async () => {
    if (!selectedStudentId) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await api.post('/whatsapp/send-monthly-report', {
        studentId: selectedStudentId,
        month: previewData?.month || 11,
        year: previewData?.year || 2026,
      });

      setSendResult(res.data);
      loadLogs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch WhatsApp report');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parent WhatsApp Monthly Progress Desk</h1>
        <p className="text-xs text-slate-500">
          Automated academic summaries, attendance logs, and report dispatch straight to parent WhatsApp phones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Selector & Interactive Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Student to Generate Report:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} ({s.rollNumber}) — Parent: {s.parentContact?.whatsappNumber || 'No WhatsApp'}
                  </option>
                ))}
              </select>
            </div>

            {loadingPreview ? (
              <div className="py-12 text-center text-slate-400">Compiling real academic metrics from database...</div>
            ) : previewData ? (
              <div className="space-y-4">
                {/* Visual WhatsApp Phone Mockup Container */}
                <div className="rounded-3xl bg-[#0b141a] p-4 text-white shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-[10px]">
                        ACE
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">ACE Academy Academic Desk</p>
                        <p className="text-[10px] text-emerald-400">Verified WhatsApp Business Channel</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Today</span>
                  </div>

                  {/* Formatted Message Bubble */}
                  <div className="my-4 bg-[#005c4b] p-4 rounded-2xl text-xs text-emerald-50 leading-relaxed font-sans shadow-md space-y-2 whitespace-pre-wrap">
                    {previewData.formattedMessage}
                  </div>

                  <div className="text-center text-[10px] text-slate-400">
                    🔒 Messages are end-to-end encrypted with parent consent token.
                  </div>
                </div>

                {/* Dispatch Trigger Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Parent Phone: {previewData.parentPhone}</p>
                    <p className="text-[11px] text-slate-500">
                      Configured Provider: <strong className="text-indigo-600">{previewData.provider}</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleSendReport}
                    disabled={sending || !previewData.parentPhone || previewData.parentPhone === 'N/A'}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Dispatching...' : 'Send to Parent WhatsApp'}</span>
                  </button>
                </div>

                {sendResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{sendResult.mode}</span>
                    </div>
                    <p className="text-[11px]">{sendResult.message}</p>
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </div>

        {/* Right: Real Delivery Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Delivery Tracking & Audit Logs</h3>
              </div>
              <button
                onClick={loadLogs}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No reports dispatched yet.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{log.parentPhone}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        log.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'SENT'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Student: <strong>{log.student?.user?.name || 'Aarav Mehta'}</strong>
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                      <span>ID: {log.externalMessageId || 'WA-REF-001'}</span>
                      <span>{new Date(log.sentAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

