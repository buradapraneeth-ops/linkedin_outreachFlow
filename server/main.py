import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import json
import time
import uuid

try:
    from server.db import get_db, init_db
except ImportError:
    from db import get_db, init_db

# Initialize database tables and seed records on startup
init_db()

app = FastAPI(title="OutreachFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Auth Helper -----------------
def get_current_user(authorization: Optional[str] = Header(None)):
    """Simple auth dependency extracting user_id from Bearer token or fallback user"""
    conn = get_db()
    c = conn.cursor()
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        c.execute("SELECT * FROM users WHERE id = ?", (token,))
        row = c.fetchone()
        if row:
            conn.close()
            return dict(row)
    # Default to first customer user if token not provided
    c.execute("SELECT * FROM users WHERE role = 'customer' LIMIT 1")
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    raise HTTPException(status_code=401, detail="Unauthorized")

# ----------------- Models -----------------
class LoginRequest(BaseModel):
    email: str
    password: str

class AccountCreateRequest(BaseModel):
    name: str
    headline: str
    linkedin_url: str
    daily_cap: Optional[int] = 20
    weekly_cap: Optional[int] = 100
    warmup_active: Optional[bool] = True
    session_token: Optional[str] = "enc_li_at_default"

class CampaignStepModel(BaseModel):
    id: Optional[str] = None
    position: int
    type: str
    title: str
    delay_hours: int = 0
    condition_type: Optional[str] = 'none'
    condition_desc: Optional[str] = ''
    template_body: Optional[str] = ''
    variant_b_body: Optional[str] = ''

class CampaignCreateRequest(BaseModel):
    name: str
    account_id: str
    goal: Optional[str] = 'outreach'
    stop_on_reply: bool = True
    schedule: Dict[str, Any]
    steps: List[CampaignStepModel] = []
    initial_leads: Optional[List[Dict[str, Any]]] = []

class LeadCreateRequest(BaseModel):
    name: str
    title: str
    company: str
    location: Optional[str] = "United States"
    linkedin_url: str
    email: Optional[str] = None
    campaign_id: Optional[str] = None
    tags: Optional[List[str]] = []
    source: str = 'manual'
    notes: Optional[str] = ""
    enrichment: Optional[Dict[str, Any]] = None

class BulkLeadsRequest(BaseModel):
    leads: List[LeadCreateRequest]
    campaign_id: Optional[str] = None

class BulkAssignRequest(BaseModel):
    lead_ids: List[str]
    campaign_id: str

class BulkDeleteRequest(BaseModel):
    lead_ids: List[str]

class AIGenerateRequest(BaseModel):
    lead_name: str
    company: str
    hook: str
    tone: str = 'value'

# ----------------- Auth Endpoints -----------------
@app.post("/v1/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (req.email,))
    user = c.fetchone()
    if not user or user["password_hash"] != req.password:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_dict = dict(user)
    c.execute(
        "INSERT INTO audit_logs (id, user_id, user_email, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), user_dict["id"], user_dict["email"], "LOGIN", f"Signed in as {user_dict['role']}", time.strftime('%Y-%m-%d %H:%M:%S'))
    )
    conn.commit()
    conn.close()
    return {"token": user_dict["id"], "user": user_dict}

@app.get("/v1/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return user

# ----------------- Multiple LinkedIn Accounts -----------------
@app.get("/v1/accounts")
def list_accounts(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM linkedin_accounts WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

@app.post("/v1/accounts")
def create_account(req: AccountCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    acct_id = f"acct_{uuid.uuid4().hex[:10]}"
    now = time.strftime('%Y-%m-%d %H:%M:%S')

    c.execute('''
    INSERT INTO linkedin_accounts (
        id, user_id, name, headline, linkedin_url, status, health_score, daily_cap, weekly_cap,
        invites_today, invites_this_week, warmup_active, warmup_day, min_delay, max_delay, approval_mode, session_token, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        acct_id, user["id"], req.name, req.headline, req.linkedin_url, 'active', 95,
        req.daily_cap or 20, req.weekly_cap or 100, 0, 0, 1 if req.warmup_active else 0,
        1, 45, 180, 'approve_all', req.session_token, now
    ))
    conn.commit()

    c.execute("SELECT * FROM linkedin_accounts WHERE id = ?", (acct_id,))
    new_acct = dict(c.fetchone())
    conn.close()
    return new_acct

@app.patch("/v1/accounts/{account_id}")
def update_account(account_id: str, updates: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    fields = []
    values = []
    allowed = ['name', 'headline', 'status', 'daily_cap', 'weekly_cap', 'warmup_active', 'warmup_day', 'approval_mode', 'min_delay', 'max_delay']
    for k, v in updates.items():
        if k in allowed:
            fields.append(f"{k} = ?")
            values.append(v)
    if fields:
        values.extend([account_id, user["id"]])
        c.execute(f"UPDATE linkedin_accounts SET {', '.join(fields)} WHERE id = ? AND user_id = ?", values)
        conn.commit()
    
    c.execute("SELECT * FROM linkedin_accounts WHERE id = ?", (account_id,))
    updated = dict(c.fetchone())
    conn.close()
    return updated

@app.delete("/v1/accounts/{account_id}")
def delete_account(account_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM linkedin_accounts WHERE id = ? AND user_id = ?", (account_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/v1/accounts/pause-all")
def pause_all_accounts(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE linkedin_accounts SET status = 'paused' WHERE user_id = ?", (user["id"],))
    c.execute("UPDATE campaigns SET status = 'paused' WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return {"success": True, "message": "All campaigns and accounts paused."}

# ----------------- Campaigns & Campaign Lead Management -----------------
@app.get("/v1/campaigns")
def list_campaigns(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
    SELECT c.*, a.name as account_name,
        (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id) as lead_count,
        (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id AND l.status IN ('invited', 'connected', 'replied', 'meeting_booked')) as sent_count,
        (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id AND l.status IN ('connected', 'replied', 'meeting_booked')) as accepted_count,
        (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id AND l.status IN ('replied', 'meeting_booked')) as replied_count,
        (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id AND l.status = 'meeting_booked') as booked_count
    FROM campaigns c
    LEFT JOIN linkedin_accounts a ON c.account_id = a.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    ''', (user["id"],))
    
    campaigns = []
    for row in c.fetchall():
        camp = dict(row)
        camp["schedule"] = json.loads(camp["schedule"])
        camp["stop_on_reply"] = bool(camp["stop_on_reply"])
        
        c.execute("SELECT * FROM campaign_steps WHERE campaign_id = ? ORDER BY position ASC", (camp["id"],))
        camp["steps"] = [dict(s) for s in c.fetchall()]
        campaigns.append(camp)

    conn.close()
    return campaigns

@app.post("/v1/campaigns")
def create_campaign(req: CampaignCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    camp_id = f"camp_{uuid.uuid4().hex[:10]}"
    now = time.strftime('%Y-%m-%d %H:%M:%S')

    c.execute('''
    INSERT INTO campaigns (id, user_id, account_id, name, goal, status, stop_on_reply, schedule, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        camp_id, user["id"], req.account_id, req.name, req.goal or 'outreach', 'running',
        1 if req.stop_on_reply else 0, json.dumps(req.schedule), now
    ))

    for idx, step in enumerate(req.steps):
        step_id = step.id or f"step_{uuid.uuid4().hex[:8]}"
        c.execute('''
        INSERT INTO campaign_steps (
            id, campaign_id, position, type, title, delay_hours, condition_type, condition_desc, template_body, variant_b_body
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            step_id, camp_id, idx + 1, step.type, step.title, step.delay_hours,
            step.condition_type or 'none', step.condition_desc or '',
            step.template_body or '', step.variant_b_body or ''
        ))

    if req.initial_leads:
        for l in req.initial_leads:
            lead_id = f"lead_{uuid.uuid4().hex[:10]}"
            c.execute('''
            INSERT INTO leads (
                id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                lead_id, user["id"], camp_id, l.get("name", "New Lead"), l.get("title", "Executive"),
                l.get("company", "Company"), l.get("location", "United States"), l.get("linkedin_url", ""),
                l.get("email"), l.get("avatar", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"),
                'new', l.get("source", "manual"), json.dumps(l.get("tags", [])),
                json.dumps(l.get("enrichment", {})), json.dumps([]), l.get("notes", ""), 85, now
            ))

    conn.commit()
    conn.close()
    return {"id": camp_id, "name": req.name}

@app.get("/v1/campaigns/{campaign_id}/leads")
def get_campaign_leads(campaign_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM leads WHERE campaign_id = ? AND user_id = ? ORDER BY created_at DESC", (campaign_id, user["id"]))
    leads = []
    for r in c.fetchall():
        lead = dict(r)
        lead["tags"] = json.loads(lead["tags"])
        lead["enrichment"] = json.loads(lead["enrichment"])
        lead["timeline"] = json.loads(lead["timeline"])
        leads.append(lead)
    conn.close()
    return leads

@app.post("/v1/campaigns/{campaign_id}/leads")
def add_leads_to_campaign(campaign_id: str, req: BulkLeadsRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    now = time.strftime('%Y-%m-%d %H:%M:%S')

    created = []
    for l in req.leads:
        lead_id = f"lead_{uuid.uuid4().hex[:10]}"
        c.execute('''
        INSERT INTO leads (
            id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            lead_id, user["id"], campaign_id, l.name, l.title, l.company,
            l.location or "United States", l.linkedin_url, l.email,
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            'new', l.source, json.dumps(l.tags or []),
            json.dumps(l.enrichment or {'recentPostSnippet': '', 'mutualConnections': 5, 'companyHeadcount': '100+', 'industry': 'Tech', 'personalizedHook': f'Resonated with your leadership at {l.company}'}),
            json.dumps([{'id': f't_{uuid.uuid4().hex[:6]}', 'date': 'Just now', 'type': 'profile_viewed', 'note': f'Added directly to campaign sequence'}]),
            l.notes or '', 85, now
        ))
        created.append(lead_id)

    conn.commit()
    conn.close()
    return {"success": True, "count": len(created), "lead_ids": created}

@app.delete("/v1/campaigns/{campaign_id}/leads/{lead_id}")
def remove_lead_from_campaign(campaign_id: str, lead_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE leads SET campaign_id = NULL WHERE id = ? AND campaign_id = ? AND user_id = ?", (lead_id, campaign_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.patch("/v1/campaigns/{campaign_id}")
def update_campaign(campaign_id: str, updates: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    if 'status' in updates:
        c.execute("UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ?", (updates['status'], campaign_id, user["id"]))
    if 'name' in updates:
        c.execute("UPDATE campaigns SET name = ? WHERE id = ? AND user_id = ?", (updates['name'], campaign_id, user["id"]))
    if 'account_id' in updates:
        c.execute("UPDATE campaigns SET account_id = ? WHERE id = ? AND user_id = ?", (updates['account_id'], campaign_id, user["id"]))
    if 'stop_on_reply' in updates:
        c.execute("UPDATE campaigns SET stop_on_reply = ? WHERE id = ? AND user_id = ?", (1 if updates['stop_on_reply'] else 0, campaign_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/v1/campaigns/{campaign_id}")
def delete_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

# ----------------- Consolidated Leads CRM -----------------
@app.get("/v1/leads")
def list_leads(
    user: dict = Depends(get_current_user),
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    campaign_id: Optional[str] = None
):
    conn = get_db()
    c = conn.cursor()
    query = '''
    SELECT l.*, c.name as campaign_name
    FROM leads l
    LEFT JOIN campaigns c ON l.campaign_id = c.id
    WHERE l.user_id = ?
    '''
    params = [user["id"]]

    if status and status != 'all':
        query += " AND l.status = ?"
        params.append(status)
    if source and source != 'all':
        query += " AND l.source = ?"
        params.append(source)
    if campaign_id:
        query += " AND l.campaign_id = ?"
        params.append(campaign_id)
    if search:
        query += " AND (l.name LIKE ? OR l.company LIKE ? OR l.title LIKE ? OR l.email LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    query += " ORDER BY l.created_at DESC"
    c.execute(query, params)

    leads = []
    for r in c.fetchall():
        lead = dict(r)
        lead["tags"] = json.loads(lead["tags"])
        lead["enrichment"] = json.loads(lead["enrichment"])
        lead["timeline"] = json.loads(lead["timeline"])
        leads.append(lead)

    conn.close()
    return leads

@app.post("/v1/leads")
def create_leads(req: BulkLeadsRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    now = time.strftime('%Y-%m-%d %H:%M:%S')

    created = []
    for l in req.leads:
        lead_id = f"lead_{uuid.uuid4().hex[:10]}"
        c.execute('''
        INSERT INTO leads (
            id, user_id, campaign_id, name, title, company, location, linkedin_url, email, avatar, status, source, tags, enrichment, timeline, notes, lead_score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            lead_id, user["id"], req.campaign_id or l.campaign_id, l.name, l.title, l.company,
            l.location or "United States", l.linkedin_url, l.email,
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            'new', l.source, json.dumps(l.tags or []),
            json.dumps(l.enrichment or {'recentPostSnippet': '', 'mutualConnections': 6, 'companyHeadcount': '100+', 'industry': 'Tech', 'personalizedHook': f'Saw your work at {l.company}'}),
            json.dumps([]), l.notes or '', 85, now
        ))
        created.append(lead_id)

    conn.commit()
    conn.close()
    return {"success": True, "count": len(created)}

@app.patch("/v1/leads/{lead_id}")
def update_lead(lead_id: str, updates: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    allowed = ['status', 'notes', 'campaign_id']
    for k in allowed:
        if k in updates:
            c.execute(f"UPDATE leads SET {k} = ? WHERE id = ? AND user_id = ?", (updates[k], lead_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/v1/leads/bulk-assign")
def bulk_assign(req: BulkAssignRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    for lid in req.lead_ids:
        c.execute("UPDATE leads SET campaign_id = ? WHERE id = ? AND user_id = ?", (req.campaign_id, lid, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/v1/leads/bulk-delete")
def bulk_delete(req: BulkDeleteRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    for lid in req.lead_ids:
        c.execute("DELETE FROM leads WHERE id = ? AND user_id = ?", (lid, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

# ----------------- Message Studio & Actions -----------------
@app.get("/v1/actions")
def list_actions(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
    SELECT a.*, l.name as lead_name, l.title as lead_title, l.company as lead_company, l.avatar as lead_avatar,
           c.name as campaign_name
    FROM actions a
    JOIN leads l ON a.lead_id = l.id
    LEFT JOIN campaigns c ON a.campaign_id = c.id
    WHERE a.user_id = ? AND a.status = 'pending'
    ORDER BY a.created_at DESC
    ''', (user["id"],))
    actions = [dict(r) for r in c.fetchall()]
    conn.close()
    return actions

@app.post("/v1/actions/{action_id}/approve")
def approve_action(action_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE actions SET status = 'approved' WHERE id = ? AND user_id = ?", (action_id, user["id"]))
    
    c.execute("SELECT account_id FROM actions WHERE id = ?", (action_id,))
    act = c.fetchone()
    if act:
        c.execute("UPDATE linkedin_accounts SET invites_today = invites_today + 1, invites_this_week = invites_this_week + 1 WHERE id = ?", (act["account_id"],))

    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/v1/actions/{action_id}/reject")
def reject_action(action_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE actions SET status = 'rejected' WHERE id = ? AND user_id = ?", (action_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@app.patch("/v1/actions/{action_id}")
def edit_action_body(action_id: str, updates: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    if 'draft_body' in updates:
        body = updates['draft_body']
        c.execute("UPDATE actions SET draft_body = ?, character_count = ? WHERE id = ? AND user_id = ?", (body, len(body), action_id, user["id"]))
        conn.commit()
    conn.close()
    return {"success": True}

@app.post("/v1/ai/generate")
def ai_generate_note(req: AIGenerateRequest):
    name = req.lead_name.split(" ")[0]
    if req.tone == 'concise':
        draft = f"Hi {name} — noticed your leadership at {req.company}. Resonated with your focus on {req.hook}. Open to connecting?"
    elif req.tone == 'casual':
        draft = f"Hey {name}, saw your insights on {req.hook}. Huge congrats on the momentum at {req.company}! Would love to follow along."
    elif req.tone == 'thoughtful':
        draft = f"Hi {name}, your perspective on {req.hook} at {req.company} is spot on for engineering roadmaps. Keen to stay connected!"
    else:
        draft = f"Hi {name}, came across your work at {req.company}. Your work on {req.hook} caught our attention—would love to connect and exchange notes!"

    return {"draft": draft, "length": len(draft)}

# ----------------- Unified Inbox -----------------
@app.get("/v1/inbox")
def list_inbox(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
    SELECT i.*, l.name as lead_name, l.title as lead_title, l.company as lead_company, l.avatar as lead_avatar
    FROM inbox_threads i
    JOIN leads l ON i.lead_id = l.id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
    ''', (user["id"],))
    threads = []
    for r in c.fetchall():
        t = dict(r)
        t["messages"] = json.loads(t["messages"])
        t["suggested_replies"] = json.loads(t["suggested_replies"])
        threads.append(t)
    conn.close()
    return threads

@app.post("/v1/inbox/{thread_id}/messages")
def send_reply(thread_id: str, body: Dict[str, str], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM inbox_threads WHERE id = ? AND user_id = ?", (thread_id, user["id"]))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = json.loads(row["messages"])
    messages.append({
        "id": f"msg_{uuid.uuid4().hex[:6]}",
        "sender": "user",
        "body": body.get("text", ""),
        "timestamp": "Just now"
    })

    c.execute("UPDATE inbox_threads SET messages = ?, last_activity = 'Just now', unread = 0 WHERE id = ?", (json.dumps(messages), thread_id))
    conn.commit()
    conn.close()
    return {"success": True, "messages": messages}

@app.patch("/v1/inbox/{thread_id}/label")
def update_label(thread_id: str, body: Dict[str, str], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE inbox_threads SET label = ? WHERE id = ? AND user_id = ?", (body.get("label", "interested"), thread_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

# ----------------- Analytics -----------------
@app.get("/v1/analytics/funnel")
def get_funnel_stats(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM leads WHERE user_id = ?", (user["id"],))
    total_leads = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM leads WHERE user_id = ? AND status IN ('invited', 'connected', 'replied', 'meeting_booked')", (user["id"],))
    total_sent = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM leads WHERE user_id = ? AND status IN ('connected', 'replied', 'meeting_booked')", (user["id"],))
    total_accepted = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM leads WHERE user_id = ? AND status IN ('replied', 'meeting_booked')", (user["id"],))
    total_replied = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM leads WHERE user_id = ? AND status = 'meeting_booked'", (user["id"],))
    total_booked = c.fetchone()[0]

    conn.close()
    return {
        "total_leads": total_leads,
        "total_sent": total_sent,
        "total_accepted": total_accepted,
        "total_replied": total_replied,
        "total_booked": total_booked,
        "acceptance_rate": round((total_accepted / total_sent * 100), 1) if total_sent > 0 else 0,
        "reply_rate": round((total_replied / total_accepted * 100), 1) if total_accepted > 0 else 0
    }

# ----------------- Settings / DNC -----------------
@app.get("/v1/settings/dnc")
def list_dnc(user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM dnc_rules WHERE user_id = ? OR is_global = 1", (user["id"],))
    rules = [dict(r) for r in c.fetchall()]
    conn.close()
    return rules

@app.post("/v1/settings/dnc")
def add_dnc(body: Dict[str, str], user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    rule_id = f"dnc_{uuid.uuid4().hex[:8]}"
    now = time.strftime('%Y-%m-%d %H:%M:%S')
    c.execute("INSERT INTO dnc_rules (id, user_id, rule, is_global, created_at) VALUES (?, ?, ?, 0, ?)",
              (rule_id, user["id"], body.get("rule", "").strip(), now))
    conn.commit()
    conn.close()
    return {"id": rule_id, "rule": body.get("rule", "").strip()}

@app.delete("/v1/settings/dnc/{rule_id}")
def remove_dnc(rule_id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM dnc_rules WHERE id = ? AND user_id = ?", (rule_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

# ----------------- Admin Portal Endpoints (Role: admin) -----------------
@app.get("/v1/admin/users")
def admin_list_users(admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    c.execute('''
    SELECT u.*,
           (SELECT COUNT(*) FROM linkedin_accounts a WHERE a.user_id = u.id) as connected_accounts_count,
           (SELECT AVG(health_score) FROM linkedin_accounts a WHERE a.user_id = u.id) as avg_health
    FROM users u
    ORDER BY u.created_at DESC
    ''')
    users = [dict(r) for r in c.fetchall()]
    conn.close()
    return users

@app.patch("/v1/admin/users/{user_id}/status")
def admin_update_user_status(user_id: str, body: Dict[str, str], admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    status = body.get("status", "active")
    c.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "status": status}

@app.get("/v1/admin/fleet")
def admin_fleet_metrics(admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users WHERE status = 'active'")
    active_users = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM linkedin_accounts WHERE status = 'active'")
    active_accounts = c.fetchone()[0]

    c.execute("SELECT SUM(invites_today) FROM linkedin_accounts")
    global_invites_today = c.fetchone()[0] or 0

    c.execute("SELECT AVG(health_score) FROM linkedin_accounts")
    fleet_health = round(c.fetchone()[0] or 95, 1)

    c.execute("SELECT value FROM system_settings WHERE key = 'global_kill_switch'")
    row = c.fetchone()
    kill_switch = row[0] == 'true' if row else False

    conn.close()
    return {
        "active_users": active_users,
        "active_accounts": active_accounts,
        "global_invites_today": global_invites_today,
        "fleet_health": fleet_health,
        "kill_switch_active": kill_switch
    }

@app.post("/v1/admin/fleet/kill-switch")
def admin_toggle_kill_switch(body: Dict[str, bool], admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    val = "true" if body.get("active", False) else "false"
    c.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('global_kill_switch', ?)", (val,))
    conn.commit()
    conn.close()
    return {"kill_switch_active": val == "true"}

@app.get("/v1/admin/dnc")
def admin_list_global_dnc(admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM dnc_rules WHERE is_global = 1 ORDER BY created_at DESC")
    rules = [dict(r) for r in c.fetchall()]
    conn.close()
    return rules

@app.post("/v1/admin/dnc")
def admin_add_global_dnc(body: Dict[str, str], admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    rule_id = f"dnc_glob_{uuid.uuid4().hex[:8]}"
    now = time.strftime('%Y-%m-%d %H:%M:%S')
    c.execute("INSERT INTO dnc_rules (id, user_id, rule, is_global, created_at) VALUES (?, NULL, ?, 1, ?)",
              (rule_id, body.get("rule", "").strip(), now))
    conn.commit()
    conn.close()
    return {"id": rule_id, "rule": body.get("rule", "").strip()}

@app.delete("/v1/admin/dnc/{rule_id}")
def admin_delete_global_dnc(rule_id: str, admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM dnc_rules WHERE id = ? AND is_global = 1", (rule_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/v1/admin/audit-logs")
def admin_audit_logs(admin: dict = Depends(get_current_user)):
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50")
    logs = [dict(r) for r in c.fetchall()]
    conn.close()
    return logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
