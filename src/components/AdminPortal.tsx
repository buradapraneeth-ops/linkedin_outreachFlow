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
  Sliders,
  Check,
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { User, FleetMetrics, DncRule, AuditLog, AdminTab, UserRole } from '../types';
import { adminApi } from '../services/api';

interface AdminPortalProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onLogout,
  onSwitchRole
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

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
      setUserList(users || []);
      setFleetMetrics(metrics || null);
      setGlobalDncList(dnc || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load admin data from backend', err);
      showNotice('Unable to fetch latest admin telemetry from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setIsUpdatingStatus(userId);
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus as any } : u));
      showNotice(`Organization status updated to ${nextStatus.toUpperCase()}.`);
    } catch (err: any) {
      showNotice(`Failed to update status: ${err?.message || 'Server error'}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!fleetMetrics) return;
    const nextState = !fleetMetrics.kill_switch_active;
    try {
      await adminApi.toggleKillSwitch(nextState);
      setFleetMetrics(prev => prev ? { ...prev, kill_switch_active: nextState } : null);
      showNotice(nextState ? 'FLEET EMERGENCY KILL SWITCH ACTIVATED.' : 'Fleet sequences resumed.');
    } catch (err: any) {
      showNotice(`Failed to toggle kill switch: ${err?.message || 'Server error'}`);
    }
  };

  const handleAddGlobalDnc = async () => {
    if (!newGlobalDnc.trim()) return;
    try {
      const rule = await adminApi.addGlobalDnc(newGlobalDnc.trim());
      setGlobalDncList(prev => [rule, ...prev]);
      setNewGlobalDnc('');
      showNotice('Global DNC rule broadcasted to all customer accounts.');
    } catch (err: any) {
      showNotice(`Failed to add DNC rule: ${err?.message || 'Server error'}`);
    }
  };

  const handleDeleteGlobalDnc = async (id: string) => {
    try {
      await adminApi.deleteGlobalDnc(id);
      setGlobalDncList(prev => prev.filter(r => r.id !== id));
      showNotice('Rule removed from global registry.');
    } catch (err: any) {
      showNotice(`Failed to delete DNC rule: ${err?.message || 'Server error'}`);
    }
  };

  const filteredUsers = userList.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.company_name && u.company_name.toLowerCase().includes(term));
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
                  <span className="font-bold text-white text-base tracking-tight">Super Admin Console</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Production Ops
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Multi-tenant fleet management & security enforcement</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Data Button */}
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh Live Telemetry"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Emergency Fleet Kill Switch */}
              <button
                onClick={handleToggleKillSwitch}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  fleetMetrics?.kill_switch_active
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span>{fleetMetrics?.kill_switch_active ? 'GLOBAL KILL SWITCH ACTIVE' : 'Fleet Active'}</span>
              </button>

              {/* Switch to Customer View pill */}
              {onSwitchRole && (
                <button
                  onClick={() => onSwitchRole('customer')}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition"
                  title="Switch into Customer Portal to inspect client view"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Customer View</span>
                </button>
              )}

              {/* Admin Profile & Logout */}
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
              { id: 'fleet-overview' as AdminTab, label: 'Fleet Overview & Metrics', icon: <Server className="w-3.5 h-3.5 text-purple-400" /> },
              { id: 'tenants' as AdminTab, label: `Tenants & Organizations (${userList.length})`, icon: <Building2 className="w-3.5 h-3.5 text-blue-400" /> },
              { id: 'global-dnc' as AdminTab, label: `Global DNC Registry (${globalDncList.length})`, icon: <Ban className="w-3.5 h-3.5 text-red-400" /> },
              { id: 'audit-logs' as AdminTab, label: `Audit Trail (${auditLogs.length})`, icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id)}
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
            
            {/* Dynamic Fleet Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Registered Tenants</span>
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {userList.length} {userList.length === 1 ? 'Org' : 'Orgs'}
                </div>
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
                  {fleetMetrics?.active_accounts ?? 0} {fleetMetrics?.active_accounts === 1 ? 'Account' : 'Accounts'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Synchronized across tenant fleets
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Fleet Invites Sent Today</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {fleetMetrics?.global_invites_today ?? 0}
                </div>
                <div className="text-[11px] text-blue-400 mt-0.5">
                  Aggregated live daily volume
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Fleet Health Index</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {fleetMetrics?.fleet_health !== undefined && fleetMetrics.fleet_health > 0 
                    ? `${fleetMetrics.fleet_health}%` 
                    : (fleetMetrics?.active_accounts === 0 ? '100%' : 'N/A')}
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  Calculated from active node metrics
                </div>
              </div>

            </div>

            {/* Live Operational Status Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Backend Architecture & Platform Telemetry</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Database Engine</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">ONLINE</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">SQLite multi-tenant store with dynamic foreign key isolation</p>
                </div>

                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Platform Kill Switch</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      fleetMetrics?.kill_switch_active 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {fleetMetrics?.kill_switch_active ? 'ACTIVE (HALTED)' : 'DISARMED (NORMAL)'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Instant circuit breaker across all tenant background workers</p>
                </div>

                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Active Tenants</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                      {userList.length} TENANTS
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {fleetMetrics?.active_accounts ?? 0} connected LinkedIn sending profiles authenticated
                  </p>
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
                  <span>Tenant Organizations & Users ({userList.length})</span>
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-300">No organizations found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {searchTerm ? `No tenants match "${searchTerm}".` : 'No tenant organizations registered in the database.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isActive = user.status === 'active';
                      const isSuperAdmin = user.role === 'admin';
                      const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.name} 
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center border border-purple-500/30 text-xs">
                                  {initial}
                                </div>
                              )}
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
                                {user.plan || 'Standard'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-slate-300 font-medium">
                            {user.company_name || 'Individual'}
                          </td>

                          <td className="py-3 px-2 text-slate-300 font-mono">
                            {user.connected_accounts_count ?? 0} Accounts
                          </td>

                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {(user.status || 'active').toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                disabled={isUpdatingStatus === user.id}
                                className={`text-xs px-2.5 py-1 rounded font-medium transition disabled:opacity-50 ${
                                  isActive 
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                }`}
                              >
                                {isUpdatingStatus === user.id ? 'Updating...' : (isActive ? 'Suspend Org' : 'Activate Org')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
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
                {globalDncList.length} {globalDncList.length === 1 ? 'rule' : 'rules'}
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

            {globalDncList.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                <Ban className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No Global DNC Rules Configured</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enter a domain or competitor pattern above to broadcast a system-wide exclusion rule across all tenants.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {globalDncList.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 border border-slate-700/60 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>{item.rule}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteGlobalDnc(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: AUDIT TRAIL ================= */}
        {activeAdminTab === 'audit-logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Platform Event & Audit Trail</span>
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No System Audit Events Recorded</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Security events, campaign launches, and administrative actions will be logged here dynamically in real-time.
                </p>
              </div>
            ) : (
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
            )}
          </div>
        )}

      </main>

    </div>
  );
};
