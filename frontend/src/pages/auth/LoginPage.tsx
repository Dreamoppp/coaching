import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, Award, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@aceacademy.edu');
  const [password, setPassword] = useState('Ace@12345');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Ace@12345');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f0c29] flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-white">ACE ACADEMY</h1>
              <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest">Coaching Platform</p>
            </div>
          </Link>
        </div>

        {/* Main Login Card */}
        <div className="bg-white text-slate-800 rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign In to Portal</h2>
            <p className="text-xs text-slate-500">Access your personalized role dashboard</p>
          </div>

          {/* Quick Demo Autofill Pills */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick One-Click Demo Credentials:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@aceacademy.edu')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  email === 'admin@aceacademy.edu'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold mb-0.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] truncate">Dr. Vikram</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('rajesh.sharma@aceacademy.edu')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  email === 'rajesh.sharma@aceacademy.edu'
                    ? 'border-violet-600 bg-violet-50 text-violet-700 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold mb-0.5">
                  <GraduationCap className="w-3 h-3 text-violet-600" />
                  <span>Teacher</span>
                </div>
                <div className="text-[11px] truncate">Prof. Rajesh</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('aarav.mehta@student.aceacademy.edu')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  email === 'aarav.mehta@student.aceacademy.edu'
                    ? 'border-sky-600 bg-sky-50 text-sky-700 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold mb-0.5">
                  <Award className="w-3 h-3 text-sky-600" />
                  <span>Student</span>
                </div>
                <div className="text-[11px] truncate">Aarav M.</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@aceacademy.edu"
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In Now'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-indigo-600">
              ← Return to Academy Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

