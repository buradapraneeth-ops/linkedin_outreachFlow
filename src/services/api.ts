import { 
  User, 
  LinkedInAccount, 
  Campaign, 
  Lead, 
  PendingAction, 
  InboxThread, 
  DncRule, 
  AuditLog, 
  FleetMetrics,
  LeadSource,
  LeadStatus
} from '../types';

const API_BASE = '/v1';

// Token storage helper
export const getStoredToken = (): string | null => {
  return localStorage.getItem('outreach_auth_token') || 'usr_cust_01';
};

export const setStoredToken = (token: string) => {
  localStorage.setItem('outreach_auth_token', token);
};

export const removeStoredToken = () => {
  localStorage.removeItem('outreach_auth_token');
};

const getHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ----------------- Fallback Database (in-browser SQLite mirror) -----------------
const STORAGE_PREFIX = 'outreach_db_';

const getLocalCollection = <T>(key: string, defaultInit: () => T[]): T[] => {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) {
    const initial = defaultInit();
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultInit();
  }
};

const setLocalCollection = <T>(key: string, data: T[]) => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
};

// Helpers for two-way hydration (camelCase & snake_case)
export const hydrateCampaign = (c: any): Campaign => {
  const leadCount = c.lead_count ?? c.leadCount ?? 0;
  const sentCount = c.sent_count ?? c.sentCount ?? 0;
  const acceptedCount = c.accepted_count ?? c.acceptedCount ?? 0;
  const repliedCount = c.replied_count ?? c.repliedCount ?? 0;
  const bookedCount = c.booked_count ?? c.bookedCount ?? 0;
  const stopOnReply = c.stop_on_reply ?? c.stopOnReply ?? true;
  const createdAt = c.created_at || c.createdAt || new Date().toISOString().split('T')[0];

  return {
    id: c.id,
    user_id: c.user_id,
    account_id: c.account_id || 'acct_praneeth_01',
    account_name: c.account_name,
    name: c.name || 'Outreach Campaign',
    goal: c.goal || 'outreach',
    status: c.status || 'running',
    lead_count: leadCount,
    leadCount: leadCount,
    sent_count: sentCount,
    sentCount: sentCount,
    accepted_count: acceptedCount,
    acceptedCount: acceptedCount,
    replied_count: repliedCount,
    repliedCount: repliedCount,
    booked_count: bookedCount,
    bookedCount: bookedCount,
    stop_on_reply: stopOnReply,
    stopOnReply: stopOnReply,
    schedule: c.schedule || {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startHour: 9,
      endHour: 18,
      timezone: 'America/New_York'
    },
    steps: c.steps || [],
    created_at: createdAt,
    createdAt: createdAt
  };
};

export const hydrateLead = (l: any): Lead => {
  const linkedinUrl = l.linkedin_url || l.linkedinUrl || 'https://linkedin.com/in/prospect';
  const leadScore = l.lead_score ?? l.leadScore ?? 85;
  const campaignId = l.campaign_id || l.campaignId;
  const campaignName = l.campaign_name || l.campaignName;
  const createdAt = l.created_at || l.createdAt || new Date().toISOString();

  return {
    id: l.id,
    user_id: l.user_id,
    name: l.name || 'Prospect',
    title: l.title || 'Executive',
    company: l.company || 'Enterprise',
    location: l.location || 'United States',
    linkedin_url: linkedinUrl,
    linkedinUrl: linkedinUrl,
    email: l.email,
    avatar: l.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: l.status || 'new',
    source: l.source || 'manual',
    campaign_id: campaignId,
    campaignId: campaignId,
    campaign_name: campaignName,
    campaignName: campaignName,
    tags: l.tags || ['Outreach'],
    enrichment: l.enrichment || {
      recentPostSnippet: '',
      mutualConnections: 5,
      companyHeadcount: '50-200',
      industry: 'Technology',
      personalizedHook: `Noticed your growth initiatives at ${l.company || 'your firm'}.`
    },
    timeline: l.timeline || [],
    notes: l.notes || '',
    lead_score: leadScore,
    leadScore: leadScore,
    created_at: createdAt,
    createdAt: createdAt
  };
};

