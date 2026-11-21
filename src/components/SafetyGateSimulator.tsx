import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Sliders,
  Check,
  UserCheck,
  Lock,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AccountSafetyConfig, Lead } from '../types';

interface SafetyGateSimulatorProps {
  account: AccountSafetyConfig;
  leads: Lead[];
}

type TestScenario = 'safe_pass' | 'quota_cap' | 'outside_hours' | 'dnc_match' | 'pending_approval' | 'tripwire';

export const SafetyGateSimulator: React.FC<SafetyGateSimulatorProps> = ({
  account,
  leads
}) => {
  // Configurable diagnostic test state
  const [isHealthy, setIsHealthy] = useState<boolean>(account.healthScore >= 60);
  const [isWithinQuota, setIsWithinQuota] = useState<boolean>(account.invitesSentToday < account.dailyInviteCap);
  const [isInsideHours, setIsInsideHours] = useState<boolean>(true);
  const [isDncMatch, setIsDncMatch] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [isTripwireTriggered, setIsTripwireTriggered] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<TestScenario>('safe_pass');
  const [jitterSeconds, setJitterSeconds] = useState<number>(84);

  // Apply predefined scenarios for rapid testing
  const selectScenario = (scenario: TestScenario) => {
    setActiveScenario(scenario);
    switch (scenario) {
      case 'safe_pass':
        setIsHealthy(true);
        setIsWithinQuota(true);
        setIsInsideHours(true);
        setIsDncMatch(false);
        setIsApproved(true);
        setIsTripwireTriggered(false);
        setJitterSeconds(Math.floor(Math.random() * (160 - 50 + 1)) + 50);
        break;
      case 'quota_cap':
        setIsHealthy(true);
        setIsWithinQuota(false);
        setIsInsideHours(true);
        setIsDncMatch(false);
        setIsApproved(true);
        setIsTripwireTriggered(false);
        break;
      case 'outside_hours':
        setIsHealthy(true);
        setIsWithinQuota(true);
        setIsInsideHours(false);
        setIsDncMatch(false);
        setIsApproved(true);
        setIsTripwireTriggered(false);
        break;
      case 'dnc_match':
        setIsHealthy(true);
        setIsWithinQuota(true);
        setIsInsideHours(true);
        setIsDncMatch(true);
        setIsApproved(true);
        setIsTripwireTriggered(false);
        break;
      case 'pending_approval':
        setIsHealthy(true);
        setIsWithinQuota(true);
        setIsInsideHours(true);
        setIsDncMatch(false);
        setIsApproved(false);
        setIsTripwireTriggered(false);
        break;
      case 'tripwire':
        setIsHealthy(true);
        setIsWithinQuota(true);
        setIsInsideHours(true);
        setIsDncMatch(false);
        setIsApproved(true);
        setIsTripwireTriggered(true);
        break;
    }
  };

  // Evaluate the 6 core safety pillars
  const runDiagnostics = () => {
    const checks = [
      {
        id: 'account_integrity',
        title: 'Account Health & Integrity',
        description: isHealthy ? 'Account active with healthy safety score (>= 60%)' : 'Health score below 60% or account flagged',
        passed: isHealthy,
        critical: true
      },
      {
        id: 'safety_tripwire',
        title: 'Anti-Bot & Tripwire Monitor',
        description: !isTripwireTriggered ? 'No unusual challenges or security checkpoints detected' : 'Security challenge detected; protective pause triggered',
        passed: !isTripwireTriggered,
        critical: true
      },
      {
        id: 'velocity_pacing',
        title: 'Daily & Weekly Velocity Pacing',
        description: isWithinQuota ? `Within safety threshold (${account.invitesSentToday}/${account.dailyInviteCap} used)` : `Daily limit of ${account.dailyInviteCap} reached; queue postponed`,
        passed: isWithinQuota,
        critical: false
      },
      {
        id: 'timezone_window',
        title: 'Prospect Business Hours',
        description: isInsideHours ? 'Recipient is currently inside local 9:00 AM – 6:00 PM window' : 'Outside prospect working hours; holding until next morning',
        passed: isInsideHours,
        critical: false
      },
      {
        id: 'dnc_dedup',
        title: 'DNC & Deduplication Check',
        description: !isDncMatch ? 'Lead cleared: Not in Do-Not-Contact registry and not contacted in 90 days' : 'Matched company DNC blacklist or previously contacted',
        passed: !isDncMatch,
        critical: true
      },
      {
        id: 'human_review',
        title: 'Message Studio Sign-Off',
        description: isApproved ? 'Outreach approved for dispatch' : 'Awaiting manual confirmation in Review Queue',
        passed: isApproved,
        critical: false
      }
    ];

    // Determine aggregate verdict
    if (!isHealthy) {
      return {
        verdict: 'BLOCKED',
        color: 'text-red-400 bg-red-500/10 border-red-500/20',
        badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
        summary: 'Account health score is degraded. All automated dispatches are blocked to protect account longevity.',
        action: 'Halt all outreach and review account standing.',
        checks
      };
    }

    if (isTripwireTriggered) {
      return {
        verdict: 'SAFETY PAUSE',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        summary: 'Anti-bot tripwire triggered. Protective cooldown applied to prevent LinkedIn account restrictions.',
        action: 'System enters 72-hour protective cooling mode.',
        checks
      };
    }

    if (!isWithinQuota) {
      return {
        verdict: 'RESCHEDULED',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        summary: 'Daily rate threshold reached. Outgoing action queued for the next available sending slot tomorrow.',
        action: 'Queued for automatic dispatch at next active window (09:00 AM).',
        checks
      };
    }

    if (!isInsideHours) {
      return {
        verdict: 'OUTSIDE HOURS',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        summary: 'Recipient timezone is currently in off-hours. Outreach is held to ensure delivery during work hours.',
        action: 'Action rescheduled for recipient\'s local 9:00 AM window.',
        checks
      };
    }

    if (isDncMatch) {
      return {
        verdict: 'SKIPPED',
        color: 'text-slate-400 bg-slate-800/60 border-slate-700',
        badge: 'bg-slate-700 text-slate-300 border border-slate-600',
        summary: 'Prospect or domain is registered on your Do-Not-Contact blacklist. Skipped without consuming quota.',
        action: 'Skipped permanently. Lead marked as DNC in directory.',
        checks
      };
    }

    if (!isApproved) {
      return {
        verdict: 'AWAITING APPROVAL',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        summary: 'Action is waiting for human operator sign-off in the Message Studio review queue.',
        action: 'Visit Message Studio to approve or edit draft.',
        checks
      };
    }

    return {
      verdict: 'PASSED · SAFE TO SEND',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      summary: `All 6 safety gates verified! Outgoing action cleared with human-like randomized spacing (${jitterSeconds}s delay).`,
      action: `Dispatched automatically via authenticated session in ${jitterSeconds}s.`,
      checks
    };
  };

  const result = runDiagnostics();
  const passedCount = result.checks.filter(c => c.passed).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Live Health Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Safety Gate Diagnostics</h1>
                <p className="text-xs text-slate-400">
                  Pre-flight verification engine enforcing anti-ban pacing, DNC protection, and organic jitter.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Status Pill Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Health:</span>
              <span className="font-bold text-white">{account.healthScore}/100</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Today:</span>
              <span className="font-bold text-white">{account.invitesSentToday}/{account.dailyInviteCap}</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Random Delay:</span>
              <span className="font-bold text-white">45–180s</span>
            </div>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Quick Diagnostic Test Scenarios:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              { id: 'safe_pass' as TestScenario, label: 'Standard Clean', icon: CheckCircle2, activeBg: 'bg-emerald-600 text-white' },
              { id: 'quota_cap' as TestScenario, label: 'Cap Reached', icon: Clock, activeBg: 'bg-amber-600 text-white' },
              { id: 'outside_hours' as TestScenario, label: 'After Hours', icon: Calendar, activeBg: 'bg-sky-600 text-white' },
              { id: 'dnc_match' as TestScenario, label: 'DNC Block', icon: Lock, activeBg: 'bg-slate-600 text-white' },
              { id: 'pending_approval' as TestScenario, label: 'Awaiting Sign-off', icon: UserCheck, activeBg: 'bg-purple-600 text-white' },
              { id: 'tripwire' as TestScenario, label: 'Tripwire Alert', icon: ShieldAlert, activeBg: 'bg-rose-600 text-white' },
            ].map(sc => {
              const Icon = sc.icon;
              const isSelected = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => selectScenario(sc.id)}
                  className={`py-2 px-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    isSelected
                      ? `${sc.activeBg} border-transparent shadow-lg font-semibold`
                      : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Diagnostic Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Test Condition Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Pre-Flight Test Parameters</h3>
              </div>
              <button
                onClick={() => selectScenario('safe_pass')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Account Standing */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Account Standing</div>
                  <p className="text-[11px] text-slate-400">Health score and session token validity</p>
                </div>
                <button
                  onClick={() => setIsHealthy(!isHealthy)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    isHealthy 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {isHealthy ? 'Healthy (94%)' : 'Degraded (<60%)'}
                </button>
              </div>

              {/* Pacing / Velocity */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Daily Velocity Limit</div>
                  <p className="text-[11px] text-slate-400">Current volume vs. daily cap ({account.dailyInviteCap})</p>
                </div>
                <button
                  onClick={() => setIsWithinQuota(!isWithinQuota)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    isWithinQuota 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isWithinQuota ? 'Under Limit' : 'Cap Hit'}
                </button>
              </div>

              {/* Prospect Local Hours */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Prospect Business Hours</div>
                  <p className="text-[11px] text-slate-400">Target local timezone (9:00 AM – 6:00 PM)</p>
                </div>
                <button
                  onClick={() => setIsInsideHours(!isInsideHours)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    isInsideHours 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}
                >
                  {isInsideHours ? 'Business Hours' : 'Night Timezone'}
                </button>
              </div>

              {/* DNC & Blacklist */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Do-Not-Contact Registry</div>
                  <p className="text-[11px] text-slate-400">Exclusions, competitors, & prior touches</p>
                </div>
                <button
                  onClick={() => setIsDncMatch(!isDncMatch)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    !isDncMatch 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {!isDncMatch ? 'Clean Prospect' : 'Blacklisted'}
                </button>
              </div>

              {/* Operator Approval */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Operator Sign-Off</div>
                  <p className="text-[11px] text-slate-400">Human review in Message Studio</p>
                </div>
                <button
                  onClick={() => setIsApproved(!isApproved)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    isApproved 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}
                >
                  {isApproved ? 'Approved' : 'Needs Review'}
                </button>
              </div>

              {/* Security Tripwire */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Anti-Bot Tripwire Guard</div>
                  <p className="text-[11px] text-slate-400">Unusual challenge detection flag</p>
                </div>
                <button
                  onClick={() => setIsTripwireTriggered(!isTripwireTriggered)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                    !isTripwireTriggered 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {!isTripwireTriggered ? 'Clear' : 'Challenge Flagged'}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Live Safety Verdict & Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Verdict Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pre-Flight Audit Verdict</span>
              <span className="text-xs text-slate-500 font-medium">{passedCount} of 6 Checks Passed</span>
            </div>

            <div className={`p-5 rounded-xl border ${result.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${result.badge}`}>
                  {result.verdict}
                </span>
                <span className="text-[11px] font-mono opacity-75">Auto-Protected</span>
              </div>
              <p className="text-sm font-medium text-white pt-1">
                {result.summary}
              </p>
              <div className="text-xs text-slate-300 pt-1 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-200">Next Action:</span>
                <span>{result.action}</span>
              </div>
            </div>

            {/* Comprehensive Safety Checks List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Verification Details:
              </span>

              <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                {result.checks.map(chk => (
                  <div key={chk.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/20 transition">
                    <div className="flex items-center gap-3">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{chk.title}</div>
                        <div className="text-[11px] text-slate-400">{chk.description}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      chk.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {chk.passed ? 'PASS' : 'HOLD'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
