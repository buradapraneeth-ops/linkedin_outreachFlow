import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Users, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2,
  Building2,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<'customer' | 'admin'>('customer');
  const [email, setEmail] = useState('praneeth@techinnovate.io');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleTabChange = (role: 'customer' | 'admin') => {
    setSelectedRoleTab(role);
    setError(null);
    if (role === 'customer') {
      setEmail('praneeth@techinnovate.io');
    } else {
      setEmail('admin@outreachflow.com');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim(), password);
      onLogin(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (targetEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(targetEmail, 'password');
      onLogin(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 shadow-xl shadow-blue-500/20 text-white font-bold text-2xl mb-1">
            in
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">OutreachFlow</h1>
          <p className="text-xs text-slate-400">
            AI-Personalized LinkedIn Outreach & Anti-Ban Safety Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          
          {/* Role Switcher Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('customer')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedRoleTab === 'customer'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('admin')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedRoleTab === 'admin'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>System Admin</span>
            </button>
          </div>

          {/* Quick 1-Click Demo Login Banner */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Portal Sign-in:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Dynamic Auth</span>
            </div>

            {selectedRoleTab === 'customer' ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('praneeth@techinnovate.io')}
                className="w-full text-left bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 p-2.5 rounded-lg transition flex items-center justify-between text-xs group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-blue-300 transition">
                    Praneeth Burada (Customer)
                  </div>
                  <div className="text-[11px] text-slate-400">Founder & Head of Growth · TechInnovate AI</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('admin@outreachflow.com')}
                className="w-full text-left bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 p-2.5 rounded-lg transition flex items-center justify-between text-xs group disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-purple-300 transition">
                    Alex Vance (Super Admin)
                  </div>
                  <div className="text-[11px] text-slate-400">Global Fleet Administrator · OutreachFlow HQ</div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct Credential Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                selectedRoleTab === 'customer'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
              }`}
            >
              <span>{isLoading ? 'Verifying Session...' : selectedRoleTab === 'customer' ? 'Sign In to Customer Portal' : 'Sign In to Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Guarantee Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control · Dynamic Backend Session</span>
          </div>

        </div>

      </div>

    </div>
  );
};
