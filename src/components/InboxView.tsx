import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  Send, 
  Sparkles, 
  Clock, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Flame,
  Hourglass,
  UserX,
  MessageSquare
} from 'lucide-react';
import { InboxThread } from '../types';

interface InboxViewProps {
  threads: InboxThread[];
  onSendMessage: (threadId: string, text: string) => void;
  onUpdateThreadLabel: (threadId: string, label: 'interested' | 'not_now' | 'wrong_person' | 'general') => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  threads,
  onSendMessage,
  onUpdateThreadLabel
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(threads[0]?.id || '');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [replyInput, setReplyInput] = useState('');
  const [snoozeNotif, setSnoozeNotif] = useState<string | null>(null);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const filteredThreads = threads.filter(t => {
    if (filterLabel === 'all') return true;
    return t.label === filterLabel;
  });

  const handleSend = () => {
    if (!replyInput.trim() || !selectedThread) return;
    onSendMessage(selectedThread.id, replyInput);
    setReplyInput('');
  };

  const handleSelectSuggestedReply = (reply: string) => {
    setReplyInput(reply);
  };

  const handleSnooze = (days: number) => {
    setSnoozeNotif(`Conversation with ${selectedThread?.leadName} snoozed for ${days} days.`);
    setTimeout(() => setSnoozeNotif(null), 3000);
  };

  const labelStyles: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
    interested: { label: 'Interested', icon: <Flame className="w-3.5 h-3.5" />, bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    not_now: { label: 'Not Now', icon: <Hourglass className="w-3.5 h-3.5" />, bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    wrong_person: { label: 'Wrong Person', icon: <UserX className="w-3.5 h-3.5" />, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
    general: { label: 'General', icon: <MessageSquare className="w-3.5 h-3.5" />, bg: 'bg-slate-700/50 border-slate-600', text: 'text-slate-300' }
  };

  return (
    <div className="space-y-6">
      
      {/* Inbox Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400" />
            <span>Unified LinkedIn Inbox</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time reply stream, AI intent classification (Interested, Not Now, Wrong Person), and 1-click smart replies.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterLabel('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterLabel === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterLabel('interested')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
              filterLabel === 'interested' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Interested</span>
          </button>
          <button
            onClick={() => setFilterLabel('not_now')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
              filterLabel === 'not_now' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>Not Now</span>
          </button>
          <button
            onClick={() => setFilterLabel('wrong_person')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
              filterLabel === 'wrong_person' ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-500/10'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Wrong Person</span>
          </button>
        </div>
      </div>

      {snoozeNotif && (
        <div className="bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{snoozeNotif}</span>
        </div>
      )}

      {/* Main Inbox Split Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left List of Threads (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-900/50">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1">
            {filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThread?.id;
              const style = labelStyles[thread.label] || labelStyles.general;
              const lastMsg = thread.messages[thread.messages.length - 1];

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                    isSelected ? 'bg-blue-600/10 border-l-4 border-blue-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <img 
                    src={thread.leadAvatar} 
                    alt={thread.leadName} 
                    className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                        <span>{thread.leadName}</span>
                        {thread.unread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{thread.lastActivity}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {thread.leadCompany}
                    </div>

                    <p className="text-xs text-slate-300 truncate mt-1">
                      {lastMsg?.body || 'No messages yet'}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${style.bg} ${style.text}`}>
                        {style.icon}
                        <span>{style.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Conversation Thread (8 cols) */}
        {selectedThread ? (
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900/30">
            
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedThread.leadAvatar} 
                  alt={selectedThread.leadName} 
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{selectedThread.leadName}</span>
                    <span className="text-xs font-normal text-slate-400">({selectedThread.leadTitle} · {selectedThread.leadCompany})</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sequence stopped on reply · Safe manual control</span>
                  </div>
                </div>
              </div>

              {/* Status / Label Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedThread.label}
                  onChange={(e) => onUpdateThreadLabel(selectedThread.id, e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="interested">🔥 Interested</option>
                  <option value="not_now">⏳ Not Now</option>
                  <option value="wrong_person">🚫 Wrong Person</option>
                  <option value="general">💬 General</option>
                </select>

                <button
                  onClick={() => handleSnooze(3)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Snooze 3 days"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Thread History */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[360px]">
              {selectedThread.messages.map((msg) => {
                const isMe = msg.sender === 'user';

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                      <span>{isMe ? 'You' : selectedThread.leadName}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div 
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/80'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Suggested Replies Box */}
            {selectedThread.suggestedReplies && selectedThread.suggestedReplies.length > 0 && (
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Suggested Responses (Click to insert):</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {selectedThread.suggestedReplies.map((reply, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestedReply(reply)}
                      className="text-left text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700/60 transition truncate"
                    >
                      "{reply}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Reply to ${selectedThread.leadName}...`}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              <button
                onClick={handleSend}
                disabled={!replyInput.trim()}
                className={`p-2.5 rounded-xl transition ${
                  replyInput.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500 text-xs">
            No thread selected
          </div>
        )}

      </div>

    </div>
  );
};
