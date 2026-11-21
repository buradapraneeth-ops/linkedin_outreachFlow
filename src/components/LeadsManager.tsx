import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  Plus, 
  Download, 
  Trash2, 
  Tag, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  UserPlus,
  Compass,
  FileSpreadsheet,
  Mail,
  MapPin,
  Building2
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Campaign } from '../types';
import { LeadProfileModal } from './LeadProfileModal';
import { MultiSourceLeadImportModal } from './MultiSourceLeadImportModal';

interface LeadsManagerProps {
  leads: Lead[];
  campaigns: Campaign[];
  onAddLeads: (newLeads: Lead[]) => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  onUpdateLeadNotes: (leadId: string, notes: string) => void;
  onBulkAssignCampaign: (leadIds: string[], campaignId: string) => void;
  onBulkDelete: (leadIds: string[]) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({
  leads,
  campaigns,
  onAddLeads,
  onUpdateLeadStatus,
  onUpdateLeadNotes,
  onBulkAssignCampaign,
  onBulkDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeLeadForModal, setActiveLeadForModal] = useState<Lead | null>(null);
  const [showMultiSourceModal, setShowMultiSourceModal] = useState(false);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lead.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const statusColors: Record<LeadStatus, { label: string; bg: string; text: string }> = {
    new: { label: 'New', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
    invited: { label: 'Invited', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    connected: { label: 'Connected', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    replied: { label: 'Replied', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
    meeting_booked: { label: 'Booked', bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400' },
    blacklisted: { label: 'DNC Blacklist', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' }
  };

  const sourceBadges: Record<LeadSource, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
    manual: {
      label: 'Manual Input',
      icon: <UserPlus className="w-3 h-3" />,
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-400'
    },
    sales_navigator: {
      label: 'Sales Nav',
      icon: <Compass className="w-3 h-3" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400'
    },
    csv_upload: {
      label: 'CSV Upload',
      icon: <FileSpreadsheet className="w-3 h-3" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400'
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Consolidated Lead Pipeline</h1>
          <p className="text-xs text-slate-400">
            {leads.length} total prospects across Manual Input, Sales Navigator, and CSV uploads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMultiSourceModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Import Leads</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, title, company, email, or tags..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] text-slate-500 mr-1 font-medium hidden sm:inline">Source:</span>
            {[
              { id: 'all', label: `All (${leads.length})` },
              { id: 'manual', label: 'Manual' },
              { id: 'sales_navigator', label: 'Sales Nav' },
              { id: 'csv_upload', label: 'CSV' }
            ].map(sourceTab => (
              <button
                key={sourceTab.id}
                onClick={() => setSourceFilter(sourceTab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  sourceFilter === sourceTab.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sourceTab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 scrollbar-none text-xs">
          <span className="text-[11px] text-slate-500 mr-1 font-medium hidden sm:inline">Status:</span>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'new', label: 'New' },
            { id: 'invited', label: 'Invited' },
            { id: 'connected', label: 'Connected' },
            { id: 'replied', label: 'Replied' },
            { id: 'meeting_booked', label: 'Meeting Booked' },
            { id: 'blacklisted', label: 'Blacklisted (DNC)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Bulk Action Bar (when leads selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3 animate-fadeIn text-xs">
          <span className="font-semibold text-blue-300">
            {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            
            {/* Assign to Campaign */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkAssignCampaign(selectedLeadIds, e.target.value);
                  setSelectedLeadIds([]);
                }
              }}
              defaultValue=""
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>Add to Campaign...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                onBulkDelete(selectedLeadIds);
                setSelectedLeadIds([]);
              }}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Consolidated Leads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">Prospect</th>
                <th className="py-3 px-2">Source</th>
                <th className="py-3 px-2">Role & Company</th>
                <th className="py-3 px-2">Campaign</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Personalization Hook</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No leads found matching your filters. Click "Add / Import Leads" to add leads via Manual Input, Sales Navigator, or CSV.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const statusStyle = statusColors[lead.status];
                  const sourceStyle = sourceBadges[lead.source] || sourceBadges.manual;

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-800/30 transition cursor-pointer ${
                        isSelected ? 'bg-blue-950/20' : ''
                      }`}
                      onClick={() => setActiveLeadForModal(lead)}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleToggleSelect(lead.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Prospect Info */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={lead.avatar} 
                            alt={lead.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{lead.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({lead.leadScore} pts)</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{lead.location}</span>
                              {lead.email && (
                                <span className="text-slate-500 font-mono text-[10px]">· {lead.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Source Badge (Manual / Sales Nav / CSV) */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${sourceStyle.bg} ${sourceStyle.text}`}>
                          {sourceStyle.icon}
                          <span>{sourceStyle.label}</span>
                        </span>
                      </td>

                      {/* Role & Company */}
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-200">{lead.title}</div>
                        <div className="text-[11px] text-slate-400">{lead.company}</div>
                      </td>

                      {/* Campaign */}
                      <td className="py-3 px-2 text-slate-300">
                        {lead.campaignName ? (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                            {lead.campaignName}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Personalization Hook */}
                      <td className="py-3 px-2 max-w-xs truncate text-[11px] text-slate-400">
                        {lead.enrichment.personalizedHook || (
                          <span className="text-slate-600 italic">No custom post hook</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveLeadForModal(lead)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-slate-800 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Source Modal (Manual, Sales Nav, CSV) */}
      <MultiSourceLeadImportModal
        isOpen={showMultiSourceModal}
        onClose={() => setShowMultiSourceModal(false)}
        campaigns={campaigns}
        existingLeads={leads}
        onAddLeads={onAddLeads}
      />

      {/* Lead Detail Modal */}
      <LeadProfileModal
        lead={activeLeadForModal}
        onClose={() => setActiveLeadForModal(null)}
        onUpdateNotes={onUpdateLeadNotes}
        onToggleBlacklist={(leadId) => {
          const lead = leads.find(l => l.id === leadId);
          if (lead) {
            onUpdateLeadStatus(leadId, lead.status === 'blacklisted' ? 'new' : 'blacklisted');
          }
        }}
      />

    </div>
  );
};
