import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { QRCodeSVG } from 'qrcode.react';
import { IdCard, QrCode, Sparkles, Printer, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentProfile;

  const qrValue = student?.qrCode || 'ACE-QR-AARAV-001';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Digital Pass & Gate QR</h1>
          <p className="text-xs text-slate-500">Official student identity card for automated gate check-in</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Badge</span>
        </button>
      </div>

      {/* Modern High-End Physical ID Card Mockup */}
      <div className="flex justify-center py-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative print:shadow-none print:border-none">
          {/* Card Lanyard Loop */}
          <div className="h-4 bg-slate-900 flex justify-center items-center">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] text-white p-6 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">ACE ACADEMY</h3>
                  <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-semibold">Excellence in Coaching</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                2026 - 2028
              </span>
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="p-6 space-y-5 text-center">
            <div className="relative inline-block mx-auto -mt-12">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl mx-auto"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h2>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                ROLL: {student?.rollNumber || 'ACE-2026-001'}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Batch Phoenix (JEE Advanced 2026)
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin={true}
              />
              <span className="block text-[10px] font-mono text-slate-400 mt-2 font-bold tracking-wider">
                {qrValue}
              </span>
            </div>

            {/* Emergency & Details Footer */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-left text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
                <p className="font-extrabold text-slate-800">{student?.bloodGroup || 'O+'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Contact</span>
                <p className="font-bold text-slate-800 font-mono text-[11px] truncate">
                  {student?.emergencyContact || '+91 98220 11001'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 py-2.5 px-6 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
            This card confirms authorized entry to ACE Academy campus facilities.
          </div>
        </div>
      </div>
    </div>
  );
};

