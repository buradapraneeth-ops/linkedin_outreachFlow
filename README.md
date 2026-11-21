# OutreachFlow · LinkedIn Outreach Platform

A production-grade, responsive web platform developed for personalized, safe LinkedIn outreach at scale, based on the **LinkedIn Outreach Platform: Product and Technical Plan** (Prepared for Praneeth · November 2026).

---

## 🚀 Key Features

### 1. Multi-Source Lead Ingestion & Consolidated CRM
- **Manual Input:** Add leads directly through structured form fields (Name, Job Title, Company, LinkedIn URL, Email, Location, Campaign, Tags, Notes, and custom Personalization Hook).
- **LinkedIn Sales Navigator Import:** Sync search/list URLs or use 1-click preset search queries (e.g. *VPs of Engineering in US*, *AI/ML Founders*). Extracts verified connection degrees (2nd, 3rd+), mutual connections, and recent activity.
- **CSV Bulk Upload:** Drag-and-drop or upload `.csv` files. Includes automatic column mapping, a sample CSV template generator, duplicate detection against existing leads, and Do-Not-Contact blacklist filtering.
- **Consolidated Pipeline:** All three sources merge into a single lead management system with source badges (`Manual Input`, `Sales Nav`, `CSV Upload`), source filtering, status filters, and search.

### 2. Customer & Admin Authentication System
- **Role-Based Access Control (RBAC):**
  - **Customer Role:** Manage personal LinkedIn campaigns, import leads, approve AI drafts in the Message Studio, chat in the Unified Inbox, monitor quota gauges, and track analytics.
  - **Admin Role:** Access the **Super Admin Portal** with fleet-wide control:
    - **Multi-Tenant User Management:** View all registered organizations and customer accounts, inspect pipelines, and toggle user account statuses (Active / Suspended).
    - **Fleet-Wide Safety & Kill Switch:** Global kill switch across all worker dispatchers and extension sync sessions.
    - **Global DNC Registry:** System-wide blacklist enforced across every customer account.
    - **Infrastructure & Node Monitor:** Live health of Celery worker queues, extension WebSocket bridge, and rate limit telemetry.
- **1-Click Quick Demo Sign-In:** Instant sign-in buttons for **Praneeth Burada (Customer)** and **Alex Vance (Super Admin)**, plus a live header role switcher for testing.

### 3. Account Safety Engine & Live Pacing (Sections 2 & 7)
- **Account Health Score (0–100):** Real-time health monitoring with green/amber/red indicators based on invite acceptance, zero warnings, and clean activity.
- **Pacing Caps:** Daily (20/day) and rolling 7-day safe ceilings (100/week) with dynamic progress bars.
- **Warm-Up Mode:** Automatic ramp-up (5 -> 10 -> 15 -> 20) over 14 days for new/reactivated accounts.
- **Anti-Bot Jitter:** Random spacing slider (45s–180s) between actions.
- **Trip Wire Protection:** Immediate 72-hour auto-pause if acceptance rate dips below 15% or CAPTCHA is detected.
- **Global Emergency Kill Switch:** Instant 1-click "Pause All" banner and sequence freeze.

### 4. Multi-Step Campaign Sequence Builder (Sections 4.5 & 4.6)
- **Visual Sequence Builder:** Configure multi-step cadences (Profile View -> Connection Request with AI Note -> Wait 24-72h -> First Message -> Follow-up).
- **Conditions & Triggers:** Wait for connection accepted, stop on reply, and wait timers.
- **Scheduler:** Send only during working hours (9 AM - 6 PM) in the prospect's local timezone.
- **Must-Have Rule:** "Stop sequence on reply" toggle.

### 5. AI Message Studio & Human Approval Gate (Section 4.7)
- **Human Approval Review Queue:** Real-time queue counter with 1-click **Approve & Dispatch**, **Edit Draft**, or **Reject & Skip**.
- **Dynamic Variables:** `{{first_name}}`, `{{company}}`, `{{title}}`, `{{recent_post_hook}}`, `{{mutual_count}}`.
- **Character Counter with LinkedIn 300-Char Limit Warning:** Live character countdown preventing oversized connection request notes.
- **Tone Presets:** Value-First, Direct & Short, Casual Founder, and Peer Thoughtful.
- **A/B Variant Split Testing:** Real-time conversion tracking between Variant A and Variant B.

### 6. Unified Smart Inbox (Section 4.8)
- **Filtered Conversation Views:** `All`, `Interested (🔥)`, `Not Now (⏳)`, `Wrong Person (🚫)`.
- **AI Suggested Replies:** 1-click insert smart reply suggestions to quickly respond and book meetings.
- **Snooze Reminders:** Snooze conversations for 3 days or set follow-ups.

### 7. Conversion Analytics & Send Times Heatmap (Section 4.9)
- **Full Conversion Funnel:** Total Leads -> Invites Sent -> Accepted (38.2%) -> Replied (40%) -> Meetings Booked (24%).
- **Best Send Times Heatmap:** Hour-by-hour matrix indicating peak engagement probability.
- **Campaign Comparison:** Side-by-side metric bars and CSV data export.

### 8. Interactive Safety Gate Simulator (Section 7)
- An interactive debugger directly implementing the Python safety gate logic:
  ```python
  def gate(action, acct):
      if acct.status != "active" or acct.health < 60:
          return block("account")
      if weekly_sent(acct) >= acct.weekly_cap or daily_sent(acct) >= acct.daily_cap:
          return reschedule(next_window(acct))
      if not in_window(action.lead_tz, action.campaign.schedule):
          return reschedule(next_open_slot(action))
      if is_dnc(action.lead) or already_contacted(action):
          return skip()
      if action.needs_approval and action.status != "approved":
          return hold()
      return send_after(random_delay(45, 180))
  ```

---

## 💻 Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS with custom dark SaaS palette
- **Icons:** Lucide React

---

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:3000)
npm run dev

# Run production build
npm run build
```
