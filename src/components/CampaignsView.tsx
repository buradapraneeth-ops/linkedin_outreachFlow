import React, { useState } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  Copy, 
  Edit3, 
  Trash2, 
  Users, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Calendar,
  Clock,
  Sparkles,
  Layers,
  UserPlus,
  X,
  ExternalLink
} from 'lucide-react';
import { Campaign, LinkedInAccount, Lead } from '../types';
import { CampaignBuilderModal } from './CampaignBuilderModal';
import { MultiSourceLeadImportModal } from './MultiSourceLeadImportModal';

interface CampaignsViewProps {
  campaigns: Campaign[];
  accounts: LinkedInAccount[];
  leads: Lead[];
  onToggleCampaign: (id: string) => void;
  onDuplicateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onSaveCampaign: (campaignData: Partial<Campaign> & { initial_leads?: any[] }, existingId?: string) => void;
  onAddLeadsToCampaign: (campaignId: string, newLeads: any[]) => void;
  onRemoveLeadFromCampaign: (campaignId: string, leadId: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  accounts,
  leads,
  onToggleCampaign,
  onDuplicateCampaign,
  onDeleteCampaign,
  onSaveCampaign,
  onAddLeadsToCampaign,
  onRemoveLeadFromCampaign
}) => {
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [managingLeadsCampaign, setManagingLeadsCampaign] = useState<Campaign | null>(null);
  const [showImportForCampaign, setShowImportForCampaign] = useState(false);

  // Filter leads attached to the selected campaign
  const campaignAttachedLeads = managingLeadsCampaign 
    ? leads.filter(l => l.campaign_id === managingLeadsCampaign.id)
    : [];

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Outreach Campaigns</h1>
          <p className="text-xs text-slate-400">
            Multi-step automated sequences mapped to connected LinkedIn accounts with integrated prospect management.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid / List */}
      <div className="space-y-4">
        {campaigns.map((camp) => {
          const isRunning = camp.status === 'running';
          const attachedCount = leads.filter(l => l.campaign_id === camp.id).length;
          const displayLeadCount = camp.lead_count || attachedCount;
          const acceptRate = camp.sent_count > 0 ? Math.round((camp.accepted_count / camp.sent_count) * 100) : 0;
          const replyRate = camp.accepted_count > 0 ? Math.round((camp.replied_count / camp.accepted_count) * 100) : 0;
          
          const assignedAccount = accounts.find(a => a.id === camp.account_id) || accounts[0];

          return (
            <div 
              key={camp.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4 shadow-md"
            >
              
              {/* Campaign Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">{camp.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isRunning 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {camp.status.toUpperCase()}
                    </span>
                  </div>

                  {/* LinkedIn Account Tag */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                      <Layers className="w-3 h-3 text-blue-400" />
                      <span>{assignedAccount ? assignedAccount.name : 'Primary Account'}</span>
                    </span>
                    <span>·</span>
                    <span>Created {camp.created_at}</span>
                    <span>·</span>
                    <span>{camp.schedule?.days?.join(', ') || 'Mon-Fri'}</span>
                  </div>
                </div>

                {/* Campaign Action Controls */}
                <div className="flex items-center gap-2">
                  {/* Lead Management inside Campaign */}
                  <button
                    onClick={() => setManagingLeadsCampaign(camp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Manage Leads ({attachedCount})</span>
                  </button>

                  <button
                    onClick={() => onToggleCampaign(camp.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isRunning
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isRunning ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    onClick={() => setEditingCampaign(camp)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Sequence"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDuplicateCampaign(camp)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Duplicate Campaign"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCampaign(camp.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Performance Funnel Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                
                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Total Leads</div>
                  <div className="text-base font-bold text-white mt-0.5">{displayLeadCount}</div>
                </div>

                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Invited / Sent</div>
                  <div className="text-base font-bold text-blue-400 mt-0.5">{camp.sent_count}</div>
                </div>

                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Accepted</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {camp.accepted_count} <span className="text-xs font-normal text-slate-400">({acceptRate}%)</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Replies</div>
                  <div className="text-base font-bold text-purple-400 mt-0.5">
                    {camp.replied_count} <span className="text-xs font-normal text-slate-400">({replyRate}%)</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Meetings Booked</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{camp.booked_count}</div>
                </div>

              </div>

              {/* Sequence Mini Steps Visualizer */}
              {camp.steps && camp.steps.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sequence Path ({camp.steps.length} steps):
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {camp.steps.map((st, idx) => (
                      <React.Fragment key={st.id || idx}>
                        <div className="bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-blue-400 font-bold">{idx + 1}.</span>
                          <span className="text-slate-200">{st.title}</span>
                          {st.delay_hours > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">+{st.delay_hours}h</span>
                          )}
                        </div>
                        {idx < camp.steps.length - 1 && (
                          <span className="text-slate-600 font-bold">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Campaign Lead Management Modal (Directly Manage Leads inside Campaign) */}
      {managingLeadsCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Campaign Leads: {managingLeadsCampaign.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {campaignAttachedLeads.length} prospects assigned to this sequence.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportForCampaign(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Attach Leads to This Campaign</span>
                </button>
                <button 
                  onClick={() => setManagingLeadsCampaign(null)} 
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {campaignAttachedLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-3">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No leads currently assigned to this campaign.</p>
                  <button
                    onClick={() => setShowImportForCampaign(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    + Import Prospects Now
                  </button>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-2.5">Prospect</th>
                        <th className="p-2.5">Role & Company</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Source</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {campaignAttachedLeads.map(l => (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-white flex items-center gap-2">
                            <img src={l.avatar} alt={l.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                            <span>{l.name}</span>
                          </td>
                          <td className="p-2.5 text-slate-300">
                            <div>{l.title}</div>
                            <div className="text-[11px] text-slate-400">{l.company}</div>
                          </td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                              {l.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400 capitalize">
                            {l.source.replace('_', ' ')}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => onRemoveLeadFromCampaign(managingLeadsCampaign.id, l.id)}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                              title="Detach from campaign"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setManagingLeadsCampaign(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MultiSource Modal Pre-Scoped for Campaign */}
      {showImportForCampaign && managingLeadsCampaign && (
        <MultiSourceLeadImportModal
          isOpen={showImportForCampaign}
          onClose={() => setShowImportForCampaign(false)}
          campaigns={campaigns}
          existingLeads={leads}
          targetCampaignId={managingLeadsCampaign.id}
          onAddLeads={(newLeads) => {
            onAddLeadsToCampaign(managingLeadsCampaign.id, newLeads);
            setShowImportForCampaign(false);
          }}
        />
      )}

      {/* Campaign Builder / Edit Modal */}
      {(isCreatingNew || editingCampaign) && (
        <CampaignBuilderModal
          campaign={editingCampaign}
          accounts={accounts}
          onClose={() => {
            setIsCreatingNew(false);
            setEditingCampaign(null);
          }}
          onSave={(data) => {
            onSaveCampaign(data, editingCampaign?.id);
            setIsCreatingNew(false);
            setEditingCampaign(null);
          }}
        />
      )}

    </div>
  );
};
