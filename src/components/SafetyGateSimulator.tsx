import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Ban, 
  RotateCcw,
  Sparkles,
  Terminal,
  Zap
} from 'lucide-react';
import { AccountSafetyConfig, Lead } from '../types';

interface SafetyGateSimulatorProps {
  account: AccountSafetyConfig;
  leads: Lead[];
}

export const SafetyGateSimulator: React.FC<SafetyGateSimulatorProps> = ({
  account,
  leads
}) => {
  // Simulator test inputs
  const [simAccountStatus, setSimAccountStatus] = useState<'active' | 'warning' | 'paused'>('active');
  const [simHealthScore, setSimHealthScore] = useState<number>(account.healthScore);
  const [simDailySent, setSimDailySent] = useState<number>(account.invitesSentToday);
  const [simDailyCap, setSimDailyCap] = useState<number>(account.dailyInviteCap);
  const [simWeeklySent, setSimWeeklySent] = useState<number>(account.invitesSentThisWeek);
  const [simWeeklyCap, setSimWeeklyCap] = useState<number>(account.weeklyInviteCap);
  const [simInLeadTimezoneWindow, setSimInLeadTimezoneWindow] = useState<boolean>(true);
  const [simIsDNC, setSimIsDNC] = useState<boolean>(false);
  const [simAlreadyContacted, setSimAlreadyContacted] = useState<boolean>(false);
  const [simNeedsApproval, setSimNeedsApproval] = useState<boolean>(true);
  const [simIsApproved, setSimIsApproved] = useState<boolean>(true);
  const [simCaptchaTripwire, setSimCaptchaTripwire] = useState<boolean>(false);
  const [simAcceptanceRate, setSimAcceptanceRate] = useState<number>(38);

  const [activePreset, setActivePreset] = useState<string>('normal_safe');

  // Calculate Section 7 Python Logic Decision
  const evaluateGate = () => {
    const checks: { id: string; name: string; status: 'pass' | 'fail' | 'warn'; detail: string }[] = [];

    // Check 1: Account status and health score
    if (simAccountStatus !== 'active' || simHealthScore < 60) {
      checks.push({
        id: 'c1',
        name: 'Account Health & Status',
        status: 'fail',
        detail: `Status=${simAccountStatus}, Health=${simHealthScore}/100 (<60 blocks)`
      });
      return {
        decision: 'BLOCK',
        actionOutcome: 'block("account")',
        statusColor: 'text-red-400 bg-red-500/10 border-red-500/30',
        reason: 'Account is paused or health score is below safe threshold (60).',
        checks
      };
    }
    checks.push({
      id: 'c1',
      name: 'Account Health & Status',
      status: 'pass',
      detail: `Health is ${simHealthScore}/100 (Safe >= 60) and status is Active.`
    });

    // Check 2: Trip wires (CAPTCHA or low acceptance rate)
    if (simCaptchaTripwire || simAcceptanceRate < 15) {
      checks.push({
        id: 'c2',
        name: 'Trip Wire / Anti-Bot Guard',
        status: 'fail',
        detail: simCaptchaTripwire ? 'CAPTCHA challenge detected.' : `Acceptance rate (${simAcceptanceRate}%) is under 15% threshold.`
      });
      return {
        decision: 'AUTO-PAUSE 72H',
        actionOutcome: 'auto_pause("tripwire")',
        statusColor: 'text-red-400 bg-red-500/10 border-red-500/30',
        reason: 'Trip wire triggered! Auto-pausing account for 72h to protect account health.',
        checks
      };
    }
    checks.push({
      id: 'c2',
      name: 'Trip Wire / Anti-Bot Guard',
      status: 'pass',
      detail: `No challenge detected, acceptance rate is healthy (${simAcceptanceRate}%).`
    });

    // Check 3: Daily & Weekly Quotas
    if (simWeeklySent >= simWeeklyCap || simDailySent >= simDailyCap) {
      checks.push({
        id: 'c3',
        name: 'Quota Pacing Check',
        status: 'fail',
        detail: `Daily (${simDailySent}/${simDailyCap}) or Weekly (${simWeeklySent}/${simWeeklyCap}) cap reached.`
      });
      return {
        decision: 'RESCHEDULE',
        actionOutcome: 'reschedule(next_window(acct))',
        statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        reason: 'Safety cap reached for today or rolling 7-day period. Postponing until window resets.',
        checks
      };
    }
    checks.push({
      id: 'c3',
      name: 'Quota Pacing Check',
      status: 'pass',
      detail: `Daily: ${simDailySent}/${simDailyCap} | Weekly: ${simWeeklySent}/${simWeeklyCap}`
    });

    // Check 4: Lead working hours in lead timezone
    if (!simInLeadTimezoneWindow) {
      checks.push({
        id: 'c4',
        name: 'Timezone & Working Hours',
        status: 'fail',
        detail: 'Current local time in prospect timezone is outside active campaign hours (9 AM - 6 PM).'
      });
      return {
        decision: 'RESCHEDULE',
        actionOutcome: 'reschedule(next_open_slot(action))',
        statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        reason: 'Lead is outside local business hours. Rescheduling for their next 9:00 AM window.',
        checks
      };
    }
    checks.push({
      id: 'c4',
      name: 'Timezone & Working Hours',
      status: 'pass',
      detail: 'Lead local time is inside campaign sending window (Mon-Fri 9am-6pm).'
    });

    // Check 5: DNC and Dedup
    if (simIsDNC || simAlreadyContacted) {
      checks.push({
        id: 'c5',
        name: 'DNC Blacklist & Deduplication',
        status: 'fail',
        detail: simIsDNC ? 'Prospect matches Do-Not-Contact blacklist.' : 'Prospect was already contacted within last 90 days.'
      });
      return {
        decision: 'SKIP',
        actionOutcome: 'skip()',
        statusColor: 'text-slate-400 bg-slate-800 border-slate-700',
        reason: 'Lead skipped without sending. No quota or action consumed.',
        checks
      };
    }
    checks.push({
      id: 'c5',
      name: 'DNC Blacklist & Deduplication',
      status: 'pass',
      detail: 'Lead URL and domain cleared: Not on DNC list, zero duplicate contacts.'
    });

    // Check 6: Human Approval Gate
    if (simNeedsApproval && !simIsApproved) {
      checks.push({
        id: 'c6',
        name: 'Human Approval Gate',
        status: 'warn',
        detail: 'Draft awaiting human sign-off in Message Studio Review Queue.'
      });
      return {
        decision: 'HOLD',
        actionOutcome: 'hold()',
        statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        reason: 'Action held in pending state until user clicks Approve in review studio.',
        checks
      };
    }
    checks.push({
      id: 'c6',
      name: 'Human Approval Gate',
      status: 'pass',
      detail: 'Draft approved by human operator.'
    });

    // Check 7: Randomized Spacing (Success Outcome)
    const randomDelay = Math.floor(Math.random() * (180 - 45 + 1)) + 45;
    checks.push({
      id: 'c7',
      name: 'Anti-Detection Random Jitter',
      status: 'pass',
      detail: `Calculated random spacing delay: ${randomDelay} seconds.`
    });

    return {
      decision: 'SEND_AFTER_DELAY',
      actionOutcome: `send_after(${randomDelay}s)`,
      statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      reason: `All 8 safety checks cleared! Action will be dispatched via extension in ${randomDelay} seconds.`,
      checks,
      delay: randomDelay
    };
  };

  const currentResult = evaluateGate();

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'normal_safe') {
      setSimAccountStatus('active');
      setSimHealthScore(94);
      setSimDailySent(14);
      setSimDailyCap(20);
      setSimWeeklySent(72);
      setSimWeeklyCap(100);
      setSimInLeadTimezoneWindow(true);
      setSimIsDNC(false);
      setSimAlreadyContacted(false);
      setSimNeedsApproval(true);
      setSimIsApproved(true);
      setSimCaptchaTripwire(false);
      setSimAcceptanceRate(38);
    } else if (preset === 'over_quota') {
      setSimDailySent(20);
      setSimDailyCap(20);
      setSimWeeklySent(100);
      setSimWeeklyCap(100);
      setSimInLeadTimezoneWindow(true);
      setSimIsDNC(false);
    } else if (preset === 'outside_timezone') {
      setSimDailySent(10);
      setSimInLeadTimezoneWindow(false);
    } else if (preset === 'dnc_hit') {
      setSimIsDNC(true);
    } else if (preset === 'unapproved') {
      setSimNeedsApproval(true);
      setSimIsApproved(false);
    } else if (preset === 'captcha_tripwire') {
      setSimCaptchaTripwire(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Interactive Safety Gate Simulator</span>
          </h1>
          <p className="text-xs text-slate-400">
            Live execution tester for the 8-stage gate logic specified in Section 7 of the Technical Architecture.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Presets:</span>
          {[
            { id: 'normal_safe', label: '✅ All Clear (Send)' },
            { id: 'over_quota', label: '⚠️ Over Daily Cap' },
            { id: 'outside_timezone', label: '🌙 Night Timezone' },
            { id: 'dnc_hit', label: '🚫 DNC Competitor' },
            { id: 'unapproved', label: '⏳ Needs Approval' },
            { id: 'captcha_tripwire', label: '🚨 Captcha Tripwire' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activePreset === p.id 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Input Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Simulated Request Context</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">gate(action, acct)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Account Status */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-1.5">
                <label className="text-slate-300 font-semibold block">Account Status & Health</label>
                <div className="flex items-center gap-2">
                  <select
                    value={simAccountStatus}
                    onChange={(e) => setSimAccountStatus(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="warning">Warning</option>
                    <option value="paused">Paused</option>
                  </select>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Score: {simHealthScore}/100</span>
                    <input 
                      type="range"
                      min={40}
                      max={100}
                      value={simHealthScore}
                      onChange={(e) => setSimHealthScore(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Today's Quota */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-semibold">Today's Sent / Cap</label>
                  <span className="font-mono text-blue-400">{simDailySent} / {simDailyCap}</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={simDailyCap + 5}
                  value={simDailySent}
                  onChange={(e) => setSimDailySent(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="text-[10px] text-slate-400">Drag above {simDailyCap} to trigger cap reschedule.</span>
              </div>

              {/* Timezone Window */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Lead Timezone Window</span>
                  <button
                    onClick={() => setSimInLeadTimezoneWindow(!simInLeadTimezoneWindow)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      simInLeadTimezoneWindow 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {simInLeadTimezoneWindow ? '9 AM - 6 PM (Open)' : 'Off-Hours (Night)'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Controls in_window(action.lead_tz, schedule)</p>
              </div>

              {/* DNC Blacklist Match */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">DNC / Competitor Match</span>
                  <button
                    onClick={() => setSimIsDNC(!simIsDNC)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      simIsDNC ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {simIsDNC ? 'Match Found (DNC)' : 'Clean URL'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Controls is_dnc(action.lead)</p>
              </div>

              {/* Human Approval Status */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Human Approval Gate</span>
                  <button
                    onClick={() => setSimIsApproved(!simIsApproved)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      simIsApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {simIsApproved ? 'Approved' : 'Pending Review'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Controls action.status == "approved"</p>
              </div>

              {/* Trip Wire Check */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Anti-Bot Trip Wire</span>
                  <button
                    onClick={() => setSimCaptchaTripwire(!simCaptchaTripwire)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      simCaptchaTripwire ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {simCaptchaTripwire ? 'Captcha Detected!' : 'Normal Traffic'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Simulates LinkedIn security checkpoint.</p>
              </div>

            </div>
          </div>

          {/* Reference Python Code Preview from Section 7 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[11px] space-y-2">
            <div className="text-slate-400 font-semibold flex items-center justify-between">
              <span>Section 7 Reference Implementation (Python)</span>
              <span className="text-[10px] text-blue-400">Backend Safety Engine</span>
            </div>
            <pre className="text-slate-300 overflow-x-auto p-3 rounded-lg bg-slate-950/80 border border-slate-800 leading-relaxed">
{`def gate(action, acct):
    if acct.status != "active" or acct.health < 60:
        return block("account")
    if weekly_sent(acct) >= acct.weekly_cap or daily_sent(acct) >= acct.daily_cap:
        return reschedule(next_window(acct))
    if not in_window(action.lead_tz, action.campaign.schedule):
        return reschedule(next_open_slot(action))
    if is_dnc(action.lead) or already_contacted(action):
        return skip()
    if action.needs_approval and action.status != "approved":
        return hold()
    return send_after(random_delay(45, 180))`}
            </pre>
          </div>
        </div>

        {/* Right: Live Gate Evaluation & Step Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Decision Outcome Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gate Decision</span>
              <span className="text-[11px] text-slate-500 font-mono">Real-time</span>
            </div>

            <div className={`p-4 rounded-xl border ${currentResult.statusColor} space-y-2 text-center`}>
              <div className="text-xs font-mono uppercase tracking-widest font-bold">
                Outcome: {currentResult.decision}
              </div>
              <div className="text-lg font-bold tracking-tight">
                {currentResult.actionOutcome}
              </div>
              <p className="text-xs opacity-90 leading-relaxed font-sans">
                {currentResult.reason}
              </p>
            </div>

            {/* Checklist of 8 Checks */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Evaluated Checks
              </span>

              {currentResult.checks.map(chk => (
                <div key={chk.id} className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-slate-800/40">
                  {chk.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {chk.status === 'fail' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  {chk.status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-white">{chk.name}</div>
                    <div className="text-[11px] text-slate-400">{chk.detail}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
