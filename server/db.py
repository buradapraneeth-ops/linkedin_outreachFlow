import sqlite3
import json
import os
import time

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outreachflow.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Users Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        company_name TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'Pro',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
    )
    ''')

    # LinkedIn Accounts Table (Multiple Accounts Per Customer)
    c.execute('''
    CREATE TABLE IF NOT EXISTS linkedin_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        headline TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        health_score INTEGER NOT NULL DEFAULT 94,
        daily_cap INTEGER NOT NULL DEFAULT 20,
        weekly_cap INTEGER NOT NULL DEFAULT 100,
        invites_today INTEGER NOT NULL DEFAULT 0,
        invites_this_week INTEGER NOT NULL DEFAULT 0,
        warmup_active INTEGER NOT NULL DEFAULT 1,
        warmup_day INTEGER NOT NULL DEFAULT 1,
        min_delay INTEGER NOT NULL DEFAULT 45,
        max_delay INTEGER NOT NULL DEFAULT 180,
        approval_mode TEXT NOT NULL DEFAULT 'approve_all',
        session_token TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')

    # Campaigns Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        goal TEXT NOT NULL DEFAULT 'sales',
        status TEXT NOT NULL DEFAULT 'running',
        stop_on_reply INTEGER NOT NULL DEFAULT 1,
        schedule TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(account_id) REFERENCES linkedin_accounts(id)
    )
    ''')

    # Campaign Steps Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS campaign_steps (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        delay_hours INTEGER NOT NULL DEFAULT 0,
        condition_type TEXT DEFAULT 'none',
        condition_desc TEXT DEFAULT '',
        template_body TEXT DEFAULT '',
        variant_b_body TEXT DEFAULT '',
        FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )
    ''')

    # Leads Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        campaign_id TEXT,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        source TEXT NOT NULL DEFAULT 'manual',
        tags TEXT NOT NULL DEFAULT '[]',
        enrichment TEXT NOT NULL DEFAULT '{}',
        timeline TEXT NOT NULL DEFAULT '[]',
        notes TEXT DEFAULT '',
        lead_score INTEGER NOT NULL DEFAULT 85,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
    )
    ''')

    # Pending Actions / Approvals Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        campaign_id TEXT,
        account_id TEXT NOT NULL,
        lead_id TEXT NOT NULL,
        type TEXT NOT NULL,
        draft_body TEXT NOT NULL,
        character_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        ai_confidence INTEGER NOT NULL DEFAULT 92,
        reasoning TEXT,
        scheduled_time TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
    ''')

    # Inbox Threads Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS inbox_threads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        lead_id TEXT NOT NULL,
        label TEXT NOT NULL DEFAULT 'interested',
        unread INTEGER NOT NULL DEFAULT 0,
        last_activity TEXT NOT NULL,
        messages TEXT NOT NULL DEFAULT '[]',
        suggested_replies TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
    ''')

    # Do-Not-Contact Rules Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS dnc_rules (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        rule TEXT NOT NULL,
        is_global INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )
    ''')

    # System Audit Logs Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_email TEXT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    ''')

    # System Settings Table (Kill-switch, fleet controls)
    c.execute('''
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')

    conn.commit()

    # Seed default users and accounts if empty
    c.execute('SELECT COUNT(*) FROM users')
    if c.fetchone()[0] == 0:
        seed_database(conn)

    conn.close()

def seed_database(conn):
    c = conn.cursor()
    now = time.strftime('%Y-%m-%d %H:%M:%S')

    # Seed Admin User
    admin_id = 'usr_admin_01'
    c.execute('''
    INSERT INTO users (id, name, email, password_hash, role, company_name, plan, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (admin_id, 'Alex Vance (Super Admin)', 'admin@outreachflow.com', 'adminpassword', 'admin', 'OutreachFlow HQ', 'Enterprise', 'active', now))

    # Seed Customer User
    customer_id = 'usr_cust_01'
    c.execute('''
    INSERT INTO users (id, name, email, password_hash, role, company_name, plan, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (customer_id, 'Praneeth Burada', 'praneeth@techinnovate.io', 'password123', 'customer', 'TechInnovate AI', 'Pro', 'active', now))

    # Seed 2 Other Customer Tenants for Admin View
    c.execute('''
    INSERT INTO users (id, name, email, password_hash, role, company_name, plan, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('usr_cust_02', 'Sophia Chen', 'sophia@cloudscale.net', 'password123', 'customer', 'CloudScale Corp', 'Starter', 'active', now))

    c.execute('''
    INSERT INTO users (id, name, email, password_hash, role, company_name, plan, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('usr_cust_03', 'Liam Henderson', 'liam@fintechsurge.io', 'password123', 'customer', 'FintechSurge', 'Starter', 'suspended', now))

    # Seed Multiple LinkedIn Accounts for Customer Praneeth
    acct_1 = 'acct_praneeth_01'
    c.execute('''
    INSERT INTO linkedin_accounts (
        id, user_id, name, headline, linkedin_url, status, health_score, daily_cap, weekly_cap,
        invites_today, invites_this_week, warmup_active, warmup_day, min_delay, max_delay, approval_mode, session_token, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        acct_1, customer_id, 'Praneeth Burada (Primary)', 'Founder & Head of Growth · TechInnovate AI',
        'https://linkedin.com/in/praneeth-burada', 'active', 94, 20, 100, 14, 72, 1, 11, 45, 180, 'approve_all',
        'enc_li_at_9921fa8c0', now
    ))

    acct_2 = 'acct_praneeth_02'
    c.execute('''
    INSERT INTO linkedin_accounts (
        id, user_id, name, headline, linkedin_url, status, health_score, daily_cap, weekly_cap,
        invites_today, invites_this_week, warmup_active, warmup_day, min_delay, max_delay, approval_mode, session_token, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        acct_2, customer_id, 'Praneeth (Enterprise Executive)', 'Strategic Partnerships & AI Solutions',
        'https://linkedin.com/in/praneeth-enterprise', 'active', 89, 15, 80, 6, 34, 1, 6, 50, 160, 'approve_all',
        'enc_li_at_44b0291e7', now
    ))

    # Seed Admin Accounts
    c.execute('''
    INSERT INTO linkedin_accounts (
        id, user_id, name, headline, linkedin_url, status, health_score, daily_cap, weekly_cap,
        invites_today, invites_this_week, warmup_active, warmup_day, min_delay, max_delay, approval_mode, session_token, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'acct_admin_01', admin_id, 'Alex Vance (Platform Ops)', 'Systems & Network Infrastructure Lead',
        'https://linkedin.com/in/alex-vance-admin', 'active', 99, 50, 250, 22, 110, 0, 14, 30, 90, 'autonomous_safe',
        'enc_li_at_admin_root', now
    ))

    # Seed Campaign with Attached Account
    camp_1 = 'camp_ent_01'
    c.execute('''
    INSERT INTO campaigns (id, user_id, account_id, name, goal, status, stop_on_reply, schedule, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        camp_1, customer_id, acct_1, 'Enterprise VPs of Engineering (US)', 'sales', 'running', 1,
        json.dumps({
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'startHour': 9,
            'endHour': 18,
            'timezone': 'America/New_York'
        }), now
    ))

    camp_2 = 'camp_exec_02'
    c.execute('''
    INSERT INTO campaigns (id, user_id, account_id, name, goal, status, stop_on_reply, schedule, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        camp_2, customer_id, acct_2, 'Executive AI Partnerships & Leadership', 'networking', 'running', 1,
        json.dumps({
            'days': ['Tue', 'Wed', 'Thu'],
            'startHour': 10,
            'endHour': 17,
            'timezone': 'America/Chicago'
        }), now
    ))

    # Seed Campaign Steps
    c.execute('''
    INSERT INTO campaign_steps (id, campaign_id, position, type, title, delay_hours, condition_type, condition_desc, template_body, variant_b_body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('step_01', camp_1, 1, 'view', 'Warm-up: View Profile', 0, 'none', 'Immediate initial profile view', '', ''))

    c.execute('''
    INSERT INTO campaign_steps (id, campaign_id, position, type, title, delay_hours, condition_type, condition_desc, template_body, variant_b_body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('step_02', camp_1, 2, 'invite', 'Connection Request with AI Note', 4, 'none', '4 hours after view',
          'Hi {{first_name}}, came across your work leading engineering at {{company}}. {{recent_post_hook}} Would love to connect and exchange notes on modern scale!',
          'Hi {{first_name}} — noticed your engineering leadership at {{company}}. Always keen to follow peers scaling resilient tech teams. Let\'s connect!'))

    c.execute('''
    INSERT INTO campaign_steps (id, campaign_id, position, type, title, delay_hours, condition_type, condition_desc, template_body, variant_b_body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('step_03', camp_1, 3, 'message', 'Step 1: First Value Message', 24, 'if_accepted', 'Wait 24h after connection accepted',
          'Thanks for connecting, {{first_name}}! Given your team\'s focus at {{company}}, I put together a 3-page teardown on eliminating pipeline bottlenecks in distributed systems. Would you be open to a quick peek?', ''))

    # Seed Real Leads associated with customer and campaigns
    lead_1 = 'lead_01'
    c.execute('''
    INSERT INTO leads (
        id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        lead_1, customer_id, camp_1, 'Sarah Jenkins', 'VP of Engineering', 'CloudScale Systems', 'San Francisco, CA',
        'https://linkedin.com/in/sarah-jenkins-cloudscale', 'sarah.jenkins@cloudscale.net',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        'replied', 'sales_navigator',
        json.dumps(['Tier 1', 'Engineering Leader', 'Series B+']),
        json.dumps({
            'recentPostSnippet': 'Excited to announce our migration to distributed multi-cloud architecture and hiring 15 engineers!',
            'mutualConnections': 18,
            'companyHeadcount': '250-500 employees',
            'industry': 'Cloud Infrastructure',
            'personalizedHook': 'Loved your post regarding multi-cloud resilience and scaling your engineering team.',
            'connectionDegree': '2nd'
        }),
        json.dumps([
            {'id': 't1', 'date': '2026-11-18 09:14', 'type': 'profile_viewed', 'note': 'Automated warm-up view via extension'},
            {'id': 't2', 'date': '2026-11-18 10:22', 'type': 'invite_sent', 'note': 'Personalized invite note approved and sent'},
            {'id': 't3', 'date': '2026-11-19 14:05', 'type': 'invite_accepted', 'note': 'Sarah accepted connection request'},
            {'id': 't4', 'date': '2026-11-19 16:30', 'type': 'message_sent', 'note': 'Step 1 message sent with engineering scaling playbook'},
            {'id': 't5', 'date': '2026-11-20 11:15', 'type': 'reply_received', 'note': 'Interested! "Would love to see how your tool optimizes cloud workflows."'}
        ]),
        'Very interested in pipeline observability. Demo scheduled for next Tuesday.', 95, now
    ))

    lead_2 = 'lead_02'
    c.execute('''
    INSERT INTO leads (
        id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        lead_2, customer_id, camp_1, 'David Zhao', 'Chief Technology Officer', 'FintechVertex', 'New York, NY',
        'https://linkedin.com/in/david-zhao-fintech', 'dzhao@fintechvertex.com',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'connected', 'csv_upload',
        json.dumps(['Fintech', 'Executive', 'High Intent']),
        json.dumps({
            'recentPostSnippet': 'Security and real-time compliance are non-negotiable when handling transaction throughput at scale.',
            'mutualConnections': 9,
            'companyHeadcount': '100-250 employees',
            'industry': 'Financial Technology',
            'personalizedHook': 'Your points on real-time transaction compliance resonated strongly with our team.',
            'connectionDegree': '2nd'
        }),
        json.dumps([
            {'id': 't6', 'date': '2026-11-17 11:00', 'type': 'profile_viewed'},
            {'id': 't7', 'date': '2026-11-17 14:45', 'type': 'invite_sent'},
            {'id': 't8', 'date': '2026-11-19 09:12', 'type': 'invite_accepted'}
        ]),
        'Accepted invite. Step 3 message queued for approval.', 88, now
    ))

    lead_3 = 'lead_03'
    c.execute('''
    INSERT INTO leads (
        id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        lead_3, customer_id, camp_2, 'Elena Rostova', 'Head of People & Talent', 'Nexus Robotics', 'Austin, TX',
        'https://linkedin.com/in/elena-rostova-nexus', 'elena@nexusrobotics.ai',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'meeting_booked', 'manual',
        json.dumps(['Recruiting', 'Executive']),
        json.dumps({
            'recentPostSnippet': 'We are expanding our autonomous robotics team in Austin and looking for senior ML researchers.',
            'mutualConnections': 24,
            'companyHeadcount': '500-1000 employees',
            'industry': 'Robotics & AI',
            'personalizedHook': 'Noticed Nexus is aggressively hiring robotics ML specialists in Austin.',
            'connectionDegree': '1st'
        }),
        json.dumps([
            {'id': 't9', 'date': '2026-11-15 10:10', 'type': 'invite_sent'},
            {'id': 't10', 'date': '2026-11-16 12:40', 'type': 'invite_accepted'},
            {'id': 't11', 'date': '2026-11-16 15:20', 'type': 'message_sent'},
            {'id': 't12', 'date': '2026-11-17 10:05', 'type': 'reply_received'}
        ]),
        'Booked 30min intro call on Calendly for Friday 2 PM.', 98, now
    ))

    # Seed Pending Action in Approval Queue
    c.execute('''
    INSERT INTO actions (
        id, user_id, campaign_id, account_id, lead_id, type, draft_body, character_count, status, ai_confidence, reasoning, scheduled_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'act_101', customer_id, camp_1, acct_1, lead_2, 'message',
        'Thanks for connecting, David! Noticed your recent focus on transaction compliance at FintechVertex. We built a zero-lag telemetry layer specifically for high-throughput fintech pipelines. Would love to share our architecture notes if relevant to your Q1 goals?',
        268, 'pending', 96,
        'Synthesized recent post on compliance + verified 1st degree connection accepted yesterday.',
        'Today at 2:30 PM (US/Eastern)', now
    ))

    # Seed Inbox Thread
    c.execute('''
    INSERT INTO inbox_threads (
        id, user_id, account_id, lead_id, label, unread, last_activity, messages, suggested_replies, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'inbox_01', customer_id, acct_1, lead_1, 'interested', 1, '24 mins ago',
        json.dumps([
            {'id': 'm1', 'sender': 'user', 'body': 'Hi Sarah, came across your work leading engineering at CloudScale Systems. Loved your post regarding multi-cloud resilience and scaling your engineering team. Would love to connect!', 'timestamp': 'Nov 18, 10:22 AM'},
            {'id': 'm2', 'sender': 'lead', 'body': 'Thanks for connecting Praneeth! Always glad to meet fellow tech leaders.', 'timestamp': 'Nov 19, 2:05 PM'},
            {'id': 'm3', 'sender': 'user', 'body': 'Thanks Sarah! Given your team\'s rapid expansion, I put together a 3-page teardown on eliminating pipeline bottlenecks in distributed systems. Would you be open to a quick peek?', 'timestamp': 'Nov 19, 4:30 PM'},
            {'id': 'm4', 'sender': 'lead', 'body': 'Definitely interested. We are actively refactoring our ingestion pipeline this quarter. Do you have 15 mins for a quick Zoom this Thursday or Friday?', 'timestamp': 'Today, 11:15 AM'}
        ]),
        json.dumps([
            'Awesome! Thursday at 2 PM PT works great. Here is my Calendly link: cal.com/praneeth/15min or let me know what time works best for you.',
            'Gladly! I will send over a calendar invite along with the architecture PDF before we chat.',
            'Friday at 11 AM PT would be ideal. Looking forward to discussing your ingestion pipeline refactor.'
        ]), now
    ))

    # Seed DNC Rules
    c.execute('INSERT INTO dnc_rules (id, user_id, rule, is_global, created_at) VALUES (?, ?, ?, ?, ?)',
              ('dnc_01', customer_id, 'competitor-corp.com', 0, now))
    c.execute('INSERT INTO dnc_rules (id, user_id, rule, is_global, created_at) VALUES (?, ?, ?, ?, ?)',
              ('dnc_02', None, 'enterprise-client-restricted.io', 1, now))

    # Seed Audit Logs
    c.execute('INSERT INTO audit_logs (id, user_id, user_email, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
              ('log_01', customer_id, 'praneeth@techinnovate.io', 'LOGIN', 'Authenticated via Session Token', now))
    c.execute('INSERT INTO audit_logs (id, user_id, user_email, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
              ('log_02', customer_id, 'praneeth@techinnovate.io', 'CAMPAIGN_LAUNCH', 'Launched Enterprise VPs of Engineering', now))

    # Seed System Settings
    c.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ('global_kill_switch', 'false'))
    c.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', ('rate_limit_per_minute', '60'))

    conn.commit()