export const hydrateAction = (a: any): PendingAction => {
  const leadId = a.lead_id || a.leadId || '';
  const leadName = a.lead_name || a.leadName || 'Prospect';
  const leadTitle = a.lead_title || a.leadTitle || 'Leader';
  const leadCompany = a.lead_company || a.leadCompany || 'Company';
  const leadAvatar = a.lead_avatar || a.leadAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const draftBody = a.draft_body || a.draftBody || '';
  const charCount = a.character_count ?? a.characterCount ?? draftBody.length;
  const aiConf = a.ai_confidence ?? a.aiConfidence ?? 92;
  const schedTime = a.scheduled_time || a.scheduledTime || 'Today, 2:30 PM';
  const campaignName = a.campaign_name || a.campaignName;

  return {
    id: a.id,
    lead_id: leadId,
    leadId: leadId,
    campaign_id: a.campaign_id || a.campaignId,
    campaignId: a.campaign_id || a.campaignId,
    account_id: a.account_id || 'acct_praneeth_01',
    lead_name: leadName,
    leadName: leadName,
    lead_title: leadTitle,
    leadTitle: leadTitle,
    lead_company: leadCompany,
    leadCompany: leadCompany,
    lead_avatar: leadAvatar,
    leadAvatar: leadAvatar,
    campaign_name: campaignName,
    campaignName: campaignName,
    type: a.type || 'invite',
    draft_body: draftBody,
    draftBody: draftBody,
    character_count: charCount,
    characterCount: charCount,
    status: a.status || 'pending',
    ai_confidence: aiConf,
    aiConfidence: aiConf,
    reasoning: a.reasoning || 'Personalized hook matched against company announcement.',
    scheduled_time: schedTime,
    scheduledTime: schedTime,
    created_at: a.created_at || a.createdAt
  };
};

export const hydrateThread = (t: any): InboxThread => {
  const leadId = t.lead_id || t.leadId || '';
  const leadName = t.lead_name || t.leadName || 'Lead';
  const leadTitle = t.lead_title || t.leadTitle || 'Executive';
  const leadCompany = t.lead_company || t.leadCompany || 'Company';
  const leadAvatar = t.lead_avatar || t.leadAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const lastActivity = t.last_activity || t.lastActivity || 'Just now';
  const replies = t.suggested_replies || t.suggestedReplies || [
    'Thanks for getting back! How does Thursday at 2 PM look for a 15-min chat?',
    'Glad to connect! Would love to hear about your key initiatives this quarter.'
  ];

  return {
    id: t.id,
    lead_id: leadId,
    leadId: leadId,
    account_id: t.account_id || 'acct_praneeth_01',
    lead_name: leadName,
    leadName: leadName,
    lead_title: leadTitle,
    leadTitle: leadTitle,
    lead_company: leadCompany,
    leadCompany: leadCompany,
    lead_avatar: leadAvatar,
    leadAvatar: leadAvatar,
    unread: Boolean(t.unread),
    label: t.label || 'interested',
    last_activity: lastActivity,
    lastActivity: lastActivity,
    messages: t.messages || [],
    suggested_replies: replies,
    suggestedReplies: replies,
    created_at: t.created_at || t.createdAt
  };
};

// Initial Dynamic Seeds for local SQLite mirror
const initialLocalUsers = (): User[] => [
  {
    id: 'usr_cust_01',
    name: 'Praneeth Burada',
    email: 'praneeth@techinnovate.io',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    plan: 'Pro',
    company_name: 'TechInnovate AI',
    companyName: 'TechInnovate AI',
    connected_accounts_count: 2,
    status: 'active',
    created_at: '2026-09-12'
  },
  {
    id: 'usr_admin_01',
    name: 'Alex Vance (Super Admin)',
    email: 'admin@outreachflow.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    plan: 'Enterprise',
    company_name: 'OutreachFlow HQ',
    companyName: 'OutreachFlow HQ',
    connected_accounts_count: 8,
    status: 'active',
    created_at: '2026-01-01'
  },
  {
    id: 'usr_cust_02',
    name: 'Sophia Chen',
    email: 'sophia@cloudscale.net',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    plan: 'Starter',
    company_name: 'CloudScale Corp',
    companyName: 'CloudScale Corp',
    connected_accounts_count: 1,
    status: 'active',
    created_at: '2026-10-05'
  }
];

