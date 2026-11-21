import React, { useState } from 'react';
import { 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Pause, 
  Play, 
  Zap, 
  Key, 
  Check, 
  X,
  Sliders,
  Clock,
  Layers
} from 'lucide-react';
import { LinkedInAccount } from '../types';

interface AccountsManagerProps {
  accounts: LinkedInAccount[];
  activeAccountId: string;
  onSelectActiveAccount: (id: string) => void;
  onCreateAccount: (data: Partial<LinkedInAccount>) => Promise<void>;
  onUpdateAccount: (id: string, updates: Partial<LinkedInAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  activeAccountId,
  onSelectActiveAccount,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LinkedInAccount | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [dailyCap, setDailyCap] = useState(20);
  const [weeklyCap, setWeeklyCap] = useState(100);
  const [warmupActive, setWarmupActive] = useState(true);
  const [sessionToken, setSessionToken] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenConnect = () => {
    setName('');
    setHeadline('Founder & Head of Growth');
    setLinkedinUrl('https://linkedin.com/in/');
    setDailyCap(20);
    setWeeklyCap(100);
    setWarmupActive(true);
    setSessionToken('');
    setFormError(null);
    setShowConnectModal(true);
  };

  const handleSaveConnect = async () => {
    if (!name.trim() || !linkedinUrl.trim()) {
      setFormError('Account name and LinkedIn URL are required.');
      return;
    }

    await onCreateAccount({
      name: name.trim(),
      headline: headline.trim() || 'Professional Profile',
      linkedin_url: linkedinUrl.trim(),
      daily_cap: dailyCap,
      weekly_cap: weeklyCap,
      warmup_active: warmupActive,
      session_token: sessionToken || `enc_li_at_${Date.now()}`
    });

    setShowConnectModal(false);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    await onUpdateAccount(editingAccount.id, {
      name: editingAccount.name,
      headline: editingAccount.headline,
      daily_cap: editingAccount.daily_cap,
      weekly_cap: editingAccount.weekly_cap,
      warmup_active: editingAccount.warmup_active,
      min_delay: editingAccount.min_delay,
      max_delay: editingAccount.max_delay
    });
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Connected LinkedIn Accounts</span>
          </h1>
          <p className="text-xs text-slate-400">
            Connect and manage multiple LinkedIn accounts. Assign distinct accounts to specific outreach campaigns with isolated safety quotas.
          </p>
        </div>

        <button
          onClick={handleOpenConnect}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Connect LinkedIn Account</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acct => {
          const isPrimary = acct.id === activeAccountId;
          const isRunning = acct.status === 'active';
          const dailyPercent = Math.round((acct.invites_today / acct.daily_cap) * 100);

          return (
            <div 
              key={acct.id}
              className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition ${
                isPrimary ? 'border-blue-500/80 ring-1 ring-blue-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Account Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{acct.name}</h3>
                    {isPrimary && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                        Active Workspace
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{acct.headline}</p>
                  <a 
                    href={acct.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{acct.linkedin_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {acct.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Health & Quota Stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Health Score</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{acct.health_score}/100</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Today's Invites</span>
                  <span className="font-bold text-white mt-0.5 block font-mono">
                    {acct.invites_today} / {acct.daily_cap}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">7-Day Rolling</span>
                  <span className="font-bold text-cyan-400 mt-0.5 block font-mono">
                    {acct.invites_this_week} / {acct.weekly_cap}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Daily Quota Usage</span>
                  <span>{dailyPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${Math.min(dailyPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => onSelectActiveAccount(acct.id)}
                  disabled={isPrimary}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    isPrimary 
                      ? 'text-slate-500 cursor-default' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isPrimary ? 'Selected' : 'Use This Account'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateAccount(acct.id, { status: isRunning ? 'paused' : 'active' })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title={isRunning ? 'Pause Account' : 'Resume Account'}
                  >
                    {isRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => setEditingAccount(acct)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Edit Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {accounts.length > 1 && (
                    <button
                      onClick={() => onDeleteAccount(acct.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Connect New LinkedIn Account</h3>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Account Display Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Praneeth Burada (Sales Focus)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. VP of Business Development"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">LinkedIn Profile URL *</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Daily Invite Cap</label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={dailyCap}
                    onChange={(e) => setDailyCap(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Weekly Cap</label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    value={weeklyCap}
                    onChange={(e) => setWeeklyCap(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Session Cookie / Token</label>
                <input
                  type="text"
                  value={sessionToken}
                  onChange={(e) => setSessionToken(e.target.value)}
                  placeholder="li_at cookie or Extension pairing token"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Tokens are AES-256 encrypted in the isolated database.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConnectModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnect}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20"
              >
                Connect Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Edit Account Safety Limits</h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Display Name</label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Daily Cap</label>
                  <input
                    type="number"
                    value={editingAccount.daily_cap}
                    onChange={(e) => setEditingAccount({ ...editingAccount, daily_cap: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Weekly Cap</label>
                  <input
                    type="number"
                    value={editingAccount.weekly_cap}
                    onChange={(e) => setEditingAccount({ ...editingAccount, weekly_cap: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingAccount(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
