import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  Sparkles, 
  Inbox, 
  BarChart3, 
  Layers, 
  Cpu, 
  Settings, 
  ShieldCheck, 
  Plus, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Building2,
  Zap
} from 'lucide-react';
import { NavTab, LinkedInAccount, User, UserRole } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  accounts: LinkedInAccount[];
  activeAccount: LinkedInAccount | undefined;
  onSelectActiveAccount: (id: string) => void;
  pendingApprovalsCount: number;
  unreadInboxCount: number;
  leadsCount: number;
  campaignsCount: number;
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenNewCampaign: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  accounts,
  activeAccount,
  onSelectActiveAccount,
  pendingApprovalsCount,
  unreadInboxCount,
  leadsCount,
  campaignsCount,
  currentUser,
  onLogout,
  onSwitchRole,
  onOpenNewCampaign,
  isCollapsed,
  setIsCollapsed
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: null
    },
    {
      id: 'campaigns' as NavTab,
      label: 'Campaigns',
      icon: <Send className="w-4 h-4 shrink-0" />,
      badge: campaignsCount > 0 ? campaignsCount : null
    },
    {
      id: 'leads' as NavTab,
      label: 'Leads & CRM',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: leadsCount > 0 ? leadsCount : null
    },
    {
      id: 'message-studio' as NavTab,
      label: 'Message Studio',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'inbox' as NavTab,
      label: 'Unified Inbox',
      icon: <Inbox className="w-4 h-4 shrink-0" />,
      badge: unreadInboxCount > 0 ? unreadInboxCount : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  ];

  const safetyNavItems = [
    {
      id: 'accounts' as NavTab,
      label: 'LinkedIn Accounts',
      icon: <Layers className="w-4 h-4 shrink-0 text-blue-400" />,
      badge: accounts.length > 0 ? accounts.length : null
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics & Funnel',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      badge: null
    },
    {
      id: 'safety-simulator' as NavTab,
      label: 'Safety Gate Test',
      icon: <Cpu className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: null
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings & DNC',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      badge: null
    }
  ];

  const currentQuotaPercent = activeAccount
    ? Math.min(100, Math.round((activeAccount.invites_today / Math.max(1, activeAccount.daily_cap)) * 100))
    : 0;

  return (
    <aside 
      className={`relative flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60">
        <div 
          onClick={() => setCurrentTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center font-bold text-white text-base">
            <span>in</span>
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>OutreachFlow</span>
                <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.2 rounded font-mono border border-blue-500/20">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">Anti-Ban Growth Engine</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3 border-b border-slate-800/60">
        <button
          onClick={onOpenNewCampaign}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 py-2.5 text-xs ${
            isCollapsed ? 'px-0' : 'px-3'
          }`}
          title="Create New Campaign"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>New Campaign</span>}
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin">
        
        {/* Group 1: Pipeline & Execution */}
        <div>
          {!isCollapsed && (
            <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pipeline & Growth
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge !== null && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Group 2: Fleet, Analytics & Safety */}
        <div>
          {!isCollapsed && (
            <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fleet & Protection
            </div>
          )}
          <nav className="space-y-1">
            {safetyNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Active Account Safety Card (When Expanded) */}
      {!isCollapsed && activeAccount && (
        <div className="p-3 mx-2.5 mb-2 bg-slate-900/80 rounded-xl border border-slate-800/90 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 truncate">
              {activeAccount.name}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{activeAccount.health_score}%</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Daily Quota</span>
              <span className="font-semibold text-slate-200">
                {activeAccount.invites_today} / {activeAccount.daily_cap}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${currentQuotaPercent}%` }}
              />
            </div>
          </div>

          {accounts.length > 1 && (
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-blue-400">
              <span>Switch Account:</span>
              <select
                value={activeAccount.id}
                onChange={(e) => onSelectActiveAccount(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-[10px] focus:outline-none focus:border-blue-500"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Footer User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img 
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
            alt={currentUser.name} 
            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          />
          {!isCollapsed && (
            <div className="truncate">
              <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700">
                  {currentUser.plan || 'Pro'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.company_name || 'TechInnovate AI'}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onSwitchRole('admin')}
            className="text-slate-400 hover:text-purple-400 p-1 rounded transition"
            title="Switch to System Admin Portal"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-400 p-1 rounded transition"
            title="Sign out of platform"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
