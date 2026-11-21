import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Copy, 
  Send, 
  AlertCircle, 
  Clock, 
  Check, 
  RefreshCw,
  ThumbsUp,
  FileText,
  Sliders,
  SplitSquareVertical
} from 'lucide-react';
import { PendingAction, MessageTemplate } from '../types';

interface MessageStudioProps {
  pendingActions: PendingAction[];
  onApproveAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onEditActionBody: (actionId: string, newBody: string) => void;
}

export const MessageStudio: React.FC<MessageStudioProps> = ({
  pendingActions,
  onApproveAction,
  onRejectAction,
  onEditActionBody
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'templates' | 'ab_testing'>('approvals');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<string>('');

  // AI Generator Simulator State
  const [promptLeadName, setPromptLeadName] = useState('Sarah Jenkins');
  const [promptCompany, setPromptCompany] = useState('CloudScale Systems');
  const [promptHook, setPromptHook] = useState('scaling distributed multi-cloud architecture and hiring 15 engineers');
  const [promptTone, setPromptTone] = useState<'concise' | 'casual' | 'value' | 'thoughtful'>('value');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string>(
    'Hi Sarah, came across your work scaling distributed multi-cloud architecture at CloudScale Systems. Really impressive milestone hiring 15 engineers! Would love to connect and share notes on cloud resilience.'
  );

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let draft = '';
      if (promptTone === 'concise') {
        draft = `Hi ${promptLeadName.split(' ')[0]} — noticed your engineering growth at ${promptCompany}. Resonated with your focus on ${promptHook}. Open to connecting?`;
      } else if (promptTone === 'casual') {
        draft = `Hey ${promptLeadName.split(' ')[0]}, saw your post on ${promptHook}. Huge congrats on the traction at ${promptCompany}! Would love to follow along and connect.`;
      } else if (promptTone === 'thoughtful') {
        draft = `Hi ${promptLeadName.split(' ')[0]}, your insights regarding ${promptHook} at ${promptCompany} are spot on for modern engineering teams. Keen to learn from your trajectory—let's connect!`;
      } else {
        draft = `Hi ${promptLeadName.split(' ')[0]}, came across your work at ${promptCompany}. Your focus on ${promptHook} caught my eye. We built a playbook on this exact bottleneck—would love to connect!`;
      }
      setGeneratedDraft(draft);
      setIsGenerating(false);
    }, 600);
  };

  const handleStartEdit = (action: PendingAction) => {
    setEditingActionId(action.id);
    setEditBuffer(action.draftBody);
  };

  const handleSaveEdit = (actionId: string) => {
    onEditActionBody(actionId, editBuffer);
    setEditingActionId(null);
  };

  const pendingList = pendingActions.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Message Studio & Human Approvals</span>
          </h1>
          <p className="text-xs text-slate-400">
            Generate high-converting personalized messages, verify 300-char limits, and approve pending actions before safe dispatch.
          </p>
        </div>

        {/* Studio Subtabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'approvals' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Review Queue</span>
            {pendingList.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'templates' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Generator & Variables
          </button>

          <button
            onClick={() => setActiveTab('ab_testing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'ab_testing' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A/B Variant Testing
          </button>
        </div>
      </div>

      {/* Tab 1: Human Approval Queue (Crucial Requirement from Section 4.7 & 7) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">Human Approval Gate:</span> All outgoing invites and direct messages stay queued until you review them. Once approved, the safety gate applies random delays (45s–180s).
            </div>
            {pendingList.length > 0 && (
              <button
                onClick={() => {
                  pendingList.forEach(a => onApproveAction(a.id));
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve All ({pendingList.length})</span>
              </button>
            )}
          </div>

          {pendingList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All drafted messages have been reviewed. New personalized drafts will automatically appear here as your campaigns reach their scheduled steps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingList.map((action) => {
                const isEditing = editingActionId === action.id;
                const isConnectionNote = action.type === 'invite';
                const charCount = isEditing ? editBuffer.length : action.draftBody.length;
                const isOverLimit = isConnectionNote && charCount > 300;

                return (
                  <div 
                    key={action.id} 
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition shadow-lg"
                  >
                    {/* Action Card Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={action.leadAvatar} 
                          alt={action.leadName} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{action.leadName}</span>
                            <span className="text-xs text-slate-400">· {action.leadTitle} at <strong className="text-slate-200">{action.leadCompany}</strong></span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-medium">{action.campaignName}</span>
                            <span>Scheduled: {action.scheduledTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Confidence & Step Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {action.type === 'invite' ? 'Connection Request Note' : 'Direct Message'}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {action.aiConfidence}% AI Match
                        </span>
                      </div>
                    </div>

                    {/* AI Reasoning Insight */}
                    <div className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>AI Synthesis:</strong> {action.reasoning}</span>
                    </div>

                    {/* Draft Body with Character Counter */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Personalized Message Draft:</span>
                        {isConnectionNote && (
                          <span className={`font-mono ${isOverLimit ? 'text-red-400 font-bold' : charCount > 250 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {charCount} / 300 characters {isOverLimit ? '(Exceeds LinkedIn limit!)' : ''}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingActionId(null)}
                              className="text-xs text-slate-400 hover:text-white px-3 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(action.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded"
                            >
                              Save Draft
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-200 leading-relaxed font-sans">
                          {action.draftBody}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleStartEdit(action)}
                        className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 font-medium transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Text</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRejectAction(action.id)}
                          className="bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Skip</span>
                        </button>

                        <button
                          onClick={() => onApproveAction(action.id)}
                          disabled={isOverLimit}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                            isOverLimit 
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Dispatch</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: AI Generator & Variables Playground */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Interactive Generator Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Message Drafter (Claude / Gemini Engine)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Prospect Name</label>
                <input 
                  type="text" 
                  value={promptLeadName} 
                  onChange={(e) => setPromptLeadName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Company Name</label>
                <input 
                  type="text" 
                  value={promptCompany} 
                  onChange={(e) => setPromptCompany(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Recent Post Topic / Observation</label>
                <textarea 
                  rows={2}
                  value={promptHook} 
                  onChange={(e) => setPromptHook(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Tone Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'value', label: 'Value-First' },
                    { id: 'concise', label: 'Direct & Short' },
                    { id: 'casual', label: 'Casual Founder' },
                    { id: 'thoughtful', label: 'Peer Thoughtful' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPromptTone(t.id as any)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition ${
                        promptTone === t.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Generate Tailored Draft</span>
              </button>
            </div>
          </div>

          {/* Right: Live Preview & Variables List */}
          <div className="space-y-4">
            
            {/* Output Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Generated Note Preview</span>
                <span className={`text-[11px] font-mono ${generatedDraft.length > 300 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                  {generatedDraft.length} / 300 chars
                </span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans min-h-[90px]">
                {generatedDraft}
              </div>
            </div>

            {/* Supported Template Variables Reference */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Template Variables</h4>
              <p className="text-xs text-slate-400">
                Click any variable to copy or inject into your campaign steps:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { tag: '{{first_name}}', desc: 'Prospect first name' },
                  { tag: '{{company}}', desc: 'Current company name' },
                  { tag: '{{title}}', desc: 'Job title / role' },
                  { tag: '{{recent_post_hook}}', desc: 'AI summary of recent post' },
                  { tag: '{{mutual_count}}', desc: 'Number of mutual connections' },
                  { tag: '{{location}}', desc: 'City / Region' }
                ].map(v => (
                  <div key={v.tag} className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg">
                    <code className="text-blue-400 font-mono text-[11px] font-bold block">{v.tag}</code>
                    <span className="text-[10px] text-slate-400">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 3: A/B Testing Variants */}
      {activeTab === 'ab_testing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Live A/B Variant Performance</h3>
              <p className="text-xs text-slate-400">
                Real-time conversion split testing across your connection request notes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Variant A */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded">
                    Variant A (Value Playbook)
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">42.2% Acceptance</span>
                </div>
                <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  "Hi &#123;&#123;first_name&#125;&#125;, came across your work leading engineering at &#123;&#123;company&#125;&#125;. &#123;&#123;recent_post_hook&#125;&#125; Would love to connect and exchange notes on modern scale!"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>96 Sent</span>
                  <span>41 Accepted</span>
                  <span className="text-emerald-400 font-bold">18 Replies (43.9%)</span>
                </div>
              </div>

              {/* Variant B */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-0.5 rounded">
                    Variant B (Short & Peer)
                  </span>
                  <span className="text-xs text-slate-300 font-bold">29.1% Acceptance</span>
                </div>
                <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  "Hi &#123;&#123;first_name&#125;&#125; — noticed your engineering leadership at &#123;&#123;company&#125;&#125;. Always keen to follow peers scaling resilient tech teams. Let's connect!"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>88 Sent</span>
                  <span>26 Accepted</span>
                  <span className="text-purple-400 font-bold">8 Replies (30.7%)</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
