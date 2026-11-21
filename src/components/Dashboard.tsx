import React from 'react';
import { 
  ShieldCheck, 
  Send, 
  UserCheck, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { AccountSafetyConfig, Campaign, NavTab, LinkedInAccount } from '../types';

interface DashboardProps {
  account?: AccountSafetyConfig;
  activeAccount?: LinkedInAccount;
  accounts?: LinkedInAccount[];
  campaigns: Campaign[];
  onToggleCampaign: (id: string) => void;
  setCurrentTab: (tab: NavTab) => void;
  pendingApprovalsCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  account,
  activeAccount,
  accounts = [],
  campaigns,
  onToggleCampaign,
  setCurrentTab,
  pendingApprovalsCount
}) => {
  const effectiveName = activeAccount?.name || account?.accountName || 'LinkedIn Account';
  const effectiveHeadline = activeAccount?.headline || account?.profileHeadline || 'Professional Profile';
  const effectiveHealth = activeAccount?.health_score ?? account?.healthScore ?? 94;
  const effectiveWarmupActive = activeAccount?.warmup_active ?? account?.warmupModeActive ?? true;
  const effectiveWarmupDay = activeAccount?.warmup_day ?? account?.warmupDay ?? 11;
  const effectiveDailyCap = activeAccount?.daily_cap ?? account?.dailyInviteCap ?? 20;
  const effectiveInvitesToday = activeAccount?.invites_today ?? account?.invitesSentToday ?? 0;
  const effectiveWeeklyCap = activeAccount?.weekly_cap ?? account?.weeklyInviteCap ?? 100;
  const effectiveInvitesWeek = activeAccount?.invites_this_week ?? account?.invitesSentThisWeek ?? 0;
  const effectiveApprovalMode = activeAccount?.approval_mode ?? account?.approvalMode ?? 'manual';

  // Aggregate stats across campaigns
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalAccepted = campaigns.reduce((acc, c) => acc + c.acceptedCount, 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + c.repliedCount, 0);
  const totalBooked = campaigns.reduce((acc, c) => acc + c.bookedCount, 0);
  const acceptanceRate = totalSent > 0 ? ((totalAccepted / totalSent) * 100).toFixed(1) : '0.0';
  const replyRate = totalAccepted > 0 ? ((totalReplies / totalAccepted) * 100).toFixed(1) : '0.0';

  const dailyRemaining = Math.max(0, effectiveDailyCap - effectiveInvitesToday);
  const weeklyRemaining = Math.max(0, effectiveWeeklyCap - effectiveInvitesWeek);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Health Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-blue-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Outreach Engine Overview
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                LinkedIn Session Active
              </span>
              {accounts.length > 1 && (
                <button
                  onClick={() => setCurrentTab('accounts')}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 transition"
                >
                  <Layers className="w-3 h-3" />
                  <span>{accounts.length} Connected Accounts</span>
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {effectiveName} · {effectiveHeadline}
            </p>
          </div>

          {/* Health & Warmup Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {effectiveHealth}
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Account Health Score</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Excellent · Zero Risk Flags</span>
                </div>
              </div>
            </div>

            {effectiveWarmupActive && (
              <div className="bg-blue-950/40 border border-blue-800/40 px-3.5 py-2 rounded-lg">
                <div className="text-[11px] text-blue-300 font-medium">Warm-up Ramp Active</div>
                <div className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Day {effectiveWarmupDay} of 14 (Gradual Escalation)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Callout if Pending Approvals Exist */}
        {pendingApprovalsCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span><strong>{pendingApprovalsCount} AI message drafts</strong> are waiting for human review before sending.</span>
            </div>
            <button
              onClick={() => setCurrentTab('message-studio')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1 rounded font-medium transition flex items-center gap-1"
            >
              <span>Review Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Quota & Safe Limits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Today's Quota */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Today's Invite Quota</span>
            <span className="font-semibold text-white">{effectiveInvitesToday} / {effectiveDailyCap} sent</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (effectiveInvitesToday / Math.max(1, effectiveDailyCap)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{dailyRemaining} slots remaining today</span>
            <span className="text-emerald-400">Paced 45s-180s</span>
          </div>
        </div>

        {/* Rolling 7-Day Window */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Rolling 7-Day Safe Ceiling</span>
            <span className="font-semibold text-white">{effectiveInvitesWeek} / {effectiveWeeklyCap}</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (effectiveInvitesWeek / Math.max(1, effectiveWeeklyCap)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{weeklyRemaining} invites safe buffer</span>
            <span className="text-slate-300 font-medium">Under 100 limit</span>
          </div>
        </div>

        {/* Mode / Circuit Breakers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Safety Engine Mode</span>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                {effectiveApprovalMode}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Tripwire: <span className="text-emerald-400 font-semibold">Active (&lt;15% acceptance pause)</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Anti-spam jitter: ON</span>
            <button 
              onClick={() => setCurrentTab('settings')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Configure →
            </button>
          </div>
        </div>

      </div>

      {/* Aggregate Funnel Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Invites Dispatched</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSent}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">100%</span>
            <span>human randomized</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Acceptance Rate</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{acceptanceRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{totalAccepted}</span>
            <span className="text-slate-400"> connections accepted</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Reply Rate</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{replyRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-purple-400 font-semibold">{totalReplies}</span>
            <span className="text-slate-400"> conversations started</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Meetings Booked</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalBooked}</div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            High-intent qualified demos
          </div>
        </div>

      </div>

      {/* Active Outreach Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Campaigns</h2>
            <p className="text-xs text-slate-400">Currently executing sequences and cadence delivery</p>
          </div>
          <button
            onClick={() => setCurrentTab('campaigns')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Manage All Campaigns</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Accepted</th>
                <th className="py-3 px-4">Replies</th>
                <th className="py-3 px-4">Booked</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No campaigns created yet. Click "Manage All Campaigns" to create one.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const assignedAccount = accounts.find(a => a.id === camp.account_id);
                  return (
                    <tr key={camp.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{camp.name}</div>
                        <div className="text-[11px] text-slate-400">Automated sequence</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {assignedAccount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="truncate max-w-[120px]">{assignedAccount.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Default Account</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          camp.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : camp.status === 'paused'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            camp.status === 'running' ? 'bg-emerald-400' : camp.status === 'paused' ? 'bg-amber-400' : 'bg-slate-500'
                          }`} />
                          <span className="capitalize">{camp.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{camp.leadCount}</td>
                      <td className="py-3.5 px-4 text-slate-300">{camp.sentCount}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {camp.acceptedCount} 
                        {camp.sentCount > 0 && (
                          <span className="text-slate-500 text-[10px] ml-1">
                            ({Math.round((camp.acceptedCount / camp.sentCount) * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {camp.repliedCount}
                        {camp.acceptedCount > 0 && (
                          <span className="text-slate-500 text-[10px] ml-1">
                            ({Math.round((camp.repliedCount / camp.acceptedCount) * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">{camp.bookedCount}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onToggleCampaign(camp.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            camp.status === 'running'
                              ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={camp.status === 'running' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {camp.status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
