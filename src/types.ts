export type NavTab = 
  | 'dashboard' 
  | 'accounts'
  | 'onboarding' 
  | 'leads' 
  | 'campaigns' 
  | 'message-studio' 
  | 'inbox' 
  | 'analytics' 
  | 'settings' 
  | 'safety-simulator'
  | 'admin-portal';

export type AdminTab = 
  | 'fleet-overview'
  | 'tenants'
  | 'global-dnc'
  | 'audit-logs'
  | 'system-settings';

export type LeadStatus = 'new' | 'invited' | 'connected' | 'replied' | 'meeting_booked' | 'blacklisted';

export type LeadSource = 'manual' | 'sales_navigator' | 'csv_upload';

export interface Lead {
  id: string;
  user_id?: string;
  name: string;
  title: string;
  company: string;
  location: string;
  linkedin_url?: string;
  linkedinUrl?: string;
  email?: string;
  avatar: string;
  status: LeadStatus;
  source: LeadSource;
  campaign_id?: string;
  campaignId?: string;
  campaign_name?: string;
  campaignName?: string;
  tags: string[];
  enrichment: {
    recentPostSnippet: string;
    mutualConnections: number;
    companyHeadcount: string;
    industry: string;
    personalizedHook: string;
    connectionDegree?: '1st' | '2nd' | '3rd+';
  };
  timeline: {
    id: string;
    date: string;
    type: 'profile_viewed' | 'invite_sent' | 'invite_accepted' | 'message_sent' | 'reply_received' | 'safety_pause';
    note?: string;
  }[];
  notes?: string;
  lead_score?: number;
  leadScore?: number;
  created_at?: string;
  createdAt?: string;
}

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  company_name: string;
  companyName?: string;
  connected_accounts_count?: number;
  status: 'active' | 'suspended';
  created_at: string;
  createdAt?: string;
  avg_health?: number;
}

export interface LinkedInAccount {
  id: string;
  user_id: string;
  name: string;
  headline?: string;
  linkedin_url?: string;
  avatar_url?: string;
  status: 'active' | 'warning' | 'paused' | 'warming_up' | 'disconnected';
  health_score: number;
  daily_cap: number;
  weekly_cap: number;
  invites_today: number;
  invites_this_week: number;
  warmup_active: boolean;
  warmup_day: number;
  min_delay: number;
  max_delay: number;
  approval_mode: 'approve_all' | 'autonomous_safe' | 'manual' | 'semi-auto' | 'full-auto';
  session_token?: string;
  proxy_region?: string;
  created_at: string;
}

export type StepType = 'view' | 'like' | 'invite' | 'message' | 'follow_up';

export interface CampaignStep {
  id: string;
  campaign_id?: string;
  position: number;
  type: StepType;
  title: string;
  delay_hours: number;
  condition_type?: string;
  condition_desc?: string;
  template_body?: string;
  variant_b_body?: string;
}

export interface Campaign {
  id: string;
  user_id?: string;
  account_id?: string;
  account_name?: string;
  name: string;
  goal?: string;
  status: 'running' | 'paused' | 'draft';
  lead_count: number;
  leadCount: number;
  sent_count: number;
  sentCount: number;
  accepted_count: number;
  acceptedCount: number;
  replied_count: number;
  repliedCount: number;
  booked_count: number;
  bookedCount: number;
  stop_on_reply: boolean;
  stopOnReply: boolean;
  schedule: {
    days: string[];
    startHour: number;
    endHour: number;
    timezone: string;
  };
  steps: CampaignStep[];
  created_at: string;
  createdAt?: string;
}

export interface PendingAction {
  id: string;
  lead_id: string;
  leadId: string;
  campaign_id?: string;
  campaignId?: string;
  account_id?: string;
  lead_name: string;
  leadName: string;
  lead_title: string;
  leadTitle: string;
  lead_company: string;
  leadCompany: string;
  lead_avatar: string;
  leadAvatar: string;
  campaign_name?: string;
  campaignName?: string;
  type: StepType;
  draft_body: string;
  draftBody: string;
  character_count: number;
  characterCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  ai_confidence: number;
  aiConfidence: number;
  reasoning: string;
  scheduled_time: string;
  scheduledTime: string;
  created_at?: string;
}

export interface InboxThread {
  id: string;
  lead_id: string;
  leadId: string;
  account_id?: string;
  lead_name: string;
  leadName: string;
  lead_title: string;
  leadTitle: string;
  lead_company: string;
  leadCompany: string;
  lead_avatar: string;
  leadAvatar: string;
  unread: boolean;
  label: 'interested' | 'not_now' | 'wrong_person' | 'general';
  last_activity: string;
  lastActivity: string;
  messages: {
    id: string;
    sender: 'user' | 'lead';
    body: string;
    timestamp: string;
  }[];
  suggested_replies: string[];
  suggestedReplies?: string[];
  created_at?: string;
}

export interface DncRule {
  id: string;
  user_id?: string;
  rule: string;
  is_global: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FleetMetrics {
  active_users: number;
  active_accounts: number;
  global_invites_today: number;
  fleet_health: number;
  kill_switch_active: boolean;
}

export interface AccountSafetyConfig {
  accountName: string;
  profileHeadline: string;
  dailyInviteCap: number;
  weeklyInviteCap: number;
  invitesSentToday: number;
  invitesSentThisWeek: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  warmupModeActive: boolean;
  warmupDay: number;
  healthScore: number;
  autoPauseOnAcceptanceDrop: boolean;
  approvalMode: 'manual' | 'semi-auto' | 'full-auto' | 'approve_all' | 'autonomous_safe';
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
  tags?: string[];
}
