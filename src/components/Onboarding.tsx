import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { AccountSafetyConfig, NavTab } from '../types';

interface OnboardingProps {
  account: AccountSafetyConfig;
  onUpdateAccount: (updated: Partial<AccountSafetyConfig>) => void;
  setCurrentTab: (tab: NavTab) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  account,
  onUpdateAccount,
  setCurrentTab
}) => {
  const [step, setStep] = useState<number>(1);
  const [sendingMode, setSendingMode] = useState<'approve_all' | 'autonomous_safe'>('approve_all');
  const [dailyCap, setDailyCap] = useState<number>(account.dailyInviteCap);

  const handleFinish = () => {
    onUpdateAccount({
      approvalMode: sendingMode,
      dailyInviteCap: dailyCap
    });
    setCurrentTab('dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      
      {/* Wizard Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span className={step >= 1 ? 'text-blue-400' : ''}>1. Connect LinkedIn</span>
          <span className={step >= 2 ? 'text-blue-400' : ''}>2. Safety & Approval Mode</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Connect LinkedIn Account */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Connect your LinkedIn Account</h2>
              <p className="text-sm text-slate-400 mt-1">
                We use a safe, semi-automated Chrome extension bridge that executes approved actions directly within your natural browser session.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border border-blue-500/30 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-white">{account.accountName}</div>
                  <div className="text-xs text-slate-400">{account.profileHeadline}</div>
                </div>
              </div>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Session Connected
              </span>
            </div>

            <div className="border-t border-slate-700/60 pt-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero cloud bot footprint · Session token encrypted via AES-256</span>
              </div>
              <span className="text-emerald-400 font-medium">Health: 94/100</span>
            </div>
          </div>

          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Recommended Compliance Architecture: Semi-Automated First</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Automated headless cloud scraping violates LinkedIn terms and increases restriction risk. OutreachFlow drafts and sequences in the cloud, while the companion extension submits actions with human randomized delays (45s–180s).
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <span>Continue to Safety Controls</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Safety & Sending Mode */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Sending Mode & Safety Pacing</h2>
            <p className="text-sm text-slate-400 mt-1">
              Choose how you want outgoing messages approved and set conservative pacing caps.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Mode 1: Human Approval (Recommended) */}
            <div 
              onClick={() => setSendingMode('approve_all')}
              className={`cursor-pointer border rounded-xl p-4 transition flex items-start gap-4 ${
                sendingMode === 'approve_all'
                  ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/80'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 mt-0.5 flex items-center justify-center shrink-0">
                {sendingMode === 'approve_all' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">Human-in-the-Loop Approval Queue</h3>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                    Highest Safety
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Every AI-drafted message lands in your Message Studio queue. You can 1-click approve, edit, or reject before the extension dispatches the touchpoint.
                </p>
              </div>
            </div>

            {/* Mode 2: Autonomous Safe */}
            <div 
              onClick={() => setSendingMode('autonomous_safe')}
              className={`cursor-pointer border rounded-xl p-4 transition flex items-start gap-4 ${
                sendingMode === 'autonomous_safe'
                  ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/80'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-slate-600 mt-0.5 flex items-center justify-center shrink-0">
                {sendingMode === 'autonomous_safe' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">Autonomous with Confidence Gate</h3>
                  <span className="bg-amber-500/15 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                    Semi-Auto
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Drafts with &gt;90% AI confidence are auto-approved. Borderline drafts are held for manual review. Hard stops on sudden acceptance drops.
                </p>
              </div>
            </div>

          </div>

          {/* Daily Invite Slider */}
          <div className="space-y-3 bg-slate-800/50 p-5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-white">Daily Connection Request Cap</label>
                <p className="text-xs text-slate-400">Conservative cap to protect your profile health.</p>
              </div>
              <div className="text-xl font-bold text-blue-400 font-mono">
                {dailyCap} <span className="text-xs text-slate-400 font-normal">/ day</span>
              </div>
            </div>

            <input 
              type="range" 
              min={5} 
              max={25} 
              value={dailyCap} 
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>5 (Ultra safe)</span>
              <span>15 (Recommended)</span>
              <span>25 (Warmed accounts)</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm px-4 py-2 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <span>Complete Setup & Launch Dashboard</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
