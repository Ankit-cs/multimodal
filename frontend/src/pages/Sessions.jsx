// src/pages/Sessions.jsx
// Full page listing all past conversations. Clicking a session loads it into the Chat.
import React, { useState, useEffect } from 'react';
import { getHistory } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import {
  Search, CheckCircle2, XCircle, Clock, Calendar, ChevronRight,
  Activity, Loader2, Inbox, MessageSquareDashed, Sparkles, Play,
  AlertCircle
} from 'lucide-react';

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_META = {
  COMPLETED:      { label: 'Completed',         icon: CheckCircle2, dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  FAILED:         { label: 'Failed',             icon: XCircle,      dot: 'bg-red-400',     bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'     },
  ACTIVE:         { label: 'Running',            icon: Activity,     dot: 'bg-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'    },
  PAUSED_FOR_HITL:{ label: 'Awaiting Approval',  icon: Clock,        dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
};

// ── Date formatter ────────────────────────────────────────────────────────────

const formatDate = (isoStr) => {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch { return isoStr || '—'; }
};

const formatFullDate = (isoStr) => {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoStr || '—'; }
};

// ── Sessions Page ─────────────────────────────────────────────────────────────

const Sessions = () => {
  const { token } = useAuth();
  const { loadSession, currentSessionId } = useChatContext();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getHistory(token)
      .then((data) => { setSessions(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [token]);

  // Filtered and searched sessions
  const filtered = sessions.filter((s) => {
    const matchesSearch = (s.original_prompt || s.session_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by date
  const groupByDate = (items) => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

    items.forEach((item) => {
      const d = new Date(item.created_at);
      let label;
      if (d >= today) label = 'Today';
      else if (d >= yesterday) label = 'Yesterday';
      else if (d >= weekAgo) label = 'This Week';
      else label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);
  const statusOptions = ['ALL', 'COMPLETED', 'ACTIVE', 'PAUSED_FOR_HITL', 'FAILED'];

  return (
    <div className="flex-1 w-full bg-[#f8fafc] font-sans">
      <div className="w-full">

          {/* ── Hero Header ── */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-8 pt-8 pb-10">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <MessageSquareDashed size={22} className="text-indigo-300" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Sessions</h1>
              </div>
              <p className="text-slate-400 text-sm max-w-lg">
                Browse all your past  conversations. Click any session to pick up where you left off.
              </p>

              {/* Search + Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search sessions..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition-all backdrop-blur-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        statusFilter === s
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s === 'PAUSED_FOR_HITL' ? 'Pending' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Session List ── */}
          <div className="px-8 py-6">
            <div className="max-w-5xl mx-auto">

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                  <Loader2 size={28} className="animate-spin text-indigo-400" />
                  <span className="text-sm font-medium">Loading your sessions…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-24 text-red-400">
                  <AlertCircle size={36} />
                  <p className="font-medium">Failed to load sessions</p>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Inbox size={28} className="text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-600 mb-1">No sessions found</p>
                    <p className="text-sm text-gray-400">
                      {search ? 'Try a different search term.' : 'Start your first orchestration from the Dashboard.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([label, items]) => (
                    <div key={label}>
                      {/* Date group header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-slate-400 font-medium">{items.length} session{items.length !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Session cards */}
                      <div className="space-y-2">
                        {items.map((session) => {
                          const meta = STATUS_META[session.status] || { label: session.status, icon: Activity, dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                          const StatusIcon = meta.icon;
                          const isActive = currentSessionId === session.session_id;

                          return (
                            <button
                              key={session.session_id}
                              onClick={() => loadSession(session.session_id)}
                              className={`w-full text-left group rounded-2xl border transition-all duration-200 ${
                                isActive
                                  ? 'bg-indigo-50/80 border-indigo-200 shadow-md shadow-indigo-100/50 ring-1 ring-indigo-200'
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100/80'
                              }`}
                            >
                              <div className="flex items-center gap-4 px-5 py-4">
                                {/* Status dot */}
                                <div className="flex-shrink-0">
                                  <div className={`w-2.5 h-2.5 rounded-full ${meta.dot} ${session.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-sm truncate mb-1 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {session.original_prompt || 'Untitled Session'}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="font-mono truncate max-w-[160px]">{session.session_id}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={11} />
                                      {formatDate(session.created_at)}
                                    </span>
                                  </div>
                                </div>

                                {/* Status badge */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border} flex-shrink-0`}>
                                  <StatusIcon size={13} />
                                  {meta.label}
                                </div>

                                {/* Arrow / Load indicator */}
                                <div className={`flex-shrink-0 transition-all ${isActive ? 'text-indigo-500' : 'text-gray-300 group-hover:text-slate-500'}`}>
                                  {isActive ? (
                                    <Play size={16} className="fill-current" />
                                  ) : (
                                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                  )}
                                </div>
                              </div>

                              {/* Expanded date on hover (visible via tooltip) */}
                              {session.created_at && (
                                <div className="px-5 pb-0 overflow-hidden max-h-0 group-hover:max-h-8 group-hover:pb-3 transition-all duration-300">
                                  <p className="text-xs text-slate-400">
                                    Created: {formatFullDate(session.created_at)}
                                    {session.updated_at && ` • Updated: ${formatFullDate(session.updated_at)}`}
                                  </p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default Sessions;
