import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Layers, 
  ChevronDown, 
  Sparkles, 
  ShieldAlert,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';
import { NavTab, LinkedInAccount, User, UserRole } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  accounts: LinkedInAccount[];
  activeAccount: LinkedInAccount | undefined;
  onSelectActiveAccount: (id: string) => void;
  emergencyPaused: boolean;
  onToggleEmergencyPause: () => void;
  pendingApprovalsCount: number;
  unreadInboxCount: number;
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  accounts,
  activeAccount,
  onSelectActiveAccount,
  emergencyPaused,
  onToggleEmergencyPause,
  pendingApprovalsCount,
  currentUser,
  onSwitchRole
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const getPageMeta = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Outreach pacing, safety diagnostics & live funnel' };
      case 'campaigns':
        return { title: 'Campaign Sequences', subtitle: 'Cadence workflows, step builders & lead management' };
      case 'leads':
        return { title: 'Consolidated CRM Pipeline', subtitle: 'Prospect database, multi-source ingestion & tags' };
      case 'message-studio':
        return { title: 'AI Message Studio', subtitle: 'Personalized drafts, A/B variants & human approval queue' };
      case 'inbox':
        return { title: 'Unified Smart Inbox', subtitle: 'Multi-account LinkedIn replies & meeting bookings' };
      case 'accounts':
        return { title: 'LinkedIn Accounts Manager', subtitle: 'Multi-account connection, warm-up pacing & session health' };
      case 'analytics':
        return { title: 'Performance Analytics', subtitle: 'Funnel conversion rates, velocity & meeting bookings' };
      case 'safety-simulator':
        return { title: 'Safety Gate Test & Diagnostics', subtitle: 'Algorithmic rate check simulation & anti-ban rules' };
      case 'settings':
        return { title: 'Safety Pacing & Settings', subtitle: 'Gaussian human jitter, daily limits & DNC exclusion registry' };
      default:
        return { title: 'OutreachFlow', subtitle: 'LinkedIn Automation Engine' };
    }
  };

  const pageMeta = getPageMeta(currentTab);
  const quotaPercent = activeAccount
    ? Math.min(100, Math.round((activeAccount.invites_today / Math.max(1, activeAccount.daily_cap)) * 100))
    : 0;

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      
      {/* Emergency Kill Switch Alert Banner */}
      {emergencyPaused && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 text-xs font-medium text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
            <span>
              <strong>EMERGENCY KILL SWITCH ACTIVE:</strong> All outgoing LinkedIn actions and sequences are frozen.
            </span>
          </div>
          <button 
            onClick={onToggleEmergencyPause}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold tracking-wide transition shadow"
          >
            Resume Outreach
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: View Title & Subtitle */}
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{pageMeta.title}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal border border-slate-700">
              Session Live
            </span>
          </h1>
          <p className="text-xs text-slate-400">{pageMeta.subtitle}</p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          
          {/* Active LinkedIn Account Dropdown Selector */}
          {activeAccount && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2.5 transition text-left shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-tight truncate max-w-[150px]">
                    {activeAccount.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {activeAccount.invites_today}/{activeAccount.daily_cap} invites today
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {quotaPercent}%
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fadeIn">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800">
                    <span>Select LinkedIn Sending Account</span>
                    <span>{accounts.length} Total</span>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {accounts.map(acc => {
                      const isSelected = acc.id === activeAccount.id;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            onSelectActiveAccount(acc.id);
                            setShowAccountDropdown(false);
                          }}
                          className={`p-2.5 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${
                            isSelected ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {acc.headline || 'LinkedIn Account'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Cap: {acc.invites_today}/{acc.daily_cap} today · Health: {acc.health_score}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountDropdown(false);
                      setCurrentTab('accounts');
                    }}
                    className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-1.5 font-medium border-t border-slate-800 block"
                  >
                    Manage All Connected Accounts →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Drafts Review Queue Pill */}
          {pendingApprovalsCount > 0 && (
            <button
              onClick={() => setCurrentTab('message-studio')}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shrink-0"
              title="Review pending AI drafts"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingApprovalsCount} to review</span>
            </button>
          )}

          {/* Emergency Kill Switch Button */}
          <button
            onClick={onToggleEmergencyPause}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shrink-0 ${
              emergencyPaused
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20'
                : 'bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-slate-800 hover:border-red-500/30'
            }`}
            title="Emergency kill switch"
          >
            {emergencyPaused ? (
              <>
                <PlayCircle className="w-3.5 h-3.5 text-white" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Kill Switch</span>
              </>
            )}
          </button>

          {/* Switch Role (Customer -> Admin) */}
          <button
            onClick={() => onSwitchRole('admin')}
            className="hidden md:flex items-center gap-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition"
            title="Open Admin Portal"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin</span>
          </button>

        </div>

      </div>

    </header>
  );
};
