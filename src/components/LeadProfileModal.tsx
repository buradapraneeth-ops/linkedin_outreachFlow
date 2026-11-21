import React from 'react';
import { 
  X, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Users, 
  Sparkles, 
  Clock, 
  Send, 
  Ban, 
  CheckCircle2, 
  MessageSquare, 
  Eye, 
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { Lead } from '../types';

interface LeadProfileModalProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
  onToggleBlacklist: (leadId: string) => void;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  lead,
  onClose,
  onUpdateNotes,
  onToggleBlacklist
}) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <img 
              src={lead.avatar} 
              alt={lead.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{lead.name}</h3>
                <a 
                  href={lead.linkedinUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 hover:text-blue-400 transition"
                  title="View on LinkedIn"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-400 font-medium">{lead.title} at <span className="text-slate-200">{lead.company}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Meta Row */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-300 truncate">{lead.location}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-300 truncate">{lead.enrichment.companyHeadcount}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-300">{lead.enrichment.mutualConnections} mutuals</span>
            </div>
          </div>

          {/* AI Enrichment Data Card */}
          <div className="bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-800/40 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Profile Enrichment & Recent Post Hook</span>
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono">
                Lead Score: {lead.leadScore}/100
              </span>
            </div>
            {lead.enrichment.recentPostSnippet ? (
              <blockquote className="text-xs text-slate-300 italic border-l-2 border-blue-500/50 pl-3 py-1">
                "{lead.enrichment.recentPostSnippet}"
              </blockquote>
            ) : (
              <p className="text-xs text-slate-500">No recent public post scraped.</p>
            )}
            {lead.enrichment.personalizedHook && (
              <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-blue-400 block mb-0.5">Synthesized Personalization Hook:</span>
                {lead.enrichment.personalizedHook}
              </div>
            )}
          </div>

          {/* Touchpoint Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Touchpoint Timeline</span>
            </h4>

            {lead.timeline.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No touchpoints recorded yet. Lead is in queue.</p>
            ) : (
              <div className="relative border-l border-slate-800 ml-3 space-y-4 text-xs">
                {lead.timeline.map((event) => {
                  return (
                    <div key={event.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-blue-500" />
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-semibold text-slate-200 capitalize">
                          {event.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-slate-500">{event.date}</span>
                      </div>
                      {event.note && (
                        <p className="text-slate-400 mt-1 bg-slate-800/40 p-2 rounded border border-slate-800">
                          {event.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Internal Team Notes
            </h4>
            <textarea
              defaultValue={lead.notes || ''}
              onBlur={(e) => onUpdateNotes(lead.id, e.target.value)}
              placeholder="Add qualification notes, meeting notes, or follow-up preferences..."
              className="w-full bg-slate-800/70 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none h-20"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <button
            onClick={() => onToggleBlacklist(lead.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              lead.status === 'blacklisted'
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{lead.status === 'blacklisted' ? 'Remove from Blacklist' : 'Add to Do-Not-Contact'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