const initialLocalAccounts = (): LinkedInAccount[] => [
  {
    id: 'acct_praneeth_01',
    user_id: 'usr_cust_01',
    name: 'Praneeth Burada (Primary)',
    headline: 'Founder & Head of Growth · TechInnovate AI',
    linkedin_url: 'https://linkedin.com/in/praneeth-burada',
    status: 'active',
    health_score: 94,
    daily_cap: 20,
    weekly_cap: 100,
    invites_today: 14,
    invites_this_week: 72,
    warmup_active: true,
    warmup_day: 11,
    min_delay: 45,
    max_delay: 180,
    approval_mode: 'approve_all',
    session_token: 'enc_li_at_9921fa8c0',
    created_at: '2026-11-01'
  },
  {
    id: 'acct_praneeth_02',
    user_id: 'usr_cust_01',
    name: 'Praneeth (Enterprise Executive)',
    headline: 'Strategic Partnerships & AI Solutions',
    linkedin_url: 'https://linkedin.com/in/praneeth-enterprise',
    status: 'active',
    health_score: 89,
    daily_cap: 15,
    weekly_cap: 80,
    invites_today: 6,
    invites_this_week: 34,
    warmup_active: true,
    warmup_day: 6,
    min_delay: 50,
    max_delay: 160,
    approval_mode: 'approve_all',
    session_token: 'enc_li_at_5541ba3a',
    created_at: '2026-11-10'
  }
];

const initialLocalCampaigns = (): Campaign[] => [
  hydrateCampaign({
    id: 'camp_01',
    user_id: 'usr_cust_01',
    account_id: 'acct_praneeth_01',
    account_name: 'Praneeth Burada (Primary)',
    name: 'AI CTOs & VP Engineering Outreach',
    goal: 'sales',
    status: 'running',
    lead_count: 48,
    sent_count: 36,
    accepted_count: 14,
    replied_count: 8,
    booked_count: 4,
    stop_on_reply: true,
    schedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startHour: 9,
      endHour: 18,
      timezone: 'America/New_York'
    },
    steps: [
      { id: 'step_1', position: 1, type: 'view', title: 'Silent Profile View', delay_hours: 0 },
      { id: 'step_2', position: 2, type: 'invite', title: 'Personalized Connection Request', delay_hours: 24, template_body: 'Hi {{firstName}} - came across your engineering leadership at {{company}}...' },
      { id: 'step_3', position: 3, type: 'message', title: 'Value Drop & Architecture Demo', delay_hours: 48, template_body: 'Thanks for connecting, {{firstName}}!' }
    ],
    created_at: '2026-11-05'
  }),
  hydrateCampaign({
    id: 'camp_02',
    user_id: 'usr_cust_01',
    account_id: 'acct_praneeth_02',
    account_name: 'Praneeth (Enterprise Executive)',
    name: 'Series A/B Founders Pacing',
    goal: 'networking',
    status: 'running',
    lead_count: 24,
    sent_count: 18,
    accepted_count: 9,
    replied_count: 5,
    booked_count: 3,
    stop_on_reply: true,
    schedule: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startHour: 10,
      endHour: 17,
      timezone: 'America/San_Francisco'
    },
    steps: [
      { id: 'step_1', position: 1, type: 'view', title: 'Profile View', delay_hours: 0 },
      { id: 'step_2', position: 2, type: 'invite', title: 'Founder-to-Founder Invite', delay_hours: 12 }
    ],
    created_at: '2026-11-12'
  })
];

