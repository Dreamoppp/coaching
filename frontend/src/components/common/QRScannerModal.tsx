import React, { useState } from 'react';
import api from '../../services/api';
import { QrCode, Camera, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (data: any) => void;
  batchId?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  batchId,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; student?: any } | null>(null);

  if (!isOpen) return null;

  const handleScan = async (codeToScan: string) => {
    if (!codeToScan.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/attendance/scan', {
        qrData: codeToScan.trim(),
        batchId,
      });

      setResult({
        success: true,
        message: res.data.message || 'Check-in recorded successfully!',
        student: res.data.student,
      });

      if (onScanSuccess) {
        onScanSuccess(res.data);
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Check-in failed or student unrecognized.',
        student: err.response?.data?.student,
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleQRCodes = [
    { label: 'Aarav Mehta (Roll 001)', code: 'ACE-QR-AARAV-001' },
    { label: 'Diya Sengupta (Roll 002)', code: 'ACE-QR-DIYA-002' },
    { label: 'Rohan Iyer (Roll 003)', code: 'ACE-QR-ROHAN-003' },
    { label: 'Ananya Deshmukh (Roll 004)', code: 'ACE-QR-ANANYA-004' },
    { label: 'Kabir Kapoor (Roll 005)', code: 'ACE-QR-KABIR-005' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">QR Attendance Scanner</h3>
            <p className="text-xs text-slate-400">Reception Check-in Desk</p>
          </div>
        </div>

        {/* Camera Visual Target Area */}
        <div className="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden mb-5">
          <div className="w-36 h-36 mx-auto border-2 border-dashed border-indigo-400/80 rounded-2xl flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br" />
            <Camera className="w-8 h-8 text-indigo-300 mb-2 animate-pulse" />
            <span className="text-[10px] text-indigo-200 font-medium">Scanning Sensor Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Align student card QR code inside the frame</p>
        </div>

        {/* Result Banner */}
        {result && (
          <div
            className={`p-4 rounded-2xl mb-4 flex items-start gap-3 ${
              result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold">{result.message}</p>
              {result.student && (
                <div className="mt-1 text-[11px] opacity-90">
                  <p>Student: <strong>{result.student.name}</strong> ({result.student.rollNumber})</p>
                  <p>Batch: {result.student.batchName}</p>
                  <p>Status: <span className="font-bold uppercase">{result.student.status || 'Verified'}</span></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fast Scanner Code Input */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">Manual Code / Barcode Input:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. ACE-QR-AARAV-001"
              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => handleScan(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {loading ? 'Scanning...' : 'Verify'}
            </button>
          </div>

          {/* Quick Demo QR Test Buttons */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Quick Demo Scanner Tests:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sampleQRCodes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    setManualCode(s.code);
                    handleScan(s.code);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

