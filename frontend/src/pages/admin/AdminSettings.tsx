import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Settings, ShieldCheck, Activity, Save, CheckCircle2, Clock } from 'lucide-react';
import { InstituteSettings } from '../../types';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<InstituteSettings>({
    id: 'default',
    instituteName: 'ACE Academy',
    tagLine: 'Excellence in JEE, NEET & Foundational Sciences',
    contactEmail: 'admissions@aceacademy.edu',
    contactPhone: '+91 98765 43210',
    address: 'ACE Towers, Knowledge Corridor, Shivaji Nagar, Pune 411005',
    lateArrivalCutoffMinutes: 30,
    whatsappProvider: 'MOCK',
    whatsappApiKey: '',
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [resSettings, resLogs] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/audit-logs'),
      ]);
      if (resSettings.data) setSettings(resSettings.data);
      setAuditLogs(resLogs.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.put('/admin/settings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Institute Settings & Audit Trail</h1>
        <p className="text-xs text-slate-500">Configure operational rules, attendance cutoff limits, and review audit records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-slate-800 text-sm">General Institute Profile & Policies</h2>
            </div>

            {savedSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Institute settings saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Institute Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.instituteName}
                    onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Motto / Tagline</label>
                  <input
                    type="text"
                    value={settings.tagLine}
                    onChange={(e) => setSettings({ ...settings, tagLine: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Admissions Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Admissions Desk Phone</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Campus Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Attendance Timing Rules</span>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Late Arrival & Absentee Cutoff (Minutes past batch start)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.lateArrivalCutoffMinutes}
                      onChange={(e) => setSettings({ ...settings, lateArrivalCutoffMinutes: Number(e.target.value) })}
                      className="w-24 bg-white border border-slate-200 p-2 rounded-xl font-bold text-slate-800 text-center"
                    />
                    <span className="text-slate-500">Minutes (Default: 30 minutes)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Business API Provider</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Active Provider</label>
                    <select
                      value={settings.whatsappProvider}
                      onChange={(e) => setSettings({ ...settings, whatsappProvider: e.target.value })}
                      className="w-full bg-white border border-slate-200 p-2 rounded-xl font-semibold"
                    >
                      <option value="MOCK">Development Preview / Simulator</option>
                      <option value="META">Meta WhatsApp Cloud API</option>
                      <option value="TWILIO">Twilio for WhatsApp</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">API Key / Token (Optional)</label>
                    <input
                      type="password"
                      value={settings.whatsappApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                      placeholder="wa_live_key_••••••••"
                      className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Institute Configuration'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Audit Trail List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Security & Audit History</h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 uppercase text-[10px] bg-indigo-50 px-2 py-0.5 rounded-md">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-tight">{log.details}</p>
                  <p className="text-[10px] text-slate-400">By: {log.user?.name || 'System'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