const initialLocalLeads = (): Lead[] => [
  hydrateLead({
    id: 'lead_01',
    user_id: 'usr_cust_01',
    campaign_id: 'camp_01',
    campaign_name: 'AI CTOs & VP Engineering Outreach',
    name: 'Dr. Marcus Vance',
    title: 'VP of Machine Learning & Platform',
    company: 'NexusAI Platforms',
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/marcus-vance-ai',
    email: 'marcus@nexusai.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'connected',
    source: 'sales_navigator',
    tags: ['Tier-1 Decision Maker', 'AI Leader'],
    enrichment: {
      recentPostSnippet: 'Published our paper on distributed low-latency inference on H100 clusters.',
      mutualConnections: 12,
      companyHeadcount: '250-500',
      industry: 'Artificial Intelligence',
      personalizedHook: 'Your recent post on distributed low-latency inference on H100 clusters caught my eye.'
    },
    timeline: [
      { id: 't1', date: '2 days ago', type: 'profile_viewed', note: 'Silent automated profile view' },
      { id: 't2', date: 'Yesterday', type: 'invite_sent', note: 'Connection note dispatched' },
      { id: 't3', date: 'Today, 9:15 AM', type: 'invite_accepted', note: 'Accepted connection request' }
    ],
    lead_score: 96,
    created_at: '2026-11-14'
  }),
  hydrateLead({
    id: 'lead_02',
    user_id: 'usr_cust_01',
    campaign_id: 'camp_01',
    campaign_name: 'AI CTOs & VP Engineering Outreach',
    name: 'Elena Rostova',
    title: 'Chief Technology Officer',
    company: 'HyperScale Data Labs',
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/elena-rostova-cto',
    email: 'elena@hyperscalelabs.io',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'replied',
    source: 'csv_upload',
    tags: ['CTO', 'Fintech Data'],
    enrichment: {
      recentPostSnippet: 'Excited to announce our Series B funding round to scale real-time analytics pipelines.',
      mutualConnections: 8,
      companyHeadcount: '120',
      industry: 'Financial Technology',
      personalizedHook: 'Huge congrats on the Series B milestone at HyperScale Data Labs!'
    },
    timeline: [
      { id: 't1', date: 'Nov 12', type: 'invite_sent', note: 'Personalized invite sent' },
      { id: 't2', date: 'Nov 13', type: 'invite_accepted', note: 'Accepted invite' },
      { id: 't3', date: 'Nov 14', type: 'reply_received', note: 'Replied: "Sounds interesting, let\'s chat Thursday."' }
    ],
    lead_score: 98,
    created_at: '2026-11-12'
  }),
  hydrateLead({
    id: 'lead_03',
    user_id: 'usr_cust_01',
    name: 'Devon Wright',
    title: 'Head of Infrastructure & Cloud Security',
    company: 'Synthetix Cloud',
    location: 'Austin, TX',
    linkedin_url: 'https://linkedin.com/in/devon-wright-sec',
    email: 'devon@synthetix.cloud',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'new',
    source: 'manual',
    tags: ['Security Executive'],
    enrichment: {
      recentPostSnippet: 'Zero-trust architecture in modern multi-cloud deployments.',
      mutualConnections: 4,
      companyHeadcount: '80',
      industry: 'Cybersecurity',
      personalizedHook: 'Saw your breakdown on zero-trust multi-cloud architecture.'
    },
    timeline: [],
    lead_score: 91,
    created_at: '2026-11-18'
  })
];

const initialLocalActions = (): PendingAction[] => [
  hydrateAction({
    id: 'act_01',
    lead_id: 'lead_03',
    campaign_id: 'camp_01',
    account_id: 'acct_praneeth_01',
    lead_name: 'Devon Wright',
    lead_title: 'Head of Infrastructure & Cloud Security',
    lead_company: 'Synthetix Cloud',
    lead_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    campaign_name: 'AI CTOs & VP Engineering Outreach',
    type: 'invite',
    draft_body: 'Hi Devon, saw your breakdown on zero-trust multi-cloud architecture at Synthetix Cloud. Loved your perspective on automated policy enforcement—would love to connect!',
    character_count: 172,
    status: 'pending',
    ai_confidence: 95,
    reasoning: 'Referenced verified LinkedIn post on zero-trust architecture; exact character count within 300 char connection request limit.',
    scheduled_time: 'Today at 2:45 PM',
    created_at: '2026-11-20'
  })
];

const initialLocalInbox = (): InboxThread[] => [
  hydrateThread({
    id: 'th_01',
    lead_id: 'lead_02',
    account_id: 'acct_praneeth_01',
    lead_name: 'Elena Rostova',
    lead_title: 'Chief Technology Officer',
    lead_company: 'HyperScale Data Labs',
    lead_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    unread: true,
    label: 'interested',
    last_activity: '10 mins ago',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        body: 'Hi Elena, huge congrats on the Series B milestone at HyperScale! We built an AI workflow for high-volume pipeline observability that might save your team hours. Open to connecting?',
        timestamp: 'Nov 12, 10:14 AM'
      },
      {
        id: 'm2',
        sender: 'lead',
        body: 'Thanks Praneeth! Actually timing is great—we are auditing our pipeline tooling right now. Can you share a 1-page overview or hop on a brief call later this week?',
        timestamp: 'Today, 8:42 AM'
      }
    ],
    suggested_replies: [
      'Absolutely! How does Thursday at 2:00 PM EST work for a quick 15-minute screen share?',
      'Thrilled to hear that! Sending over our 1-page technical architecture doc right now.'
    ],
    created_at: '2026-11-12'
  })
];

