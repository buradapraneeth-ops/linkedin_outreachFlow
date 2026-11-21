import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  MapPin, 
  Link, 
  Mail, 
  Tag, 
  Check, 
  Download,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Users
} from 'lucide-react';
import { Lead, Campaign } from '../types';
import { leadsApi } from '../services/api';

export type LeadAttachMethod = 'csv_upload' | 'basic_search' | 'manual';

interface MultiSourceLeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  existingLeads: Lead[];
  targetCampaignId?: string;
  onAddLeads: (leads: Lead[]) => void;
}

export const MultiSourceLeadImportModal: React.FC<MultiSourceLeadImportModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  existingLeads,
  targetCampaignId,
  onAddLeads
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<LeadAttachMethod>('csv_upload');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    targetCampaignId || campaigns[0]?.id || ''
  );

  useEffect(() => {
    if (targetCampaignId) {
      setSelectedCampaignId(targetCampaignId);
    } else if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [targetCampaignId, campaigns]);

  const targetCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  // ==========================================
  // 1. CSV UPLOAD STATE & LOGIC
  // ==========================================
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvSummary, setCsvSummary] = useState<{
    total: number;
    validLeads: Lead[];
    duplicates: number;
    blacklisted: number;
  } | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  // ==========================================
  // 2. BASIC SEARCH STATE & LOGIC (DATABASE SEARCH)
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'unassigned' | 'in_other_campaigns'>('all');
  const [searchResults, setSearchResults] = useState<Lead[]>(existingLeads);
  const [selectedSearchLeadIds, setSelectedSearchLeadIds] = useState<string[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Sync / query database on search change
  useEffect(() => {
    let isCancelled = false;
    const executeSearch = async () => {
      setIsSearchingDb(true);
      try {
        const fetched = await leadsApi.list({ search: searchQuery.trim() });
        if (!isCancelled) {
          setSearchResults(fetched);
        }
      } catch (err) {
        // Fallback to local filter
        if (!isCancelled) {
          const q = searchQuery.toLowerCase();
          const filtered = existingLeads.filter(l => 
            l.name.toLowerCase().includes(q) ||
            l.company.toLowerCase().includes(q) ||
            l.title.toLowerCase().includes(q) ||
            (l.email && l.email.toLowerCase().includes(q))
          );
          setSearchResults(filtered);
        }
      } finally {
        if (!isCancelled) setIsSearchingDb(false);
      }
    };

    const timer = setTimeout(executeSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, existingLeads]);

  // Filtered search list based on assignment filter
  const filteredSearchLeads = useMemo(() => {
    return searchResults.filter(lead => {
      const isAlreadyInThisCampaign = lead.campaign_id === selectedCampaignId || lead.campaignId === selectedCampaignId;
      if (assignmentFilter === 'unassigned') {
        return !lead.campaign_id && !lead.campaignId;
      }
      if (assignmentFilter === 'in_other_campaigns') {
        return (lead.campaign_id || lead.campaignId) && !isAlreadyInThisCampaign;
      }
      return true;
    });
  }, [searchResults, assignmentFilter, selectedCampaignId]);

  const toggleSelectSearchLead = (id: string) => {
    setSelectedSearchLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSearch = () => {
    if (selectedSearchLeadIds.length === filteredSearchLeads.length) {
      setSelectedSearchLeadIds([]);
    } else {
      setSelectedSearchLeadIds(filteredSearchLeads.map(l => l.id));
    }
  };

  const handleAttachSelectedSearchLeads = () => {
    if (selectedSearchLeadIds.length === 0) return;
    const leadsToAttach = searchResults
      .filter(l => selectedSearchLeadIds.includes(l.id))
      .map(l => ({
        ...l,
        campaign_id: selectedCampaignId,
        campaignId: selectedCampaignId,
        campaign_name: targetCampaign?.name,
        campaignName: targetCampaign?.name
      }));

    onAddLeads(leadsToAttach);
    setSelectedSearchLeadIds([]);
    onClose();
  };

  // ==========================================
  // 3. MANUAL ENTRY STATE & LOGIC
  // ==========================================
  const [manualName, setManualName] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualLinkedinUrl, setManualLinkedinUrl] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualLocation, setManualLocation] = useState('San Francisco, CA');
  const [manualTags, setManualTags] = useState('Manual Entry, VIP');
  const [manualHook, setManualHook] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ---------------- Handlers for Manual Entry ----------------
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualName.trim() || !manualCompany.trim() || !manualLinkedinUrl.trim()) {
      setManualError('Please provide at least Name, Company, and LinkedIn Profile URL.');
      return;
    }

    const cleanUrl = manualLinkedinUrl.trim().toLowerCase();
    const isDuplicate = existingLeads.some(l => (l.linkedinUrl || l.linkedin_url || '').toLowerCase() === cleanUrl);
    if (isDuplicate) {
      setManualError('This LinkedIn profile already exists in your database.');
      return;
    }

    const blacklistedDomains = ['competitor-corp.com', 'internal-talent.company.com', 'restricted-firm.io'];
    if (blacklistedDomains.some(d => cleanUrl.includes(d))) {
      setManualError('This profile matches an active Do-Not-Contact blacklist rule.');
      return;
    }

    const newLead: Lead = {
      id: `lead_man_${Date.now()}`,
      name: manualName.trim(),
      title: manualTitle.trim() || 'Executive Leader',
      company: manualCompany.trim(),
      location: manualLocation.trim() || 'United States',
      linkedin_url: manualLinkedinUrl.trim(),
      linkedinUrl: manualLinkedinUrl.trim(),
      email: manualEmail.trim() || undefined,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'new',
      source: 'manual',
      campaign_id: selectedCampaignId,
      campaignId: selectedCampaignId,
      campaign_name: targetCampaign?.name,
      campaignName: targetCampaign?.name,
      tags: manualTags.split(',').map(t => t.trim()).filter(Boolean),
      enrichment: {
        recentPostSnippet: manualNotes || '',
        mutualConnections: 6,
        companyHeadcount: '50-250',
        industry: 'Technology',
        personalizedHook: manualHook.trim() || `Noticed your leadership at ${manualCompany.trim()}.`
      },
      timeline: [
        {
          id: `t_${Date.now()}`,
          date: 'Just now',
          type: 'profile_viewed',
          note: `Manually added & assigned to campaign: "${targetCampaign?.name}".`
        }
      ],
      notes: manualNotes.trim(),
      lead_score: 90,
      leadScore: 90,
      created_at: new Date().toISOString()
    };

    onAddLeads([newLead]);
    onClose();
  };

  // ---------------- Handlers for CSV Upload ----------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
      parseCsvData(content);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (rawText: string) => {
    setIsProcessingCsv(true);
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setCsvSummary(null);
      setIsProcessingCsv(false);
      return;
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    const nameIdx = headers.findIndex(h => h.includes('name'));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('role') || h.includes('job'));
    const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('org'));
    const urlIdx = headers.findIndex(h => h.includes('linkedin') || h.includes('url') || h.includes('profile'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const locIdx = headers.findIndex(h => h.includes('loc') || h.includes('city') || h.includes('country'));
    const tagsIdx = headers.findIndex(h => h.includes('tag'));

    const existingUrls = new Set(existingLeads.map(l => (l.linkedinUrl || l.linkedin_url || '').toLowerCase()));
    const blacklistedDomains = ['competitor-corp.com', 'internal-talent.company.com', 'restricted-firm.io'];

    let dupCount = 0;
    let blackCount = 0;
    const parsedValidLeads: Lead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
      if (row.length < 2) continue;

      const name = nameIdx !== -1 ? row[nameIdx] : row[0];
      const company = companyIdx !== -1 ? row[companyIdx] : (row[1] || 'Enterprise');
      const title = titleIdx !== -1 ? row[titleIdx] : 'Leader';
      const url = urlIdx !== -1 ? row[urlIdx] : `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`;
      const email = emailIdx !== -1 ? row[emailIdx] : undefined;
      const location = locIdx !== -1 ? row[locIdx] : 'United States';
      const customTag = tagsIdx !== -1 ? row[tagsIdx] : 'CSV Upload';

      const cleanUrl = url.toLowerCase();

      // Check Duplicates
      if (existingUrls.has(cleanUrl)) {
        dupCount++;
        continue;
      }

      // Check Blacklist
      if (blacklistedDomains.some(d => cleanUrl.includes(d))) {
        blackCount++;
        continue;
      }

      existingUrls.add(cleanUrl);

      parsedValidLeads.push({
        id: `lead_csv_${Date.now()}_${i}`,
        name: name || 'Prospect',
        title: title || 'Executive',
        company: company || 'Enterprise',
        location: location || 'United States',
        linkedin_url: url,
        linkedinUrl: url,
        email: email || undefined,
        avatar: `https://images.unsplash.com/photo-${1530000000000 + (i * 12345) % 99999999}?w=150&auto=format&fit=crop&q=80`,
        status: 'new',
        source: 'csv_upload',
        campaign_id: selectedCampaignId,
        campaignId: selectedCampaignId,
        campaign_name: targetCampaign?.name,
        campaignName: targetCampaign?.name,
        tags: ['CSV Import', customTag],
        enrichment: {
          recentPostSnippet: `Imported via bulk CSV for campaign: ${targetCampaign?.name}`,
          mutualConnections: 5,
          companyHeadcount: '100+',
          industry: 'Technology',
          personalizedHook: `Noticed your initiatives leading ${title} at ${company}.`
        },
        timeline: [
          {
            id: `t_${Date.now()}_${i}`,
            date: 'Just now',
            type: 'profile_viewed',
            note: `Bulk imported from CSV into campaign "${targetCampaign?.name}".`
          }
        ],
        lead_score: 88,
        leadScore: 88,
        created_at: new Date().toISOString()
      });
    }

    setCsvSummary({
      total: lines.length - 1,
      validLeads: parsedValidLeads,
      duplicates: dupCount,
      blacklisted: blackCount
    });

    setIsProcessingCsv(false);
  };

  const handleApplyCsvImport = () => {
    if (!csvSummary || csvSummary.validLeads.length === 0) return;
    onAddLeads(csvSummary.validLeads);
    onClose();
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Full Name,Company,Job Title,LinkedIn URL,Email,Location,Tags\n' +
      'Maya Lin,CloudMatrix Systems,VP of Engineering,https://linkedin.com/in/maya-lin-eng,maya@cloudmatrix.com,San Francisco CA,Enterprise VP\n' +
      'David Chen,ScaleFlow AI,Chief Technology Officer,https://linkedin.com/in/david-chen-cto,david@scaleflow.io,New York NY,Series B CTO\n' +
      'Sarah Sterling,Apex Data Labs,Director of Infrastructure,https://linkedin.com/in/sarah-sterling-infra,sarah@apexdata.com,Austin TX,Infra Leader\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'outreachflow_leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <span>Attach Leads to Campaign</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Campaign:{' '}
              <span className="text-blue-400 font-semibold">{targetCampaign?.name || 'Selected Campaign'}</span>
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Scope Bar */}
        <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Assigning to Campaign:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-blue-500"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">Consolidated Database Sync Active</span>
        </div>

        {/* Three Method Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-5 pt-3 gap-2 text-xs font-semibold">
          
          {/* Method 1: CSV Upload */}
          <button
            onClick={() => setActiveSourceTab('csv_upload')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeSourceTab === 'csv_upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. CSV Upload</span>
          </button>

          {/* Method 2: Basic Search */}
          <button
            onClick={() => setActiveSourceTab('basic_search')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeSourceTab === 'basic_search'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>2. Basic Search (Database)</span>
          </button>

          {/* Method 3: Manual Entry */}
          <button
            onClick={() => setActiveSourceTab('manual')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeSourceTab === 'manual'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>3. Manual Entry</span>
          </button>

        </div>

        {/* Modal Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ==================================================== */}
          {/* METHOD 1: CSV UPLOAD */}
          {/* ==================================================== */}
          {activeSourceTab === 'csv_upload' && (
            <div className="space-y-5 animate-fadeIn">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload CSV Lead List</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Columns recognized: Full Name, Company, Job Title, LinkedIn URL, Email, Location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Drag and Drop Box */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 text-center space-y-3 transition bg-slate-900/50">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-400 rounded-2xl mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <label className="cursor-pointer font-bold text-sm text-blue-400 hover:text-blue-300">
                    <span>Click to browse CSV file</span>
                    <input 
                      type="file" 
                      accept=".csv,text/csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">or paste raw CSV text below</p>
                </div>
                {csvFileName && (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded: {csvFileName}</span>
                  </div>
                )}
              </div>

              {/* Paste Text Option */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Direct CSV Paste:</span>
                  <span className="text-[11px] text-slate-500">Comma-separated with header row</span>
                </label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={(e) => {
                    setCsvRawText(e.target.value);
                    parseCsvData(e.target.value);
                  }}
                  placeholder="Full Name,Company,Job Title,LinkedIn URL,Email&#10;Maya Lin,CloudMatrix,VP Engineering,https://linkedin.com/in/maya-lin,maya@cloudmatrix.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary Stats Card */}
              {csvSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <div className="text-slate-400">Total Rows</div>
                      <div className="text-lg font-bold text-white mt-0.5">{csvSummary.total}</div>
                    </div>
                    <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">
                      <div className="text-emerald-400 font-semibold">Valid Leads</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">{csvSummary.validLeads.length}</div>
                    </div>
                    <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
                      <div className="text-amber-400 font-semibold">Duplicates Ignored</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">{csvSummary.duplicates}</div>
                    </div>
                    <div className="bg-red-950/20 p-3 rounded-xl border border-red-500/30">
                      <div className="text-red-400 font-semibold">Blacklist Excluded</div>
                      <div className="text-lg font-bold text-red-400 mt-0.5">{csvSummary.blacklisted}</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  {csvSummary.validLeads.length > 0 && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-800/80 px-4 py-2 text-xs font-bold text-white flex justify-between items-center">
                        <span>Preview Leads to Attach ({csvSummary.validLeads.length})</span>
                        <span className="text-slate-400 font-normal">First 5 shown</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-2.5">Name</th>
                              <th className="p-2.5">Company</th>
                              <th className="p-2.5">Title</th>
                              <th className="p-2.5">LinkedIn Profile</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {csvSummary.validLeads.slice(0, 5).map((l, i) => (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="p-2.5 font-bold text-white">{l.name}</td>
                                <td className="p-2.5 text-slate-300">{l.company}</td>
                                <td className="p-2.5 text-slate-300">{l.title}</td>
                                <td className="p-2.5 text-blue-400 font-mono text-[11px] truncate max-w-[200px]">
                                  {l.linkedin_url || l.linkedinUrl}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={csvSummary.validLeads.length === 0}
                      onClick={handleApplyCsvImport}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Attach {csvSummary.validLeads.length} Leads to Campaign</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* METHOD 2: BASIC SEARCH (DATABASE SEARCH & ATTACH) */}
          {/* ==================================================== */}
          {activeSourceTab === 'basic_search' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span>Search Database Leads to Attach</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search leads from your central database, select prospects, and assign them directly to this sequence.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by prospect name, company, title, email, or tag..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {isSearchingDb && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 font-mono">
                      Searching...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={assignmentFilter}
                    onChange={(e) => setAssignmentFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Database Prospects</option>
                    <option value="unassigned">Unassigned Leads Only</option>
                    <option value="in_other_campaigns">In Other Campaigns</option>
                  </select>
                </div>
              </div>

              {/* Database Lead Selection Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="bg-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-700 font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={filteredSearchLeads.length > 0 && selectedSearchLeadIds.length === filteredSearchLeads.length}
                      onChange={toggleSelectAllSearch}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Select All ({filteredSearchLeads.length} Prospects Available)</span>
                  </div>
                  {selectedSearchLeadIds.length > 0 && (
                    <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {selectedSearchLeadIds.length} Selected
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/70">
                  {filteredSearchLeads.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No matching leads found in the database.
                    </div>
                  ) : (
                    filteredSearchLeads.map((lead) => {
                      const isSelected = selectedSearchLeadIds.includes(lead.id);
                      const isCurrentCamp = lead.campaign_id === selectedCampaignId || lead.campaignId === selectedCampaignId;

                      return (
                        <div 
                          key={lead.id}
                          onClick={() => toggleSelectSearchLead(lead.id)}
                          className={`p-3 flex items-center justify-between text-xs cursor-pointer transition ${
                            isSelected 
                              ? 'bg-blue-600/10 hover:bg-blue-600/15' 
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled by row click
                              className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <img 
                              src={lead.avatar} 
                              alt={lead.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{lead.name}</span>
                                {isCurrentCamp && (
                                  <span className="text-[10px] font-normal bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                                    Already in this campaign
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {lead.title} · <span className="text-slate-300 font-medium">{lead.company}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              lead.campaign_id || lead.campaignId
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {lead.campaign_name || lead.campaignName || 'Unassigned'}
                            </span>
                            <span className="text-slate-500 text-[11px] capitalize">
                              {lead.source?.replace('_', ' ') || 'direct'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {selectedSearchLeadIds.length} prospects selected to attach
                </span>
                <button
                  type="button"
                  disabled={selectedSearchLeadIds.length === 0}
                  onClick={handleAttachSelectedSearchLeads}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach {selectedSearchLeadIds.length} Selected Leads to Campaign</span>
                </button>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* METHOD 3: MANUAL ENTRY */}
          {/* ==================================================== */}
          {activeSourceTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 animate-fadeIn">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Manual Lead Entry</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directly input prospect details and attach them to "{targetCampaign?.name}".
                </p>
              </div>

              {manualError && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    placeholder="e.g. CloudMatrix Systems"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Job Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. VP of Machine Learning"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">LinkedIn Profile URL *</label>
                  <input
                    type="url"
                    required
                    value={manualLinkedinUrl}
                    onChange={(e) => setManualLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/prospect-slug"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Work Email (Optional)</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="prospect@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Location</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">Personalized Hook / Icebreaker</label>
                  <input
                    type="text"
                    value={manualHook}
                    onChange={(e) => setManualHook(e.target.value)}
                    placeholder="e.g. Loved your recent post on low-latency inference benchmarks."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach Lead Directly to Campaign</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-5 py-2 rounded-xl transition"
          >
            Cancel & Close
          </button>
        </div>

      </div>
    </div>
  );
};
