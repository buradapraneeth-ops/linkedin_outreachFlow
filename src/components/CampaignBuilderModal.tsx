import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  Eye, 
  UserPlus, 
  MessageSquare, 
  Send, 
  Check, 
  Calendar,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  Users,
  Search,
  Upload,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Campaign, CampaignStep, StepType, LinkedInAccount, Lead } from '../types';
import { leadsApi } from '../services/api';

interface CampaignBuilderModalProps {
  campaign?: Campaign | null;
  accounts: LinkedInAccount[];
  onSave: (campaignData: Partial<Campaign> & { initial_leads?: any[] }) => void;
  onClose: () => void;
}

export const CampaignBuilderModal: React.FC<CampaignBuilderModalProps> = ({
  campaign,
  accounts,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(campaign?.name || 'New Enterprise Outreach Sequence');
  const [accountId, setAccountId] = useState<string>(campaign?.account_id || accounts[0]?.id || '');
  const [stopOnReply, setStopOnReply] = useState<boolean>(campaign ? campaign.stop_on_reply : true);
  const [timezone, setTimezone] = useState(campaign?.schedule?.timezone || 'America/New_York');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    campaign?.schedule?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [startHour, setStartHour] = useState<number>(campaign?.schedule?.startHour || 9);
  const [endHour, setEndHour] = useState<number>(campaign?.schedule?.endHour || 18);

  // ==========================================
  // ATTACH LEADS TO THIS CAMPAIGN (3 METHODS)
  // ==========================================
  const [initialLeadsList, setInitialLeadsList] = useState<any[]>([]);
  const [showAttachSection, setShowAttachSection] = useState(false);
  const [attachTab, setAttachTab] = useState<'csv' | 'search' | 'manual'>('csv');

  // Method 1: CSV Upload state
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvParsedCount, setCsvParsedCount] = useState<number>(0);

  // Method 2: Basic Search from database
  const [searchQuery, setSearchQuery] = useState('');
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [selectedDbLeadIds, setSelectedDbLeadIds] = useState<string[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Method 3: Manual Entry state
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Fetch database leads for Basic Search tab
  useEffect(() => {
    let active = true;
    const fetchDbLeads = async () => {
      setIsSearchingDb(true);
      try {
        const fetched = await leadsApi.list({ search: searchQuery });
        if (active) setDbLeads(fetched);
      } catch (err) {
        console.error('Error fetching leads for campaign builder:', err);
      } finally {
        if (active) setIsSearchingDb(false);
      }
    };

    const timer = setTimeout(fetchDbLeads, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Handle CSV file upload
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
      parseAndAddCsv(content);
    };
    reader.readAsText(file);
  };

  const parseAndAddCsv = (content: string) => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('org'));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('role'));
    const urlIdx = headers.findIndex(h => h.includes('linkedin') || h.includes('url'));
    const emailIdx = headers.findIndex(h => h.includes('email'));

    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
      if (row.length < 2) continue;
      const lead = {
        name: nameIdx !== -1 ? row[nameIdx] : row[0],
        company: companyIdx !== -1 ? row[companyIdx] : (row[1] || 'Company'),
        title: titleIdx !== -1 ? row[titleIdx] : 'Leader',
        linkedin_url: urlIdx !== -1 ? row[urlIdx] : `https://linkedin.com/in/prospect-${Date.now()}-${i}`,
        email: emailIdx !== -1 ? row[emailIdx] : undefined,
        source: 'csv_upload',
        status: 'new'
      };
      parsed.push(lead);
    }

    setCsvParsedCount(parsed.length);
    setInitialLeadsList(prev => [...prev, ...parsed]);
  };

  // Handle Basic Search selection
  const handleAttachSelectedFromSearch = () => {
    const chosen = dbLeads.filter(l => selectedDbLeadIds.includes(l.id));
    const toAdd = chosen.map(l => ({
      id: l.id,
      name: l.name,
      company: l.company,
      title: l.title,
      linkedin_url: l.linkedin_url || l.linkedinUrl,
      email: l.email,
      source: l.source || 'basic_search',
      status: l.status || 'new'
    }));

    setInitialLeadsList(prev => {
      const existingIds = new Set(prev.map(p => p.id || p.linkedin_url));
      const filtered = toAdd.filter(a => !existingIds.has(a.id || a.linkedin_url));
      return [...prev, ...filtered];
    });

    setSelectedDbLeadIds([]);
  };

  // Handle Manual Lead entry
  const handleAddManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!manualName.trim() || !manualCompany.trim() || !manualUrl.trim()) {
      setManualError('Please provide Name, Company, and LinkedIn URL.');
      return;
    }

    const newLead = {
      name: manualName.trim(),
      company: manualCompany.trim(),
      title: manualTitle.trim() || 'Leader',
      linkedin_url: manualUrl.trim(),
      email: manualEmail.trim() || undefined,
      source: 'manual',
      status: 'new'
    };

    setInitialLeadsList(prev => [newLead, ...prev]);
    setManualName('');
    setManualCompany('');
    setManualTitle('');
    setManualUrl('');
    setManualEmail('');
  };

  const handleRemoveLead = (index: number) => {
    setInitialLeadsList(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // STEPS CONFIGURATION
  // ==========================================
  const defaultInitialSteps: CampaignStep[] = campaign?.steps?.length ? campaign.steps : [
    {
      id: 'step_1',
      position: 1,
      type: 'view',
      title: 'Warm-up: View Profile',
      delay_hours: 0,
      condition_type: 'none',
      condition_desc: 'Immediate initial warm-up touch'
    },
    {
      id: 'step_2',
      position: 2,
      type: 'invite',
      title: 'Connection Request with AI Note',
      delay_hours: 4,
      condition_type: 'none',
      condition_desc: '4 hours after view',
      template_body: 'Hi {{first_name}}, came across your work leading engineering at {{company}}. {{recent_post_hook}} Would love to connect!',
      variant_b_body: 'Hi {{first_name}} — noticed your work at {{company}}. Always keen to follow peers scaling resilient tech teams. Let\'s connect!'
    },
    {
      id: 'step_3',
      position: 3,
      type: 'message',
      title: 'Step 1: First Value Message',
      delay_hours: 24,
      condition_type: 'if_accepted',
      condition_desc: 'Wait 24h after connection accepted',
      template_body: 'Thanks for connecting, {{first_name}}! Given your team\'s focus at {{company}}, I put together a quick 3-page teardown on eliminating pipeline bottlenecks. Would you be open to a quick peek?'
    },
    {
      id: 'step_4',
      position: 4,
      type: 'follow_up',
      title: 'Step 2: Gentle Follow-up Bump',
      delay_hours: 72,
      condition_type: 'if_no_reply',
      condition_desc: 'If no reply after 3 days',
      template_body: 'Hey {{first_name}}, know you are super busy with Q4 sprints. Just floating this back up in case helpful for your roadmap. Either way, great having you in my network!'
    }
  ];

  const [steps, setSteps] = useState<CampaignStep[]>(defaultInitialSteps);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddStep = (type: StepType) => {
    const newPosition = steps.length + 1;
    let title = 'Follow-up';
    let delay = 24;

    if (type === 'view') {
      title = 'Profile View';
      delay = 0;
    } else if (type === 'invite') {
      title = 'Connection Request';
      delay = 4;
    } else if (type === 'message') {
      title = 'Value Message';
      delay = 24;
    } else if (type === 'follow_up') {
      title = 'Bump / Follow-up';
      delay = 72;
    }

    const newStep: CampaignStep = {
      id: `step_${Date.now()}`,
      position: newPosition,
      type,
      title: `Step ${newPosition}: ${title}`,
      delay_hours: delay,
      template_body: type !== 'view' ? 'Hi {{first_name}}, following up regarding {{company}}...' : undefined
    };

    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    if (steps.length <= 1) return;
    const remaining = steps.filter(s => s.id !== id);
    const reindexed = remaining.map((s, idx) => ({ ...s, position: idx + 1 }));
    setSteps(reindexed);
  };

  const handleUpdateStepTemplate = (id: string, text: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, template_body: text } : s));
  };

  const handleUpdateStepDelay = (id: string, hours: number) => {
    setSteps(steps.map(s => s.id === id ? { ...s, delay_hours: hours } : s));
  };

  const handleSave = () => {
    const selectedAccount = accounts.find(a => a.id === accountId);
    onSave({
      name,
      account_id: accountId,
      account_name: selectedAccount?.name,
      stop_on_reply: stopOnReply,
      schedule: {
        days: selectedDays,
        startHour,
        endHour,
        timezone
      },
      steps,
      initial_leads: initialLeadsList
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-white">
              {campaign ? 'Edit Campaign Sequence' : 'Create New Campaign Sequence'}
            </h3>
            <p className="text-xs text-slate-400">
              Configure sending account, attach prospects, and design your cadence steps.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* General Settings (Goal Category Completely Removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Campaign Name *
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enterprise VPs of Engineering"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* LinkedIn Account Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn Sending Account *</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {accounts.map(acct => (
                  <option key={acct.id} value={acct.id}>
                    {acct.name} ({acct.invites_today}/{acct.daily_cap} used today)
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* ==================================================== */}
          {/* ATTACH LEADS TO THIS CAMPAIGN (3 METHODS) */}
          {/* ==================================================== */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Attach Leads to This Campaign ({initialLeadsList.length} Attached)</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attach prospects to launch this sequence immediately using CSV upload, search, or manual input.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAttachSection(!showAttachSection)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAttachSection ? 'Close Ingestion' : '+ Attach Prospects'}</span>
              </button>
            </div>

            {/* Attached Leads Chips Preview */}
            {initialLeadsList.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Prospects queued for sequence ({initialLeadsList.length}):</span>
                  <button
                    type="button"
                    onClick={() => setInitialLeadsList([])}
                    className="text-red-400 hover:text-red-300 text-[10px]"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                  {initialLeadsList.map((lead, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-800 text-slate-200 border border-slate-700 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-white">{lead.name}</span>
                      <span className="text-slate-400">· {lead.company}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLead(idx)}
                        className="text-slate-400 hover:text-red-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingestion Drawer with 3 Methods */}
            {showAttachSection && (
              <div className="pt-3 border-t border-slate-700/80 space-y-4 animate-fadeIn">
                
                {/* 3 Method Switcher Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setAttachTab('csv')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      attachTab === 'csv'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>1. CSV Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachTab('search')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      attachTab === 'search'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>2. Basic Search (Database)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachTab('manual')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      attachTab === 'manual'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>3. Manual Entry</span>
                  </button>
                </div>

                {/* TAB 1: CSV Upload */}
                {attachTab === 'csv' && (
                  <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Upload CSV or Paste Raw Records</span>
                      {csvFileName && (
                        <span className="text-emerald-400 font-mono text-[11px]">
                          ✓ {csvFileName} ({csvParsedCount} parsed)
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium transition">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>Browse .csv file</span>
                        <input 
                          type="file" 
                          accept=".csv,text/csv" 
                          onChange={handleCsvFile}
                          className="hidden" 
                        />
                      </label>
                      <span className="text-slate-500 text-[11px]">or paste below:</span>
                    </div>

                    <textarea
                      rows={3}
                      value={csvRawText}
                      onChange={(e) => {
                        setCsvRawText(e.target.value);
                        parseAndAddCsv(e.target.value);
                      }}
                      placeholder="Name,Company,Title,LinkedIn URL&#10;Maya Lin,CloudMatrix,VP Eng,https://linkedin.com/in/maya-lin"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* TAB 2: Basic Search from Database */}
                {attachTab === 'search' && (
                  <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search existing leads by name, company, or job title..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {isSearchingDb && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-400">
                          Searching...
                        </span>
                      )}
                    </div>

                    <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/80 bg-slate-950">
                      {dbLeads.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-[11px]">
                          No database leads match "{searchQuery}".
                        </div>
                      ) : (
                        dbLeads.map(lead => {
                          const isChecked = selectedDbLeadIds.includes(lead.id);
                          return (
                            <div 
                              key={lead.id}
                              onClick={() => {
                                setSelectedDbLeadIds(prev => 
                                  prev.includes(lead.id) ? prev.filter(x => x !== lead.id) : [...prev, lead.id]
                                );
                              }}
                              className={`p-2 flex items-center justify-between cursor-pointer transition ${
                                isChecked ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <span className="font-semibold text-white">{lead.name}</span>
                                <span className="text-slate-400">· {lead.title} @ {lead.company}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 capitalize">{lead.source?.replace('_', ' ') || 'direct'}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {selectedDbLeadIds.length > 0 && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAttachSelectedFromSearch}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Attach {selectedDbLeadIds.length} Selected Leads</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Manual Entry */}
                {attachTab === 'manual' && (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                    {manualError && (
                      <div className="text-red-400 text-[11px] bg-red-500/10 p-2 rounded border border-red-500/20">
                        {manualError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Prospect Full Name *"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                      <input
                        type="text"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                        placeholder="Company Name *"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Job Title"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                      />
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="LinkedIn Profile URL *"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddManualLead}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Prospect to Sequence</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Schedule & Working Hours */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Sending Schedule & Working Window</span>
              </span>
              <span className="text-[11px] text-slate-500">Local Time: {timezone}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {daysOfWeek.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-xs text-slate-400">
              <div>
                <span>Start Time: {startHour}:00</span>
                <input
                  type="range"
                  min={6}
                  max={12}
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full accent-blue-500 mt-1"
                />
              </div>
              <div>
                <span>End Time: {endHour}:00</span>
                <input
                  type="range"
                  min={14}
                  max={22}
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full accent-blue-500 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Sequence Steps Workflow */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Sequence Touchpoints</h4>
                <p className="text-xs text-slate-400">
                  Timed pacing between touches with human-like randomized sleep
                </p>
              </div>

              {/* Add Step Dropdown / Actions */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleAddStep('view')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-medium transition"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('invite')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-medium transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('message')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-medium transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>+ Message</span>
                </button>
              </div>
            </div>

            {/* Steps Timeline Card Stack */}
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white text-xs">{step.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Wait:</span>
                        <input
                          type="number"
                          value={step.delay_hours}
                          onChange={(e) => handleUpdateStepDelay(step.id, Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-white"
                        />
                        <span>hours</span>
                      </div>

                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(step.id)}
                          className="text-slate-500 hover:text-red-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {step.type !== 'view' && (
                    <div className="space-y-1 text-xs">
                      <label className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Message Template (Variables: {'{{first_name}}'}, {'{{company}}'})</span>
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Personalized Note</span>
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={step.template_body || ''}
                        onChange={(e) => handleUpdateStepTemplate(step.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Circuit Breaker & Safety */}
          <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 text-xs">
            <div>
              <div className="font-semibold text-white">Stop Sequence on Reply</div>
              <p className="text-slate-400 text-[11px]">
                Immediately halts further automated follow-ups once the prospect responds.
              </p>
            </div>
            <input 
              type="checkbox"
              checked={stopOnReply}
              onChange={(e) => setStopOnReply(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            <span>{campaign ? 'Save Sequence' : 'Create & Launch Campaign'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