// ----------------- Auth API -----------------
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setStoredToken(data.token);
        return data;
      }
    } catch {}

    const users = getLocalCollection('users', initialLocalUsers);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setStoredToken(found.id);
      return { token: found.id, user: found };
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'admin' : 'customer',
      company_name: 'Company Inc',
      companyName: 'Company Inc',
      plan: 'Pro',
      status: 'active',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    setLocalCollection('users', users);
    setStoredToken(newUser.id);
    return { token: newUser.id, user: newUser };
  },

  getMe: async (): Promise<User> => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const token = getStoredToken();
    const users = getLocalCollection('users', initialLocalUsers);
    return users.find(u => u.id === token) || users[0];
  }
};

// ----------------- Multiple LinkedIn Accounts API -----------------
export const accountsApi = {
  list: async (): Promise<LinkedInAccount[]> => {
    try {
      const res = await fetch(`${API_BASE}/accounts`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const token = getStoredToken();
    const accounts = getLocalCollection('accounts', initialLocalAccounts);
    return accounts.filter(a => a.user_id === token || !a.user_id);
  },

  create: async (accountData: Partial<LinkedInAccount>): Promise<LinkedInAccount> => {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(accountData)
      });
      if (res.ok) return await res.json();
    } catch {}

    const token = getStoredToken() || 'usr_cust_01';
    const accounts = getLocalCollection('accounts', initialLocalAccounts);
    const newAcct: LinkedInAccount = {
      id: `acct_${Date.now()}`,
      user_id: token,
      name: accountData.name || 'New LinkedIn Account',
      headline: accountData.headline || 'Professional Profile',
      linkedin_url: accountData.linkedin_url || 'https://linkedin.com/in/prospect',
      status: 'active',
      health_score: 95,
      daily_cap: accountData.daily_cap || 20,
      weekly_cap: accountData.weekly_cap || 100,
      invites_today: 0,
      invites_this_week: 0,
      warmup_active: accountData.warmup_active ?? true,
      warmup_day: 1,
      min_delay: 45,
      max_delay: 180,
      approval_mode: 'approve_all',
      session_token: accountData.session_token || 'enc_token_custom',
      created_at: new Date().toISOString()
    };
    accounts.unshift(newAcct);
    setLocalCollection('accounts', accounts);
    return newAcct;
  },

  update: async (id: string, updates: Partial<LinkedInAccount>): Promise<LinkedInAccount> => {
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {}

    const accounts = getLocalCollection('accounts', initialLocalAccounts);
    let updated: LinkedInAccount = accounts[0];
    const newAccounts = accounts.map(a => {
      if (a.id === id) {
        updated = { ...a, ...updates };
        return updated;
      }
      return a;
    });
    setLocalCollection('accounts', newAccounts);
    return updated;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const accounts = getLocalCollection('accounts', initialLocalAccounts);
    setLocalCollection('accounts', accounts.filter(a => a.id !== id));
    return true;
  },

  pauseAll: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/accounts/pause-all`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const accounts = getLocalCollection('accounts', initialLocalAccounts);
    setLocalCollection('accounts', accounts.map(a => ({ ...a, status: 'paused' })));
    return true;
  }
};

// ----------------- Campaigns API & Campaign Lead Management -----------------
export const campaignsApi = {
  list: async (): Promise<Campaign[]> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns`, { headers: getHeaders() });
      if (res.ok) {
        const raw = await res.json();
        return raw.map(hydrateCampaign);
      }
    } catch {}

    const token = getStoredToken();
    const camps = getLocalCollection<Campaign>('campaigns', initialLocalCampaigns);
    return camps.filter(c => !c.user_id || c.user_id === token).map(hydrateCampaign);
  },

  create: async (campaignData: Partial<Campaign> & { initial_leads?: any[] }): Promise<Campaign> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(campaignData)
      });
      if (res.ok) {
        const result = await res.json();
        const all = await campaignsApi.list();
        return all.find(c => c.id === result.id) || hydrateCampaign(result);
      }
    } catch {}

    const token = getStoredToken() || 'usr_cust_01';
    const camps = getLocalCollection<Campaign>('campaigns', initialLocalCampaigns);
    const initialLeads = campaignData.initial_leads || [];
    const newCamp = hydrateCampaign({
      id: `camp_${Date.now()}`,
      user_id: token,
      account_id: campaignData.account_id || 'acct_praneeth_01',
      account_name: campaignData.account_name || 'Praneeth (Primary)',
      name: campaignData.name || 'New Outreach Campaign',
      goal: campaignData.goal || 'outreach',
      status: 'running',
      lead_count: initialLeads.length,
      leadCount: initialLeads.length,
      sent_count: 0,
      sentCount: 0,
      accepted_count: 0,
      acceptedCount: 0,
      replied_count: 0,
      repliedCount: 0,
      booked_count: 0,
      bookedCount: 0,
      stop_on_reply: campaignData.stop_on_reply ?? true,
      stopOnReply: campaignData.stop_on_reply ?? true,
      schedule: campaignData.schedule || {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startHour: 9,
        endHour: 18,
        timezone: 'America/New_York'
      },
      steps: campaignData.steps || [],
      created_at: new Date().toISOString().split('T')[0]
    });
    camps.unshift(newCamp);
    setLocalCollection('campaigns', camps);

    if (initialLeads.length > 0) {
      await leadsApi.bulkImport(initialLeads, newCamp.id);
    }

    return newCamp;
  },

  update: async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return hydrateCampaign(data);
      }
    } catch {}

    const camps = getLocalCollection<Campaign>('campaigns', initialLocalCampaigns);
    let updatedCamp: Campaign = camps.find(c => c.id === id) || ({} as Campaign);
    updatedCamp = hydrateCampaign({ ...updatedCamp, ...updates });
    setLocalCollection('campaigns', camps.map(c => c.id === id ? updatedCamp : c));
    return updatedCamp;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const camps = getLocalCollection<Campaign>('campaigns', initialLocalCampaigns);
    setLocalCollection('campaigns', camps.filter(c => c.id !== id));
    return true;
  },

  getLeads: async (campaignId: string): Promise<Lead[]> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/leads`, { headers: getHeaders() });
      if (res.ok) {
        const raw = await res.json();
        return raw.map(hydrateLead);
      }
    } catch {}

    const allLeads = await leadsApi.list();
    return allLeads.filter(l => l.campaign_id === campaignId || l.campaignId === campaignId);
  },

  addLeads: async (campaignId: string, leads: any[]): Promise<Lead[]> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leads })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data.map(hydrateLead);
      }
    } catch {}

    return await leadsApi.bulkImport(leads, campaignId);
  },

  removeLead: async (campaignId: string, leadId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/leads/${leadId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    await leadsApi.update(leadId, { campaign_id: undefined, campaign_name: undefined, campaignId: undefined, campaignName: undefined });
    return true;
  }
};

// ----------------- Consolidated Leads CRM API -----------------
export const leadsApi = {
  list: async (params?: { search?: string; status?: string; source?: string; campaign_id?: string }): Promise<Lead[]> => {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/leads?${query}`, { headers: getHeaders() });
      if (res.ok) {
        const raw = await res.json();
        return raw.map(hydrateLead);
      }
    } catch {}

    const token = getStoredToken();
    let leads = getLocalCollection<Lead>('leads', initialLocalLeads);
    leads = leads.filter(l => !l.user_id || l.user_id === token);

    if (params?.status && params.status !== 'all') {
      leads = leads.filter(l => l.status === params.status);
    }
    if (params?.source && params.source !== 'all') {
      leads = leads.filter(l => l.source === params.source);
    }
    if (params?.campaign_id) {
      leads = leads.filter(l => l.campaign_id === params.campaign_id || l.campaignId === params.campaign_id);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      leads = leads.filter(l => 
        l.name.toLowerCase().includes(s) ||
        l.company.toLowerCase().includes(s) ||
        l.title.toLowerCase().includes(s) ||
        (l.email && l.email.toLowerCase().includes(s))
      );
    }
    return leads.map(hydrateLead);
  },

  bulkImport: async (leads: any[], campaignId?: string): Promise<Lead[]> => {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leads, campaign_id: campaignId })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data.map(hydrateLead);
      }
    } catch {}

    const token = getStoredToken() || 'usr_cust_01';
    const existing = getLocalCollection<Lead>('leads', initialLocalLeads);
    const newLeads: Lead[] = leads.map((l, i) => {
      const id = l.id || `lead_${Date.now()}_${i}`;
      return hydrateLead({
        ...l,
        id,
        user_id: token,
        campaign_id: campaignId || l.campaign_id || l.campaignId,
        campaignId: campaignId || l.campaign_id || l.campaignId,
        source: l.source || 'manual'
      });
    });

    setLocalCollection('leads', [...newLeads, ...existing]);
    return newLeads;
  },

  create: async (leads: any[], campaignId?: string): Promise<boolean> => {
    await leadsApi.bulkImport(leads, campaignId);
    return true;
  },

  update: async (leadId: string, updates: Partial<Lead>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) return true;
    } catch {}

    const leads = getLocalCollection<Lead>('leads', initialLocalLeads);
    setLocalCollection('leads', leads.map(l => l.id === leadId ? hydrateLead({ ...l, ...updates }) : l));
    return true;
  },

  bulkAssign: async (leadIds: string[], campaignId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/leads/bulk-assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lead_ids: leadIds, campaign_id: campaignId })
      });
      if (res.ok) return true;
    } catch {}

    const leads = getLocalCollection<Lead>('leads', initialLocalLeads);
    setLocalCollection('leads', leads.map(l => leadIds.includes(l.id) ? hydrateLead({ ...l, campaign_id: campaignId, campaignId }) : l));
    return true;
  },

  bulkDelete: async (leadIds: string[]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/leads/bulk-delete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lead_ids: leadIds })
      });
      if (res.ok) return true;
    } catch {}

    const leads = getLocalCollection<Lead>('leads', initialLocalLeads);
    setLocalCollection('leads', leads.filter(l => !leadIds.includes(l.id)));
    return true;
  }
};

