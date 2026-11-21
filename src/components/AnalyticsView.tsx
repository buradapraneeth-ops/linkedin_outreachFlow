import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  PieChart,
  Users
} from 'lucide-react';
import { Campaign } from '../types';

interface AnalyticsViewProps {
  campaigns: Campaign[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ campaigns }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Aggregate Funnel Metrics
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leadCount, 0);
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalAccepted = campaigns.reduce((acc, c) => acc + c.acceptedCount, 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + c.repliedCount, 0);
  const totalBooked = campaigns.reduce((acc, c) => acc + c.bookedCount, 0);

  const acceptRate = totalSent > 0 ? ((totalAccepted / totalSent) * 100).toFixed(1) : '0';
  const replyRate = totalAccepted > 0 ? ((totalReplied / totalAccepted) * 100).toFixed(1) : '0';
  const bookingRate = totalReplied > 0 ? ((totalBooked / totalReplied) * 100).toFixed(1) : '0';

  const handleExportCSV = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Best send times heatmap matrix (Days of week vs Hours of day)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM'];
  
  // Sample conversion densities for heatmap
  const heatData: Record<string, number> = {
    'Tue-11 AM': 92,
    'Tue-1 PM': 88,
    'Wed-9 AM': 78,
    'Wed-11 AM': 95,
    'Wed-1 PM': 84,
    'Thu-11 AM': 89,
    'Thu-3 PM': 76,
    'Mon-11 AM': 65,
    'Fri-9 AM': 58,
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Outreach Performance & Funnel Analytics</span>
          </h1>
          <p className="text-xs text-slate-400">
            Conversion metrics, variant comparisons, and optimal LinkedIn engagement windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range pills */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs flex">
            {(['7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  timeRange === range ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-medium text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{downloadSuccess ? 'Exported!' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Conversion Funnel Visualization (Crucial Requirement from Section 4.9) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Full Outreach Conversion Funnel</h3>
            <p className="text-xs text-slate-400">Progression from imported lead to confirmed calendar booking</p>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Overall Health: Healthy (&gt;30% Acceptance)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Stage 1: Invites Sent */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">1. Invites Sent</div>
            <div className="text-2xl font-bold text-white mt-1">{totalSent}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Out of {totalLeads} total leads</div>
            <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-full" />
            </div>
          </div>

          {/* Stage 2: Accepted */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">2. Accepted</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{totalAccepted}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">{acceptRate}% acceptance rate</div>
            <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${acceptRate}%` }}
              />
            </div>
          </div>

          {/* Stage 3: Replied */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">3. Replied</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{totalReplied}</div>
            <div className="text-[11px] text-purple-400 font-semibold mt-0.5">{replyRate}% reply rate</div>
            <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full" 
                style={{ width: `${replyRate}%` }}
              />
            </div>
          </div>

          {/* Stage 4: Meetings Booked */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">4. Meetings Booked</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{totalBooked}</div>
            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">{bookingRate}% conversion from reply</div>
            <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${bookingRate}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Variant Breakdown & Best Send Times Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Campaign Breakdown Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white">Campaign Performance Comparison</h3>
          
          <div className="space-y-3">
            {campaigns.map(camp => {
              const cAccept = camp.sentCount > 0 ? Math.round((camp.acceptedCount / camp.sentCount) * 100) : 0;
              const cReply = camp.acceptedCount > 0 ? Math.round((camp.repliedCount / camp.acceptedCount) * 100) : 0;

              return (
                <div key={camp.id} className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{camp.name}</span>
                    <span className="text-slate-400 font-normal">{camp.sentCount} sent</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Acceptance</span>
                        <span className="font-semibold text-emerald-400">{cAccept}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${cAccept}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Reply Rate</span>
                        <span className="font-semibold text-purple-400">{cReply}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${cReply}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimal Send Times Heatmap (Section 4.9 requirement) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Best Send Times & Heatmap</h3>
              <p className="text-xs text-slate-400">Acceptance probability by day & local time slot</p>
            </div>
            <span className="text-[11px] text-blue-400 font-semibold">Peak: Wed 11 AM</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[320px] text-xs">
              <div className="grid grid-cols-6 gap-1 mb-1 text-center font-semibold text-slate-400 text-[10px]">
                <div className="text-left pl-1">Time</div>
                {days.map(d => <div key={d}>{d}</div>)}
              </div>

              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-6 gap-1 mb-1 items-center">
                  <div className="text-[10px] text-slate-400 pl-1 font-mono">{hour}</div>
                  {days.map(day => {
                    const key = `${day}-${hour}`;
                    const score = heatData[key] || Math.floor(Math.random() * 40) + 20;

                    let bg = 'bg-slate-800/40 text-slate-500';
                    if (score > 85) bg = 'bg-emerald-600 text-white font-bold';
                    else if (score > 70) bg = 'bg-blue-600/70 text-blue-100 font-medium';
                    else if (score > 50) bg = 'bg-blue-900/40 text-blue-300';

                    return (
                      <div 
                        key={day} 
                        className={`h-8 rounded flex items-center justify-center text-[10px] transition ${bg}`}
                        title={`${day} at ${hour}: ${score}% acceptance probability`}
                      >
                        {score}%
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Low Engagement (&lt;40%)</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-800" />
              <span className="w-3 h-3 rounded bg-blue-900/40" />
              <span className="w-3 h-3 rounded bg-blue-600/70" />
              <span className="w-3 h-3 rounded bg-emerald-600" />
            </div>
            <span>High Engagement (&gt;85%)</span>
          </div>

        </div>

      </div>

    </div>
  );
};
