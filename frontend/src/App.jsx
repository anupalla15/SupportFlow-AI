import { useState, useRef, useEffect, useMemo } from "react";

const API_URL = "http://127.0.0.1:8000/api/chat/";

// ── Config ─────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  angry:      { label: "Angry",      color: "text-red-400",     bg: "bg-red-950 border-red-800",        dot: "bg-red-400",     bar: "#f87171" },
  frustrated: { label: "Frustrated", color: "text-orange-400",  bg: "bg-orange-950 border-orange-800",  dot: "bg-orange-400",  bar: "#fb923c" },
  neutral:    { label: "Neutral",    color: "text-slate-400",   bg: "bg-slate-800 border-slate-700",    dot: "bg-slate-400",   bar: "#94a3b8" },
  positive:   { label: "Positive",   color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800",dot: "bg-emerald-400", bar: "#34d399" },
};

const PRIORITY_BADGE = {
  critical: "bg-red-900 text-red-300 border border-red-700",
  high:     "bg-orange-900 text-orange-300 border border-orange-700",
  medium:   "bg-slate-700 text-slate-300 border border-slate-600",
  low:      "bg-emerald-900 text-emerald-300 border border-emerald-700",
};

const RESOLUTION_CONFIG = {
  "Resolved":    { color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800", icon: "✅" },
  "Escalated":   { color: "text-red-400",     bg: "bg-red-950 border-red-800",         icon: "⚡" },
  "Pending":     { color: "text-yellow-400",  bg: "bg-yellow-950 border-yellow-800",   icon: "⏳" },
  "In Progress": { color: "text-blue-400",    bg: "bg-blue-950 border-blue-800",       icon: "🔄" },
};

const CATEGORY_ICONS = {
  Billing: "💳", Workflow: "⚡", Access: "🔐",
  API: "🔌", Onboarding: "🚀", General: "🏢", Other: "💬",
};

const AGENT_COLORS = {
  blue:   { bg: "bg-blue-950 border-blue-800",      text: "text-blue-400"    },
  orange: { bg: "bg-orange-950 border-orange-800",  text: "text-orange-400"  },
  purple: { bg: "bg-purple-950 border-purple-800",  text: "text-purple-400"  },
  green:  { bg: "bg-emerald-950 border-emerald-800",text: "text-emerald-400" },
  slate:  { bg: "bg-slate-800 border-slate-700",    text: "text-slate-400"   },
};

const SUGGESTED = [
  { icon: "⚡", text: "My scheduled workflow stopped executing overnight" },
  { icon: "🔌", text: "API calls returning 401 after credential rotation" },
  { icon: "💳", text: "AI credits depleted faster than expected this cycle" },
  { icon: "🔐", text: "Team member cannot access the enterprise dashboard" },
  { icon: "🚀", text: "How do I connect FlowZint to our existing infrastructure?" },
  { icon: "📊", text: "Webhook triggers firing inconsistently in production" },
];

// ── Utilities ──────────────────────────────────────────────────────────────

function formatHistory(messages) {
  return messages
    .filter((m) => !["system","escalation","queue","critical"].includes(m.from))
    .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
}
function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function capitalize(s = "") { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Charts ─────────────────────────────────────────────────────────────────

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">{d.label}</span>
            <span className="text-slate-300 font-medium">{d.value}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 36, cx = 44, cy = 44, stroke = 12, circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d) => {
    const dash = (d.value / total) * circumference;
    const s = { ...d, dash, gap: circumference - dash, offset };
    offset += dash; return s;
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="88" height="88" className="shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {slices.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={stroke} strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="space-y-1.5 flex-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-slate-400">{d.label}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-300">
              {total > 1 ? `${Math.round((d.value / total) * 100)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ values, color = "#6366f1" }) {
  if (values.length < 2) return <div className="text-[11px] text-slate-600 text-center py-2">Not enough data yet</div>;
  const w = 200, h = 40, pad = 4, max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <div className={`text-3xl font-bold ${accent}`}>{value}</div>
        {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Critical alert popup ───────────────────────────────────────────────────

function CriticalAlert({ alert, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-5 right-5 z-50 w-80">
      <style>{`
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shrink  { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <div style={{ animation: "slideIn 0.3s ease" }}
        className="bg-slate-900 border-2 border-red-600 rounded-2xl p-4 shadow-2xl shadow-red-900/40">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-bold text-sm">Escalation Alert</span>
          </div>
          <button onClick={onDismiss} className="text-slate-600 hover:text-slate-300 text-lg leading-none">&times;</button>
        </div>
        <p className="text-white text-sm font-medium mb-1">Human Agent Notified</p>
        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
          Critical issue detected. A specialist has been notified and will contact you shortly.
        </p>
        <div className="bg-red-950 border border-red-800 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-red-400 uppercase tracking-wider mb-0.5">Queue Position</div>
            <div className="text-white font-bold text-lg">#{alert.queue_position}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Est. Wait</div>
            <div className="text-slate-300 text-sm font-medium">~{alert.queue_position * 3} min</div>
          </div>
        </div>
        <div className="mt-3 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-600 rounded-full" style={{ animation: "shrink 6s linear", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

// ── Summary card (admin only) ──────────────────────────────────────────────

function SummaryCard({ summary }) {
  const [expanded, setExpanded] = useState(false);
  const sentCfg = SENTIMENT_CONFIG[summary.sentiment]          || SENTIMENT_CONFIG.neutral;
  const resCfg  = RESOLUTION_CONFIG[summary.resolution_status] || RESOLUTION_CONFIG["Pending"];
  const catIcon = CATEGORY_ICONS[summary.category]             || "💬";
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-lg">{catIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-indigo-400 font-semibold">{summary.ticket_id}</span>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-xs text-slate-500">{summary.category}</span>
            </div>
            <p className="text-sm text-white font-medium leading-snug">{summary.issue}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-1 rounded-lg hover:bg-slate-800">
          <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </div>
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${sentCfg.bg} ${sentCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sentCfg.dot}`} />{sentCfg.label}
        </span>
        <span className={`text-[11px] px-2.5 py-1 rounded-full ${PRIORITY_BADGE[summary.priority]}`}>{capitalize(summary.priority)}</span>
        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${resCfg.bg} ${resCfg.color}`}>
          {resCfg.icon} {summary.resolution_status}
        </span>
      </div>
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Action Taken</div>
            <p className="text-sm text-slate-200 leading-relaxed">{summary.action_taken}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Category", summary.category, "text-white"],
              ["Priority", capitalize(summary.priority),
                summary.priority === "critical" ? "text-red-400" :
                summary.priority === "high"     ? "text-orange-400" :
                summary.priority === "low"      ? "text-emerald-400" : "text-slate-300"],
              ["Sentiment", sentCfg.label, sentCfg.color],
            ].map(([l, v, c]) => (
              <div key={l} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{l}</div>
                <div className={`text-xs font-semibold ${c}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activity feed item (admin) ─────────────────────────────────────────────

function ActivityItem({ item }) {
  const cfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-indigo-400">{item.ticket_id}</span>
          {item.critical  && <span className="text-[10px] bg-red-900 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold">CRITICAL</span>}
          {item.escalate && !item.critical && <span className="text-[10px] bg-orange-900 text-orange-300 border border-orange-700 px-1.5 py-0.5 rounded">ESC</span>}
          {item.ragUsed   && <span className="text-[10px] text-indigo-400">📚</span>}
        </div>
        <p className="text-xs text-slate-400 truncate">{item.message}</p>
        <span className="text-[10px] text-slate-600">{item.time}</span>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_BADGE[item.priority]}`}>{item.priority}</span>
    </div>
  );
}

// ── Chat components ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sm">⚡</div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

function AgentBadge({ agentInfo }) {
  if (!agentInfo?.agent) return null;
  return (
    <span className="text-[11px] text-slate-600 px-1 mb-0.5">
      {agentInfo.emoji} {agentInfo.agent}
    </span>
  );
}

function EscalationNotice() {
  return (
    <div className="max-w-[85%] mx-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-orange-950 border border-orange-800 flex items-center justify-center shrink-0">
          <span className="text-xs">👋</span>
        </div>
        <div>
          <p className="text-slate-300 text-sm font-medium">Connecting you to a specialist</p>
          <p className="text-slate-500 text-xs mt-0.5">A support agent has been notified and will follow up shortly.</p>
        </div>
      </div>
    </div>
  );
}

function CriticalNotice({ queuePos }) {
  return (
    <div className="max-w-[85%] mx-auto">
      <div className="bg-slate-900 border border-red-900/60 rounded-2xl px-5 py-3 flex items-center gap-3">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
        <div>
          <p className="text-slate-300 text-sm font-medium">Priority case — specialist notified</p>
          <p className="text-slate-500 text-xs mt-0.5">
            You're #{queuePos} in queue · estimated response within {queuePos * 3} minutes
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.from === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mb-0.5">U</div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mb-0.5 text-sm">⚡</div>
      )}
      <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {!isUser && <AgentBadge agentInfo={msg.agentInfo} />}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line
          ${isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-sm"}`}>
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-700 px-1">{msg.time}</span>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
        ${active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}>
      {children}
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]                         = useState("chat");
  const [messages, setMessages]               = useState([{
    id: 0, from: "bot", agentInfo: null,
    text: "Hi! I'm SupportFlow AI — the official support assistant for FlowZint's enterprise platform.\n\nI can help with AI automation workflows, SaaS subscriptions, API integrations, platform access, and more.\n\nWhat can I help you with today?",
    time: now(),
  }]);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [ticketLog, setTicketLog]             = useState([]);
  const [summaries, setSummaries]             = useState([]);
  const [trendPoints, setTrendPoints]         = useState([0]);
  const [criticalAlert, setCriticalAlert]     = useState(null);
  const [escalationQueue, setEscalationQueue] = useState([]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Analytics ──────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const total      = ticketLog.length;
    const escalated  = ticketLog.filter(t => t.escalate).length;
    const critical   = ticketLog.filter(t => t.critical).length;
    const kbUsed     = ticketLog.filter(t => t.ragUsed).length;
    const escRate    = total ? Math.round((escalated / total) * 100) : 0;
    const aiResolved = total ? Math.round(((total - escalated) / total) * 100) : 0;

    const sentimentCounts = { angry: 0, frustrated: 0, neutral: 0, positive: 0 };
    ticketLog.forEach(t => { if (sentimentCounts[t.sentiment] !== undefined) sentimentCounts[t.sentiment]++; });
    const sentimentBars = Object.entries(sentimentCounts).map(([k, v]) => ({ label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar }));
    const donutData     = Object.entries(sentimentCounts).map(([k, v]) => ({ label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar }));

    const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    ticketLog.forEach(t => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
    const priorityBars = [
      { label: "Critical", value: priorityCounts.critical, color: "#f87171" },
      { label: "High",     value: priorityCounts.high,     color: "#fb923c" },
      { label: "Medium",   value: priorityCounts.medium,   color: "#94a3b8" },
      { label: "Low",      value: priorityCounts.low,      color: "#34d399" },
    ];
    return { total, escalated, critical, kbUsed, escRate, aiResolved, sentimentBars, donutData, priorityBars };
  }, [ticketLog]);

  // ── Send message ───────────────────────────────────────────────

  async function sendMessage(text_override) {
    const text = (text_override || input).trim();
    if (!text || loading) return;

    const t       = now();
    const userMsg = { id: Date.now(), from: "user", text, time: t };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: formatHistory(updated) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data   = await res.json();
      const ticket = data.ticket;

      const botMsg = {
        id: Date.now() + 1, from: "bot",
        text: data.reply, time: now(),
        agentInfo: data.agent_info ?? null,
      };

      let newMsgs = [...updated];
      if (ticket?.escalate && !ticket?.critical) {
        newMsgs.push({ id: Date.now() + 2, from: "escalation", text: "", time: t });
      }
      if (ticket?.critical) {
        newMsgs.push({ id: Date.now() + 3, from: "critical", ticket, text: "", time: t });
      }
      newMsgs.push(botMsg);
      setMessages(newMsgs);

      setTicketLog(prev => [...prev, { ...ticket, message: text, time: t, ragUsed: data.rag_used ?? false }]);
      if (data.summary?.issue) setSummaries(prev => [data.summary, ...prev]);

      if (ticket?.critical) {
        setCriticalAlert({ ticket_id: ticket.ticket_id, queue_position: ticket.queue_position });
        setEscalationQueue(prev => [
          { ...ticket, message: text, time: t, agent: data.agent_info?.agent ?? "Enterprise Support AI" },
          ...prev,
        ]);
      }
      setTrendPoints(prev => [...prev, ticket?.escalate ? 1 : 0].slice(-12));

    } catch (err) {
      setError(err.message || "Could not reach the backend.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function clearChat() {
    setMessages([{
      id: 0, from: "bot", agentInfo: null,
      text: "Hi! I'm SupportFlow AI — the official support assistant for FlowZint's enterprise platform.\n\nI can help with AI automation workflows, SaaS subscriptions, API integrations, platform access, and more.\n\nWhat can I help you with today?",
      time: now(),
    }]);
    setError(null);
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {criticalAlert && (
        <CriticalAlert alert={criticalAlert} onDismiss={() => setCriticalAlert(null)} />
      )}

      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 text-lg">⚡</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">SupportFlow AI</h1>
              <p className="text-slate-500 text-[11px]">Enterprise Support · Powered by FlowZint</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {[
              { icon: "⚡", label: "Workflow AI" },
              { icon: "💳", label: "Billing AI"  },
              { icon: "🔌", label: "API AI"       },
              { icon: "🔐", label: "Access AI"    },
            ].map(b => (
              <span key={b.label}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full
                  bg-slate-900 border border-slate-800 text-slate-500">
                <span>{b.icon}</span><span>{b.label}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {escalationQueue.length > 0 && (
              <button onClick={() => setTab("queue")}
                className="flex items-center gap-1.5 bg-red-950 border border-red-700 text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-900 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {escalationQueue.length} critical
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Online</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-3 flex items-center gap-2">
          <TabBtn active={tab === "chat"}      onClick={() => setTab("chat")}>💬 Support Chat</TabBtn>
          <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
            📊 Analytics
            {analytics.total > 0 && <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{analytics.total}</span>}
          </TabBtn>
          <TabBtn active={tab === "summaries"} onClick={() => setTab("summaries")}>
            📋 Summaries
            {summaries.length > 0 && <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{summaries.length}</span>}
          </TabBtn>
          <TabBtn active={tab === "queue"} onClick={() => setTab("queue")}>
            🚨 Queue
            {escalationQueue.length > 0 && <span className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{escalationQueue.length}</span>}
          </TabBtn>
        </div>
      </header>

      {/* ══ CHAT TAB ═════════════════════════════════════════════ */}
      {tab === "chat" && (
        <div className="flex flex-1 flex-col overflow-hidden" style={{ height: "calc(100vh - 112px)" }}>

          {/* ── Messages scroll area ── */}
          <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6">
            <div className="max-w-2xl mx-auto w-full space-y-6">

              {messages.map((msg) => {
                if (msg.from === "escalation") return <EscalationNotice key={`esc-${msg.time}`} />;
                if (msg.from === "critical")   return <CriticalNotice   key={`crit-${msg.ticket?.ticket_id}`} queuePos={msg.ticket?.queue_position ?? 1} />;
                return <ChatMessage key={msg.id} msg={msg} />;
              })}

              {loading && <TypingDots />}

              {error && (
                <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                  <span className="text-red-400">⚠</span>
                  <span><strong>Connection error:</strong> {error} — Is FastAPI running on port 8000?</span>
                </div>
              )}

              {/* Suggested queries — only on fresh chat */}
              {messages.length === 1 && !loading && (
                <div className="mt-4">
                  <p className="text-slate-600 text-xs mb-3 text-center tracking-wide uppercase">
                    Common support scenarios
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED.map((q) => (
                      <button key={q.text} onClick={() => sendMessage(q.text)}
                        className="text-left flex items-start gap-3 text-sm text-slate-400
                          bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3
                          hover:border-indigo-500/50 hover:text-slate-200 hover:bg-slate-800/60
                          transition-all duration-200 group">
                        <span className="text-base mt-0.5 group-hover:scale-110 transition-transform">{q.icon}</span>
                        <span className="leading-snug">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Input — outside scroll area, pinned to bottom ── */}
          <div className="border-t border-slate-800/60 bg-slate-950 px-4 md:px-8 py-5 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-end gap-3 bg-slate-900 border border-slate-700/60
                rounded-2xl px-4 py-3 focus-within:border-indigo-500/60 transition-colors duration-200">
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Describe your issue or ask about FlowZint's platform..."
                  rows={1} disabled={loading}
                  className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm
                    resize-none focus:outline-none disabled:opacity-40 max-h-28 leading-relaxed"
                  style={{ fieldSizing: "content" }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-500
                    disabled:bg-slate-800 disabled:text-slate-600
                    text-white rounded-xl flex items-center justify-center
                    transition-colors duration-200 shadow-lg shadow-indigo-900/30">
                  {loading
                    ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg>
                    : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M2 21L23 12 2 3v7l15 2-15 2v7z" /></svg>
                  }
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] text-slate-700">⏎ Send · ⇧⏎ New line</span>
                <button onClick={clearChat} className="text-[11px] text-slate-700 hover:text-slate-500 transition-colors">
                  Clear conversation
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══ ANALYTICS TAB ════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {analytics.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-1">No data yet</h3>
              <p className="text-slate-500 text-sm">Send messages in Support Chat to populate analytics.</p>
              <button onClick={() => setTab("chat")} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">Open Chat →</button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Session Metrics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Tickets"   value={analytics.total}            sub="This session"           accent="text-white"       icon="🎫" />
                  <StatCard label="Critical Cases"  value={analytics.critical}         sub="Human queue triggered"  accent="text-red-400"     icon="🚨" />
                  <StatCard label="Escalation Rate" value={`${analytics.escRate}%`}    sub={`${analytics.escalated} escalated`} accent="text-orange-400" icon="⚡" />
                  <StatCard label="AI Resolution"   value={`${analytics.aiResolved}%`} sub="Resolved by AI"         accent="text-emerald-400" icon="✅" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Sentiment Distribution</h3>
                  <DonutChart data={analytics.donutData} />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Priority Breakdown</h3>
                  <BarChart data={analytics.priorityBars} />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-1">Escalation Trend</h3>
                  <p className="text-slate-600 text-[11px] mb-4">Last {trendPoints.length} messages</p>
                  <Sparkline values={trendPoints} color="#f87171" />
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Escalations over time</span>
                    <span className="text-red-400 font-medium">{analytics.escalated} total</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Sentiment Volume</h3>
                <BarChart data={analytics.sentimentBars} />
              </div>

              {escalationQueue.length > 0 && (
                <div className="bg-slate-900 border border-red-900 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <h3 className="text-white font-semibold text-sm">Escalation Queue</h3>
                      <span className="text-xs bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">{escalationQueue.length} active</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {escalationQueue.map((item, i) => (
                      <div key={item.ticket_id} className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-900 border border-red-700 flex items-center justify-center shrink-0">
                          <span className="text-red-300 font-bold text-sm">#{i+1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-indigo-400">{item.ticket_id}</span>
                            <span className="text-[10px] text-slate-500">{item.agent}</span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">{item.message}</p>
                        </div>
                        <div className="text-right shrink-0 text-xs text-red-300">~{(i+1)*3} min</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Live Activity Feed</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[11px]">Live</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {[...ticketLog].reverse().map(t => <ActivityItem key={t.ticket_id} item={t} />)}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "KB Assisted",   value: analytics.kbUsed,                                         color: "text-indigo-400",  icon: "📚" },
                  { label: "Auto-Resolved", value: analytics.total - analytics.escalated,                    color: "text-emerald-400", icon: "🤖" },
                  { label: "Critical",      value: analytics.critical,                                       color: "text-red-400",     icon: "🚨" },
                  { label: "Positive",      value: ticketLog.filter(t => t.sentiment === "positive").length, color: "text-emerald-400", icon: "😊" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-slate-500 text-[11px]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ SUMMARIES TAB ════════════════════════════════════════ */}
      {tab === "summaries" && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-white font-semibold mb-1">No summaries yet</h3>
              <p className="text-slate-500 text-sm">AI summaries appear automatically after each support interaction.</p>
              <button onClick={() => setTab("chat")} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">Start Chat →</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total",     value: summaries.length,                                                   color: "text-white",       icon: "📋" },
                  { label: "Escalated", value: summaries.filter(s => s.resolution_status === "Escalated").length,  color: "text-red-400",     icon: "⚡" },
                  { label: "Resolved",  value: summaries.filter(s => s.resolution_status === "Resolved").length,   color: "text-emerald-400", icon: "✅" },
                  { label: "Pending",   value: summaries.filter(s => ["Pending","In Progress"].includes(s.resolution_status)).length, color: "text-yellow-400", icon: "⏳" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-slate-500 text-[11px]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-sm">
                  AI Session Summaries
                  <span className="text-slate-500 font-normal text-xs ml-1">({summaries.length})</span>
                </h2>
                <span className="text-slate-600 text-xs">Click to expand details</span>
              </div>
              <div className="space-y-3">
                {summaries.map(s => <SummaryCard key={s.ticket_id} summary={s} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ QUEUE TAB ════════════════════════════════════════════ */}
      {tab === "queue" && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-white font-bold text-lg">Human Escalation Queue</h2>
            <span className="bg-red-900 text-red-300 border border-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {escalationQueue.length} waiting
            </span>
          </div>

          {escalationQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-white font-semibold mb-1">Queue is clear</h3>
              <p className="text-slate-500 text-sm">No critical cases awaiting human agents.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {escalationQueue.map((item, i) => (
                <div key={item.ticket_id} className="bg-slate-900 border border-red-800 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-red-400 uppercase">Pos</span>
                    <span className="text-red-300 font-bold text-lg leading-none">#{i+1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-mono text-indigo-400 font-semibold">{item.ticket_id}</span>
                      <span className="text-[11px] bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">CRITICAL</span>
                      <span className="text-[11px] text-slate-500">{item.agent}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3 truncate">{item.message}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(() => {
                        const cfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
                        return (
                          <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                          </span>
                        );
                      })()}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[item.priority]}`}>{item.priority}</span>
                      <span className="text-[11px] text-slate-600">{item.time}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-2">
                      <div className="text-[10px] text-slate-500 mb-0.5">Est. Wait</div>
                      <div className="text-white font-bold text-sm">~{(i+1)*3} min</div>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-red-400">Waiting</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