// ----------------- Message Studio & Actions API -----------------
export const actionsApi = {
  list: async (): Promise<PendingAction[]> => {
    try {
      const res = await fetch(`${API_BASE}/actions`, { headers: getHeaders() });
      if (res.ok) {
        const raw = await res.json();
        return raw.map(hydrateAction);
      }
    } catch {}

    const actions = getLocalCollection<PendingAction>('actions', initialLocalActions);
    return actions.map(hydrateAction);
  },

  approve: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/actions/${id}/approve`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const actions = getLocalCollection<PendingAction>('actions', initialLocalActions);
    setLocalCollection('actions', actions.filter(a => a.id !== id));
    return true;
  },

  reject: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/actions/${id}/reject`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const actions = getLocalCollection<PendingAction>('actions', initialLocalActions);
    setLocalCollection('actions', actions.filter(a => a.id !== id));
    return true;
  },

  edit: async (id: string, body: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/actions/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ draft_body: body })
      });
      if (res.ok) return true;
    } catch {}

    const actions = getLocalCollection<PendingAction>('actions', initialLocalActions);
    setLocalCollection('actions', actions.map(a => a.id === id ? hydrateAction({ ...a, draft_body: body, draftBody: body, character_count: body.length, characterCount: body.length }) : a));
    return true;
  },

  generateAI: async (leadName: string, company: string, hook: string, tone: string = 'value'): Promise<{ draft: string; length: number }> => {
    try {
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lead_name: leadName, company, hook, tone })
      });
      if (res.ok) return await res.json();
    } catch {}

    const name = leadName.split(' ')[0];
    let draft = '';
    if (tone === 'concise') {
      draft = `Hi ${name} — noticed your leadership at ${company}. Resonated with your focus on ${hook}. Open to connecting?`;
    } else if (tone === 'casual') {
      draft = `Hey ${name}, saw your insights on ${hook}. Huge congrats on the momentum at ${company}! Would love to follow along.`;
    } else {
      draft = `Hi ${name}, came across your work at ${company}. Your focus on ${hook} caught our attention—would love to connect and exchange notes!`;
    }
    return { draft, length: draft.length };
  }
};

