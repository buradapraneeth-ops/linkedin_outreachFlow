import React, { useState, useEffect, useCallback } from 'react';
import { 
  NavTab, 
  Lead, 
  Campaign, 
  PendingAction, 
  InboxThread, 
  AccountSafetyConfig, 
  LeadStatus, 
  User, 
  UserRole,
  LinkedInAccount
} from './types';
import { 
  authApi, 
  accountsApi, 
  campaignsApi, 
  leadsApi, 
  actionsApi, 
  inboxApi,
  removeStoredToken
} from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AccountsManager } from './components/AccountsManager';
import { LeadsManager } from './components/LeadsManager';
import { CampaignsView } from './components/CampaignsView';
import { CampaignBuilderModal } from './components/CampaignBuilderModal';
import { MessageStudio } from './components/MessageStudio';
import { InboxView } from './components/InboxView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { SafetyGateSimulator } from './components/SafetyGateSimulator';
import { AdminPortal } from './components/AdminPortal';
import { AuthScreen } from './components/AuthScreen';

export const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [emergencyPaused, setEmergencyPaused] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showGlobalCampaignBuilder, setShowGlobalCampaignBuilder] = useState<boolean>(false);

  // Dynamic Data State
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Auth & Data Hydration
  const loadDynamicData = useCallback(async (user: User) => {
    try {
      if (user.role === 'admin') {
        setCurrentTab('admin-portal');
        return;
      }

      // Customer Portal: load accounts, campaigns, leads, actions, inbox
      const [accts, camps, lds, acts, thrs] = await Promise.all([
        accountsApi.list(),
        campaignsApi.list(),
        leadsApi.list(),
        actionsApi.list(),
        inboxApi.listThreads()
      ]);

      setAccounts(accts);
      if (accts.length > 0) {
        setActiveAccountId(prev => (prev && accts.some(a => a.id === prev) ? prev : accts[0].id));
      }
      setCampaigns(camps);
      setLeads(lds);
      setPendingActions(acts);
      setInboxThreads(thrs);
    } catch (err) {
      console.error('Error hydrating dynamic state:', err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const user = await authApi.getMe();
        if (user) {
          setCurrentUser(user);
          await loadDynamicData(user);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [loadDynamicData]);

  // Auth Handlers
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setIsLoading(true);
    await loadDynamicData(user);
    setIsLoading(false);
    if (user.role === 'admin') {
      setCurrentTab('admin-portal');
      showToast(`Logged in as System Admin (${user.name}).`);
    } else {
      setCurrentTab('dashboard');
      showToast(`Welcome back, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
    setAccounts([]);
    setCampaigns([]);
    setLeads([]);
    setPendingActions([]);
    setInboxThreads([]);
    showToast('Signed out of platform session.');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      localStorage.setItem('outreach_user', JSON.stringify(updated));
      if (newRole === 'admin') {
        setCurrentTab('admin-portal');
      } else {
        setCurrentTab('dashboard');
      }
      showToast(`Switched workspace view to ${newRole.toUpperCase()} Portal`);
    }
  };

  // Active LinkedIn Account Management
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const handleSelectActiveAccount = (id: string) => {
    setActiveAccountId(id);
    const selected = accounts.find(a => a.id === id);
    if (selected) {
      showToast(`Switched active account to: ${selected.name}`);
    }
  };

  const handleCreateAccount = async (data: Partial<LinkedInAccount>) => {
    try {
      const created = await accountsApi.create(data);
      setAccounts(prev => [created, ...prev]);
      setActiveAccountId(created.id);
      showToast(`Connected new LinkedIn account: ${created.name}`);
    } catch (err: any) {
      showToast(`Error connecting account: ${err?.message || 'Failed'}`);
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<LinkedInAccount>) => {
    try {
      const updated = await accountsApi.update(id, updates);
      setAccounts(prev => prev.map(a => a.id === id ? updated : a));
      showToast(`Updated settings for ${updated.name}.`);
    } catch (err: any) {
      showToast(`Error updating account: ${err?.message || 'Failed'}`);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await accountsApi.delete(id);
      const remaining = accounts.filter(a => a.id !== id);
      setAccounts(remaining);
      if (activeAccountId === id && remaining.length > 0) {
        setActiveAccountId(remaining[0].id);
      }
      showToast('LinkedIn account disconnected.');
    } catch (err: any) {
      showToast(`Error deleting account: ${err?.message || 'Failed'}`);
    }
  };

  // Emergency Pause Toggle
  const handleToggleEmergencyPause = () => {
    const nextState = !emergencyPaused;
    setEmergencyPaused(nextState);
    if (nextState) {
      showToast('EMERGENCY KILL SWITCH: All outreach sequences paused immediately.');
    } else {
      showToast('Outreach platform resumed.');
    }
  };

  // Campaign Management Handlers
  const handleToggleCampaign = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    const nextStatus = target.status === 'running' ? 'paused' : 'running';
    try {
      await campaignsApi.update(id, { status: nextStatus });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
      showToast(`Campaign "${target.name}" ${nextStatus}.`);
    } catch (err: any) {
      showToast(`Failed to update campaign status: ${err?.message}`);
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const dupData: Partial<Campaign> = {
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        account_id: campaign.account_id,
        stopOnReply: campaign.stopOnReply,
        schedule: campaign.schedule,
        steps: campaign.steps
      };
      const created = await campaignsApi.create(dupData);
      setCampaigns(prev => [created, ...prev]);
      showToast(`Campaign duplicated as "${created.name}".`);
    } catch (err: any) {
      showToast(`Failed to duplicate campaign: ${err?.message}`);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await campaignsApi.delete(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      showToast('Campaign deleted.');
    } catch (err: any) {
      showToast(`Failed to delete campaign: ${err?.message}`);
    }
  };

  const handleSaveCampaign = async (
    campaignData: Partial<Campaign> & { initial_leads?: any[] }, 
    existingId?: string
  ) => {
    try {
      if (existingId) {
        const updated = await campaignsApi.update(existingId, campaignData);
        setCampaigns(prev => prev.map(c => c.id === existingId ? updated : c));
        showToast(`Campaign "${updated.name}" updated.`);
      } else {
        const newCamp = await campaignsApi.create(campaignData);
        
        // If initial leads were uploaded in campaign builder, attach them
        if (campaignData.initial_leads && campaignData.initial_leads.length > 0) {
          const attachedLeads = await campaignsApi.addLeads(newCamp.id, campaignData.initial_leads);
          newCamp.leadCount = attachedLeads.length;
          setLeads(prev => [...attachedLeads, ...prev]);
        }

        setCampaigns(prev => [newCamp, ...prev]);
        showToast(`Campaign "${newCamp.name}" launched successfully!`);
      }
    } catch (err: any) {
      showToast(`Failed to save campaign: ${err?.message}`);
    }
  };

  // Add Leads directly into an existing campaign
  const handleAddLeadsToCampaign = async (campaignId: string, newLeadsData: any[]) => {
    try {
      const attached = await campaignsApi.addLeads(campaignId, newLeadsData);
      setLeads(prev => [...attached, ...prev]);
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, leadCount: c.leadCount + attached.length };
        }
        return c;
      }));
      showToast(`Attached ${attached.length} new leads to campaign.`);
    } catch (err: any) {
      showToast(`Failed to add leads to campaign: ${err?.message}`);
    }
  };

  // Remove lead from campaign
  const handleRemoveLeadFromCampaign = async (campaignId: string, leadId: string) => {
    try {
      await campaignsApi.removeLead(campaignId, leadId);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, campaignId: undefined, campaignName: undefined } : l));
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, leadCount: Math.max(0, c.leadCount - 1) };
        }
        return c;
      }));
      showToast('Lead detached from campaign.');
    } catch (err: any) {
      showToast(`Failed to remove lead from campaign: ${err?.message}`);
    }
  };

  // Lead Management Handlers (Consolidated Master Pipeline)
  const handleAddLeads = async (newLeadsData: Lead[]) => {
    try {
      const imported = await leadsApi.bulkImport(newLeadsData);
      setLeads(prev => [...imported, ...prev]);
      showToast(`${imported.length} leads imported & consolidated into pipeline.`);
    } catch (err: any) {
      showToast(`Failed to import leads: ${err?.message}`);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await leadsApi.update(leadId, { status });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (err: any) {
      showToast(`Failed to update status: ${err?.message}`);
    }
  };

  const handleUpdateLeadNotes = async (leadId: string, notes: string) => {
    try {
      await leadsApi.update(leadId, { notes });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
      showToast('Lead notes updated.');
    } catch (err: any) {
      showToast(`Failed to update notes: ${err?.message}`);
    }
  };

  const handleBulkAssignCampaign = async (leadIds: string[], campaignId: string) => {
    const targetCamp = campaigns.find(c => c.id === campaignId);
    try {
      await leadsApi.bulkAssign(leadIds, campaignId);
      setLeads(prev => prev.map(l => {
        if (leadIds.includes(l.id)) {
          return { ...l, campaignId, campaignName: targetCamp?.name };
        }
        return l;
      }));
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, leadCount: c.leadCount + leadIds.length };
        }
        return c;
      }));
      showToast(`Assigned ${leadIds.length} leads to "${targetCamp?.name}".`);
    } catch (err: any) {
      showToast(`Failed to assign leads: ${err?.message}`);
    }
  };

  const handleBulkDelete = async (leadIds: string[]) => {
    try {
      await leadsApi.bulkDelete(leadIds);
      setLeads(prev => prev.filter(l => !leadIds.includes(l.id)));
      showToast(`Removed ${leadIds.length} leads.`);
    } catch (err: any) {
      showToast(`Failed to delete leads: ${err?.message}`);
    }
  };

  // Message Studio / Approvals Handlers
  const handleApproveAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      await actionsApi.approve(actionId);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      
      // Update account daily usage counter
      if (activeAccountId) {
        setAccounts(prev => prev.map(a => {
          if (a.id === activeAccountId) {
            return {
              ...a,
              invites_today: a.invites_today + 1,
              invites_this_week: a.invites_this_week + 1
            };
          }
          return a;
        }));
      }

      // Add timeline event to lead
      setLeads(prev => prev.map(l => {
        if (l.id === action.leadId) {
          return {
            ...l,
            status: action.type === 'invite' ? 'invited' : l.status,
            timeline: [
              ...l.timeline,
              {
                id: `t_${Date.now()}`,
                date: 'Just now',
                type: action.type === 'invite' ? 'invite_sent' : 'message_sent',
                note: `Approved & sent: "${action.draftBody.slice(0, 60)}..."`
              }
            ]
          };
        }
        return l;
      }));

      showToast(`Approved & queued: Message for ${action.leadName} dispatched.`);
    } catch (err: any) {
      showToast(`Failed to approve message: ${err?.message}`);
    }
  };

  const handleRejectAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    try {
      await actionsApi.reject(actionId);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      showToast(`Skipped message draft for ${action?.leadName}.`);
    } catch (err: any) {
      showToast(`Failed to reject action: ${err?.message}`);
    }
  };

  const handleEditActionBody = async (actionId: string, newBody: string) => {
    try {
      await actionsApi.edit(actionId, newBody);
      setPendingActions(prev => prev.map(a => {
        if (a.id === actionId) {
          return { ...a, draftBody: newBody, characterCount: newBody.length };
        }
        return a;
      }));
      showToast('Draft updated.');
    } catch (err: any) {
      showToast(`Failed to update draft: ${err?.message}`);
    }
  };

  // Inbox Handlers
  const handleSendMessage = async (threadId: string, text: string) => {
    try {
      await inboxApi.sendMessage(threadId, text);
      setInboxThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            lastActivity: 'Just now',
            unread: false,
            messages: [
              ...t.messages,
              {
                id: `m_${Date.now()}`,
                sender: 'user',
                body: text,
                timestamp: 'Just now'
              }
            ]
          };
        }
        return t;
      }));
      showToast('Reply dispatched via LinkedIn session.');
    } catch (err: any) {
      showToast(`Failed to dispatch message: ${err?.message}`);
    }
  };

  const handleUpdateThreadLabel = async (
    threadId: string, 
    label: 'interested' | 'not_now' | 'wrong_person' | 'general'
  ) => {
    try {
      await inboxApi.updateLabel(threadId, label);
      setInboxThreads(prev => prev.map(t => t.id === threadId ? { ...t, label } : t));
      showToast(`Thread classified as ${label.toUpperCase()}.`);
    } catch (err: any) {
      showToast(`Failed to update label: ${err?.message}`);
    }
  };

  // Initial Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Initializing OutreachFlow Enterprise Session...</p>
      </div>
    );
  }

  // If no user is logged in, show AuthScreen
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // ==========================================
  // STRICT SEPARATION: ADMIN PORTAL
  // ==========================================
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AdminPortal
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // ==========================================
  // STRICT SEPARATION: CUSTOMER PORTAL
  // ==========================================
  const pendingApprovalsCount = pendingActions.filter(a => a.status === 'pending').length;
  const unreadInboxCount = inboxThreads.filter(t => t.unread).length;

  // Adapt activeAccount into safety config shape for backward compatible components
  const legacySafetyConfig: AccountSafetyConfig = {
    accountName: activeAccount?.name || 'Praneeth Burada',
    profileHeadline: activeAccount?.headline || 'Founder · TechInnovate AI',
    dailyInviteCap: activeAccount?.daily_cap || 20,
    weeklyInviteCap: activeAccount?.weekly_cap || 100,
    invitesSentToday: activeAccount?.invites_today || 0,
    invitesSentThisWeek: activeAccount?.invites_this_week || 0,
    minDelaySeconds: activeAccount?.min_delay || 45,
    maxDelaySeconds: activeAccount?.max_delay || 180,
    warmupModeActive: activeAccount?.warmup_active ?? true,
    warmupDay: activeAccount?.warmup_day || 11,
    healthScore: activeAccount?.health_score || 94,
    autoPauseOnAcceptanceDrop: true,
    approvalMode: activeAccount?.approval_mode === 'full-auto' ? 'approve_all' : 'manual'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-x-hidden">
      
      {/* Enterprise Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectActiveAccount={handleSelectActiveAccount}
        pendingApprovalsCount={pendingApprovalsCount}
        unreadInboxCount={unreadInboxCount}
        leadsCount={leads.length}
        campaignsCount={campaigns.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onOpenNewCampaign={() => setShowGlobalCampaignBuilder(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Modern Top Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          accounts={accounts}
          activeAccount={activeAccount}
          onSelectActiveAccount={handleSelectActiveAccount}
          emergencyPaused={emergencyPaused}
          onToggleEmergencyPause={handleToggleEmergencyPause}
          pendingApprovalsCount={pendingApprovalsCount}
          unreadInboxCount={unreadInboxCount}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />

        {/* Global Campaign Builder Modal */}
        {showGlobalCampaignBuilder && (
          <CampaignBuilderModal
            accounts={accounts}
            onSave={(data) => {
              handleSaveCampaign(data);
              setShowGlobalCampaignBuilder(false);
            }}
            onClose={() => setShowGlobalCampaignBuilder(false)}
          />
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Customer Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            account={legacySafetyConfig}
            activeAccount={activeAccount}
            accounts={accounts}
            campaigns={campaigns}
            onToggleCampaign={handleToggleCampaign}
            setCurrentTab={setCurrentTab}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsManager
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectActiveAccount={handleSelectActiveAccount}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {currentTab === 'campaigns' && (
          <CampaignsView
            campaigns={campaigns}
            accounts={accounts}
            leads={leads}
            onToggleCampaign={handleToggleCampaign}
            onDuplicateCampaign={handleDuplicateCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onSaveCampaign={handleSaveCampaign}
            onAddLeadsToCampaign={handleAddLeadsToCampaign}
            onRemoveLeadFromCampaign={handleRemoveLeadFromCampaign}
          />
        )}

        {currentTab === 'leads' && (
          <LeadsManager
            leads={leads}
            campaigns={campaigns}
            onAddLeads={handleAddLeads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onUpdateLeadNotes={handleUpdateLeadNotes}
            onBulkAssignCampaign={handleBulkAssignCampaign}
            onBulkDelete={handleBulkDelete}
          />
        )}

        {currentTab === 'message-studio' && (
          <MessageStudio
            pendingActions={pendingActions}
            onApproveAction={handleApproveAction}
            onRejectAction={handleRejectAction}
            onEditActionBody={handleEditActionBody}
          />
        )}

        {currentTab === 'inbox' && (
          <InboxView
            threads={inboxThreads}
            onSendMessage={handleSendMessage}
            onUpdateThreadLabel={handleUpdateThreadLabel}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            campaigns={campaigns}
          />
        )}

        {currentTab === 'safety-simulator' && (
          <SafetyGateSimulator
            account={legacySafetyConfig}
            leads={leads}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            account={legacySafetyConfig}
            activeAccount={activeAccount}
            onUpdateAccount={(updated) => {
              if (activeAccountId) {
                handleUpdateAccount(activeAccountId, {
                  daily_cap: updated.dailyInviteCap,
                  weekly_cap: updated.weeklyInviteCap,
                  warmup_active: updated.warmupModeActive,
                  min_delay: updated.minDelaySeconds,
                  max_delay: updated.maxDelaySeconds
                });
              }
            }}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>OutreachFlow · Production Safe LinkedIn Automation Platform · Dynamic Backend & Multi-Account Engine</p>
      </footer>
      </div>
    </div>
  );
};

export default App;
