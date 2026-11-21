import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  Ban, 
  Plus, 
  Trash2, 
  Check, 
  Zap, 
  Globe, 
  Key, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { AccountSafetyConfig, LinkedInAccount, DncRule } from '../types';
import { settingsApi } from '../services/api';

interface SettingsViewProps {
  account: AccountSafetyConfig;
  activeAccount?: LinkedInAccount;
  onUpdateAccount: (updated: Partial<AccountSafetyConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  account,
  activeAccount,
  onUpdateAccount
}) => {
  const [dailyCap, setDailyCap] = useState(activeAccount ? activeAccount.daily_cap : account.dailyInviteCap);
  const [weeklyCap, setWeeklyCap] = useState(activeAccount ? activeAccount.weekly_cap : account.weeklyInviteCap);
  const [warmupMode, setWarmupMode] = useState(activeAccount ? activeAccount.warmup_active : account.warmupModeActive);
  const [minDelay, setMinDelay] = useState(activeAccount ? activeAccount.min_delay : account.minDelaySeconds);
  const [maxDelay, setMaxDelay] = useState(activeAccount ? activeAccount.max_delay : account.maxDelaySeconds);
  const [autoPauseTripwire, setAutoPauseTripwire] = useState(account.autoPauseOnAcceptanceDrop);
  const [approvalMode, setApprovalMode] = useState(account.approvalMode);

  // Dynamic DNC List State
  const [dncRules, setDncRules] = useState<DncRule[]>([]);
  const [newDncItem, setNewDncItem] = useState('');
  const [saveAlert, setSaveAlert] = useState(false);

  useEffect(() => {
    if (activeAccount) {
      setDailyCap(activeAccount.daily_cap);
      setWeeklyCap(activeAccount.weekly_cap);
      setWarmupMode(activeAccount.warmup_active);
      setMinDelay(activeAccount.min_delay);
      setMaxDelay(activeAccount.max_delay);
    }
  }, [activeAccount]);

  useEffect(() => {
    const fetchDnc = async () => {
      try {
        const rules = await settingsApi.listDnc();
        setDncRules(rules);
      } catch (err) {
        console.error('Failed to load DNC rules', err);
      }
    };
    fetchDnc();
  }, []);

  const handleAddDnc = async () => {
    if (!newDncItem.trim()) return;
    try {
      const created = await settingsApi.addDnc(newDncItem.trim());
      setDncRules(prev => [...prev, created]);
      setNewDncItem('');
    } catch (err) {
      console.error('Failed to add DNC rule', err);
    }
  };

  const handleRemoveDnc = async (id: string) => {
    try {
      await settingsApi.deleteDnc(id);
      setDncRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to remove DNC rule', err);
    }
  };

  const handleSaveAll = () => {
    onUpdateAccount({
      dailyInviteCap: dailyCap,
      weeklyInviteCap: weeklyCap,
      warmupModeActive: warmupMode,
      minDelaySeconds: minDelay,
      maxDelaySeconds: maxDelay,
      autoPauseOnAcceptanceDrop: autoPauseTripwire,
      approvalMode: approvalMode
    });
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const currentHealth = activeAccount ? activeAccount.health_score : account.healthScore;
  const currentWarmupDay = activeAccount ? activeAccount.warmup_day : account.warmupDay;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Safety Engine & Account Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure safety pacing caps, anti-ban protections, warm-up scheduling, and Do-Not-Contact lists.
            {activeAccount && <span className="text-blue-400 font-medium ml-1">Configuring account: {activeAccount.name}</span>}
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
        >
          <Check className="w-4 h-4" />
          <span>{saveAlert ? 'Saved Successfully!' : 'Save Configuration'}</span>
        </button>
      </div>

      {saveAlert && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform safety settings updated. All active workers and extensions updated with new pacing.</span>
        </div>
      )}

      {/* Account Health Diagnostics Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Connected LinkedIn Account Health</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Account Health Score</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <span>{currentHealth} / 100</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Safe
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Acceptance rate &gt;30%, zero CAPTCHAs, low bounce rate.</p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Session Security Ref</div>
            <div className="text-xs font-mono text-slate-200 mt-1 truncate">
              {activeAccount?.session_token || 'li_at: enc_aes_9f88c3a...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Extension session active · AES-256 encrypted storage.</p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400">Warm-up Progression</div>
            <div className="text-sm font-bold text-blue-300 mt-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Day {currentWarmupDay} of 14</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pacing dynamically escalates by +2 invites every 3 days.</p>
          </div>
        </div>
      </div>

      {/* Safety Pacing & Caps Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Pacing & Rate Caps</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Safe practitioner guidelines recommend ~20/day and ~100/week on rolling 7-day windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Daily Invite Cap */}
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white">Daily Connection Request Cap</label>
              <span className="text-blue-400 font-bold text-sm">{dailyCap} / day</span>
            </div>
            <input 
              type="range" 
              min={5} 
              max={30} 
              value={dailyCap} 
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-slate-400 text-[11px]">
              Maximum connection requests sent in a calendar day. (Recommended: 15–20 for warmed accounts).
            </p>
          </div>

          {/* Weekly Invite Cap */}
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white">Weekly Connection Ceiling</label>
              <span className="text-cyan-400 font-bold text-sm">{weeklyCap} / week</span>
            </div>
            <input 
              type="range" 
              min={25} 
              max={150} 
              value={weeklyCap} 
              onChange={(e) => setWeeklyCap(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <p className="text-slate-400 text-[11px]">
              Rolling 7-day safety ceiling. Sequence hard-pauses if this limit is reached.
            </p>
          </div>

          {/* Inter-Action Delay (Human Jitter) */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 md:col-span-2">
            <label className="font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Gaussian Randomized Delay Between Actions</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-[11px]">Min Delay (seconds):</span>
                <input 
                  type="number"
                  value={minDelay}
                  onChange={(e) => setMinDelay(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Max Delay (seconds):</span>
                <input 
                  type="number"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-slate-400 text-[11px]">
              Simulates realistic human cadence with randomized sleep between profile views, invites, and messages.
            </p>
          </div>

        </div>
      </div>

      {/* Do-Not-Contact (DNC) Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            <span>Do-Not-Contact (DNC) & Exclusion Registry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Keywords, domains, and competitor names that automatically trigger safety tripwires and block outreach.
          </p>
        </div>

        {/* Add Input */}
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="e.g. competitor.com, @microsoft.com, stealth-startup"
            value={newDncItem}
            onChange={(e) => setNewDncItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDnc()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddDnc}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        {/* Dynamic DNC Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {dncRules.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No exclusion rules added yet.</p>
          ) : (
            dncRules.map((rule) => (
              <div 
                key={rule.id}
                className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 group"
              >
                <span>{rule.rule}</span>
                {rule.is_global && (
                  <span className="text-[9px] bg-red-500/20 px-1 py-0.5 rounded text-red-300">Global</span>
                )}
                <button
                  onClick={() => handleRemoveDnc(rule.id)}
                  className="text-red-400 hover:text-red-200 transition"
                  title="Remove exclusion rule"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