// ----------------- Unified Inbox API -----------------
export const inboxApi = {
  list: async (): Promise<InboxThread[]> => {
    try {
      const res = await fetch(`${API_BASE}/inbox`, { headers: getHeaders() });
      if (res.ok) {
        const raw = await res.json();
        return raw.map(hydrateThread);
      }
    } catch {}

    const threads = getLocalCollection<InboxThread>('inbox', initialLocalInbox);
    return threads.map(hydrateThread);
  },

  listThreads: async (): Promise<InboxThread[]> => {
    return inboxApi.list();
  },

  sendMessage: async (threadId: string, text: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${threadId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      if (res.ok) return true;
    } catch {}

    const threads = getLocalCollection<InboxThread>('inbox', initialLocalInbox);
    setLocalCollection('inbox', threads.map(t => {
      if (t.id === threadId) {
        return hydrateThread({
          ...t,
          last_activity: 'Just now',
          unread: false,
          messages: [
            ...t.messages,
            { id: `m_${Date.now()}`, sender: 'user', body: text, timestamp: 'Just now' }
          ]
        });
      }
      return t;
    }));
    return true;
  },

  updateLabel: async (threadId: string, label: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${threadId}/label`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ label })
      });
      if (res.ok) return true;
    } catch {}

    const threads = getLocalCollection<InboxThread>('inbox', initialLocalInbox);
    setLocalCollection('inbox', threads.map(t => t.id === threadId ? { ...t, label: label as any } : t));
    return true;
  }
};

// ----------------- Analytics API -----------------
export const analyticsApi = {
  getFunnel: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/funnel`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const camps = await campaignsApi.list();
    const totalSent = camps.reduce((acc, c) => acc + c.sentCount, 0);
    const totalAccepted = camps.reduce((acc, c) => acc + c.acceptedCount, 0);
    const totalReplied = camps.reduce((acc, c) => acc + c.repliedCount, 0);
    const totalBooked = camps.reduce((acc, c) => acc + c.bookedCount, 0);

    return {
      total_sent: totalSent,
      total_accepted: totalAccepted,
      total_replied: totalReplied,
      total_booked: totalBooked,
      acceptance_rate: totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0,
      reply_rate: totalAccepted > 0 ? Math.round((totalReplied / totalAccepted) * 100) : 0
    };
  }
};

