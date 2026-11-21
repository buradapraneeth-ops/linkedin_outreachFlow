import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Users, 
  Send, 
  MessageSquare, 
  Inbox, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Compass, 
  Cpu,
  Layers,
  ChevronDown,
  LogOut,
  Plus
} from 'lucide-react';
import { NavTab, LinkedInAccount, User } from '../types';

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
  unreadInboxCount,
  currentUser,
  onLogout
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const quotaPercentage = activeAccount 
    ? Math.round((activeAccount.invites_today / activeAccount.daily_cap) * 100) 
    : 0;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'accounts', label: `LinkedIn Accounts (${accounts.length})`, icon: <Layers className="w-4 h-4 text-blue-400" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Send className="w-4 h-4" /> },
    { id: 'leads', label: 'Leads & Pipeline', icon: <Users className="w-4 h-4" /> },
    { 
      id: 'message-studio', 
      label: 'Message Studio', 
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      badge: pendingApprovalsCount 
    },
    { 
      id: 'inbox', 
      label: 'Inbox', 
      icon: <Inbox className="w-4 h-4" />,
      badge: unreadInboxCount 
    },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'safety-simulator', label: 'Safety Gate Test', icon: <Cpu className="w-4 h-4 text-emerald-400" /> },
    { id: 'settings', label: 'Safety & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner if Emergency Paused */}
      {emergencyPaused && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 text-xs font-medium text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span><strong>EMERGENCY KILL SWITCH ACTIVE:</strong> All outgoing LinkedIn actions, extensions, and automated sequences are strictly paused.</span>
          </div>
          <button 
            onClick={onToggleEmergencyPause}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold tracking-wide transition shadow"
          >
            Resume Platform
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-white text-lg">
              <span className="tracking-tight">in</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">OutreachFlow</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Customer Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Personalized LinkedIn Outreach & Safety Gate</p>
            </div>
          </div>

          {/* Center/Right Status & Multi-Account Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Multiple LinkedIn Account Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="font-semibold text-white max-w-[140px] truncate">
                    {activeAccount ? activeAccount.name : 'Select Account'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">{activeAccount?.health_score || 94}/100</span>
                    <span>·</span>
                    <span>{activeAccount?.invites_today || 0}/{activeAccount?.daily_cap || 20}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Connected LinkedIn Accounts ({accounts.length})
                  </div>
                  {accounts.map(acct => (
                    <button
                      key={acct.id}
                      onClick={() => {
                        onSelectActiveAccount(acct.id);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between ${
                        acct.id === activeAccount?.id 
                          ? 'bg-blue-600/20 border border-blue-500/30 text-white' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold truncate max-w-[150px]">{acct.name}</div>
                        <div className="text-[10px] text-slate-400">Health: {acct.health_score}/100</div>
                      </div>
                      <span className="text-[11px] font-mono text-blue-400">{acct.invites_today}/{acct.daily_cap}</span>
                    </button>
                  ))}
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setCurrentTab('accounts');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full text-center py-1.5 text-blue-400 hover:text-blue-300 font-bold text-[11px] block"
                    >
                      + Connect / Manage Accounts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Quota Gauge */}
            {activeAccount && (
              <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 px-3 py-1.5 rounded-lg text-xs">
                <div className="text-slate-400">
                  Today: <span className="font-semibold text-slate-200">{activeAccount.invites_today}/{activeAccount.daily_cap}</span>
                </div>
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaPercentage > 85 ? 'bg-amber-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Emergency Kill Switch Button */}
            <button
              onClick={onToggleEmergencyPause}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                emergencyPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
              }`}
              title="Pause all sequences immediately"
            >
              {emergencyPaused ? (
                <>
                  <PlayCircle className="w-4 h-4 text-emerald-300" />
                  <span>Resume All</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4 text-red-400" />
                  <span>Pause All</span>
                </>
              )}
            </button>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden xl:block text-right">
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[10px] text-blue-400">{currentUser.plan} Plan</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    item.id === 'message-studio' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
