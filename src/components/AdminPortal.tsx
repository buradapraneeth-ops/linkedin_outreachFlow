import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Server, 
  Activity, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ShieldCheck, 
  Clock, 
  Zap, 
  LogOut,
  Building2,
  RefreshCw,
  AlertTriangle,
  Radio,
  FileText,
  Sliders
} from 'lucide-react';
import { User, FleetMetrics, DncRule, AuditLog, AdminTab } from '../types';
import { adminApi } from '../services/api';

interface AdminPortalProps {
  currentUser: User;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onLogout
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('fleet-overview');
  const [userList, setUserList] = useState<User[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics | null>(null);
  const [globalDncList, setGlobalDncList] = useState<DncRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [newGlobalDnc, setNewGlobalDnc] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, metrics, dnc, logs] = await Promise.all([
        adminApi.listUsers(),
        adminApi.getFleetMetrics(),
        adminApi.listGlobalDnc(),
        adminApi.getAuditLogs()
      ]);
      setUserList(users);
      setFleetMetrics(metrics);
      setGlobalDncList(dnc);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await adminApi.updateUserStatus(userId, nextStatus);
    setUserList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus as any } : u));
    showNotice(`Organization status updated to ${nextStatus.toUpperCase()}.`);
  };

  const handleToggleKillSwitch = async () => {
    if (!fleetMetrics) return;
    const nextState = !fleetMetrics.kill_switch_active;
    await adminApi.toggleKillSwitch(nextState);
    setFleetMetrics({ ...fleetMetrics, kill_switch_active: nextState });
    showNotice(nextState ? 'FLEET EMERGENCY KILL SWITCH ACTIVATED.' : 'Fleet sequences resumed.');
  };

  const handleAddGlobalDnc = async () => {
    if (!newGlobalDnc.trim()) return;
    const rule = await adminApi.addGlobalDnc(newGlobalDnc.trim());
    setGlobalDncList(prev => [rule, ...prev]);
    setNewGlobalDnc('');
    showNotice('Global DNC rule broadcasted to all customer accounts.');
  };

  const handleDeleteGlobalDnc = async (id: string) => {
    await adminApi.deleteGlobalDnc(id);
    setGlobalDncList(prev => prev.filter(r => r.id !== id));
    showNotice('Rule removed from global registry.');
  };

  const filteredUsers = userList.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/30">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base tracking-tight">OutreachFlow Admin Console</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Platform Ops
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Multi-tenant fleet safety, nodes & tenant registry</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Emergency Fleet Switch */}
              <button
                onClick={handleToggleKillSwitch}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  fleetMetrics?.kill_switch_active
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span>{fleetMetrics?.kill_switch_active ? 'GLOBAL KILL SWITCH ACTIVE' : 'Fleet Armed (Normal)'}</span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-purple-400 font-mono">Super Admin</div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                  title="Sign Out of Admin Console"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="border-t border-slate-800 bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 py-2 overflow-x-auto text-xs font-medium">
            {[
              { id: 'fleet-overview', label: 'Fleet Overview & Metrics', icon: <Server className="w-3.5 h-3.5 text-purple-400" /> },
              { id: 'tenants', label: `Tenants & Organizations (${userList.length})`, icon: <Building2 className="w-3.5 h-3.5 text-blue-400" /> },
              { id: 'global-dnc', label: 'Global DNC Registry', icon: <Ban className="w-3.5 h-3.5 text-red-400" /> },
              { id: 'audit-logs', label: 'Audit Trail', icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  activeAdminTab === tab.id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Global Notice Toast */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-950/90 border border-purple-700 text-purple-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ================= TAB 1: FLEET OVERVIEW ================= */}
        {activeAdminTab === 'fleet-overview' && (
          <div className="space-y-6">
            
            {/* Fleet Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Registered Tenants</span>
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-1">{userList.length} Orgs</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  {userList.filter(u => u.status === 'active').length} Active & Provisioned
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Connected LinkedIn Nodes</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {fleetMetrics?.active_accounts || 18} Nodes
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  WebSocket latency: 38ms
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Fleet Invites Sent Today</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {fleetMetrics?.global_invites_today || 142}
                </div>
                <div className="text-[11px] text-blue-400 mt-0.5">
                  Safety ceiling: 250/day
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Fleet Health Index</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {fleetMetrics?.fleet_health || 98.4}%
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  Zero CAPTCHA restrictions
                </div>
              </div>

            </div>

            {/* Live Infrastructure Nodes & Services */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Sending Worker Fleet Status</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Dispatcher Cluster Alpha</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">100% UP</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Celery task worker · Region: us-east-1</p>
                </div>

                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Anti-Bot Pacing Engine</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">ARMED</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Random jitter (45s–180s) enforcing</p>
                </div>

                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Extension Relay Socket</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">CONNECTED</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">18 active client browser sessions</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: TENANT USERS ================= */}
        {activeAdminTab === 'tenants' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Tenant Organizations & Users</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage customer plans, view connected LinkedIn account counts, and toggle account access.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tenant or email..."
                    className="bg-slate-800 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Organization / User</th>
                    <th className="py-3 px-2">Role & Plan</th>
                    <th className="py-3 px-2">Company</th>
                    <th className="py-3 px-2">Connected Accounts</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => {
                    const isActive = user.status === 'active';
                    const isSuperAdmin = user.role === 'admin';

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                              alt={user.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.id === currentUser.id && (
                                  <span className="text-[10px] text-purple-400 font-mono">(You)</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isSuperAdmin 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {user.role}
                            </span>
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {user.plan}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-slate-300 font-medium">
                          {user.company_name}
                        </td>

                        <td className="py-3 px-2 text-slate-300 font-mono">
                          {user.connected_accounts_count || 1} Accounts
                        </td>

                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {user.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                              className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                                isActive 
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {isActive ? 'Suspend Org' : 'Activate Org'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: GLOBAL DNC REGISTRY ================= */}
        {activeAdminTab === 'global-dnc' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-400" />
                  <span>Global System-Wide Do-Not-Contact Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Restricted domains & competitor URLs enforced across every customer account and sequence on OutreachFlow.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {globalDncList.length} rules
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input 
                type="text"
                value={newGlobalDnc}
                onChange={(e) => setNewGlobalDnc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGlobalDnc()}
                placeholder="Add restricted competitor domain (e.g. competitor.com or restricted-firm.io)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddGlobalDnc}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Add Fleet Rule
              </button>
            </div>

            <div className="space-y-2">
              {globalDncList.map((item) => (
                <div key={item.id} className="bg-slate-800/40 border border-slate-700/60 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>{item.rule}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteGlobalDnc(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: AUDIT TRAIL ================= */}
        {activeAdminTab === 'audit-logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Platform Event & Audit Trail</span>
            </h3>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-400 font-mono">[{log.action}]</span>
                      <span className="text-white font-medium">{log.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">By: {log.user_email}</div>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