// ----------------- Settings / DNC API -----------------
export const settingsApi = {
  listDnc: async (): Promise<DncRule[]> => {
    try {
      const res = await fetch(`${API_BASE}/settings/dnc`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return getLocalCollection<DncRule>('dnc', () => [
      { id: 'dnc_1', rule: 'competitor-corp.com', is_global: false, created_at: '2026-11-01' },
      { id: 'dnc_2', rule: 'enterprise-client-restricted.io', is_global: true, created_at: '2026-11-01' }
    ]);
  },

  addDnc: async (rule: string): Promise<DncRule> => {
    try {
      const res = await fetch(`${API_BASE}/settings/dnc`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rule })
      });
      if (res.ok) return await res.json();
    } catch {}

    const rules = getLocalCollection<DncRule>('dnc', () => []);
    const newRule: DncRule = {
      id: `dnc_${Date.now()}`,
      rule,
      is_global: false,
      created_at: new Date().toISOString()
    };
    rules.push(newRule);
    setLocalCollection('dnc', rules);
    return newRule;
  },

  deleteDnc: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/settings/dnc/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    const rules = getLocalCollection<DncRule>('dnc', () => []);
    setLocalCollection('dnc', rules.filter(r => r.id !== id));
    return true;
  }
};

// ----------------- System Admin API (Strict Isolation) -----------------
export const adminApi = {
  listUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return getLocalCollection<User>('users', initialLocalUsers);
  },

  updateUserStatus: async (userId: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return true;
    } catch {}

    const users = getLocalCollection<User>('users', initialLocalUsers);
    setLocalCollection('users', users.map(u => u.id === userId ? { ...u, status: status as any } : u));
    return true;
  },

  getFleetMetrics: async (): Promise<FleetMetrics> => {
    try {
      const res = await fetch(`${API_BASE}/admin/fleet`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const users = getLocalCollection<User>('users', initialLocalUsers);
    const accounts = getLocalCollection<LinkedInAccount>('accounts', () => []);
    const totalInvites = accounts.reduce((acc, a) => acc + (a.invites_today || 0), 0);
    const avgHealth = accounts.length > 0 
      ? Math.round(accounts.reduce((acc, a) => acc + (a.health_score || 0), 0) / accounts.length) 
      : 0;

    return {
      active_users: users.filter(u => u.status === 'active').length,
      active_accounts: accounts.filter(a => a.status === 'active').length,
      global_invites_today: totalInvites,
      fleet_health: avgHealth,
      kill_switch_active: false
    };
  },

  toggleEmergencyKillSwitch: async (activate: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/fleet/kill-switch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ active: activate })
      });
      if (res.ok) return true;
    } catch {}

    return true;
  },

  toggleKillSwitch: async (activate: boolean): Promise<boolean> => {
    return adminApi.toggleEmergencyKillSwitch(activate);
  },

  listGlobalDnc: async (): Promise<DncRule[]> => {
    try {
      const res = await fetch(`${API_BASE}/admin/dnc`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return [];
  },

  addGlobalDnc: async (rule: string): Promise<DncRule> => {
    try {
      const res = await fetch(`${API_BASE}/admin/dnc`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rule })
      });
      if (res.ok) return await res.json();
    } catch {}

    return { id: `dnc_glob_${Date.now()}`, rule, is_global: true, created_at: new Date().toISOString() };
  },

  deleteGlobalDnc: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/dnc/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch {}

    return true;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return [];
  }
};
