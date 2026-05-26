import { useState, useRef, useEffect, useMemo } from "react";

const API_URL = "http://127.0.0.1:8000/api/chat/";

// ── Sentiment config ───────────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  angry:      { label: "Angry",      color: "text-red-400",     bg: "bg-red-950 border-red-800",       dot: "bg-red-400",     bar: "#f87171" },
  frustrated: { label: "Frustrated", color: "text-orange-400",  bg: "bg-orange-950 border-orange-800", dot: "bg-orange-400",  bar: "#fb923c" },
  neutral:    { label: "Neutral",    color: "text-slate-400",   bg: "bg-slate-800 border-slate-700",   dot: "bg-slate-400",   bar: "#94a3b8" },
  positive:   { label: "Positive",   color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800",dot: "bg-emerald-400", bar: "#34d399" },
};

const PRIORITY_BADGE = {
  
  critical: "bg-red-900 text-red-300 border border-red-700",
  high:     "bg-orange-900 text-orange-300 border border-orange-700",
  medium:   "bg-slate-700 text-slate-300 border border-slate-600",
  low:      "bg-emerald-900 text-emerald-300 border border-emerald-700",
};
const AGENT_COLORS = {

  blue: {
    bg: "bg-blue-950 border-blue-800",
    text: "text-blue-400",
  },

  orange: {
    bg: "bg-orange-950 border-orange-800",
    text: "text-orange-400",
  },

  purple: {
    bg: "bg-purple-950 border-purple-800",
    text: "text-purple-400",
  },

  green: {
    bg: "bg-emerald-950 border-emerald-800",
    text: "text-emerald-400",
  },

  slate: {
    bg: "bg-slate-800 border-slate-700",
    text: "text-slate-400",
  },

};

// ── Utility ────────────────────────────────────────────────────────────────

function formatHistory(messages) {
  return messages
    .filter((m) => m.from !== "system" && m.from !== "escalation")
    .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Mini chart: horizontal bar ─────────────────────────────────────────────

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
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mini donut chart (SVG) ─────────────────────────────────────────────────

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 36, cx = 44, cy = 44, stroke = 12;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const slices = data.map((d) => {
    const pct   = d.value / total;
    const dash  = pct * circumference;
    const slice = { ...d, dash, gap: circumference - dash, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="88" height="88" className="shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {slices.map((s) => (
          <circle
            key={s.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
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

// ── Sparkline (SVG mini line chart) ───────────────────────────────────────

function Sparkline({ values, color = "#6366f1" }) {
  if (values.length < 2) {
    return <div className="text-[11px] text-slate-600 text-center py-2">Not enough data yet</div>;
  }
  const w = 200, h = 40, pad = 4;
  const max = Math.max(...values, 1);
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

// ── Stat card ──────────────────────────────────────────────────────────────

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

// ── Activity feed item ─────────────────────────────────────────────────────

function ActivityItem({ item }) {
  const cfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-indigo-400">{item.ticket_id}</span>
          {item.escalate && (
            <span className="text-[10px] bg-red-900 text-red-300 border border-red-700 px-1.5 py-0.5 rounded">
              ESCALATED
            </span>
          )}
          {item.ragUsed && <span className="text-[10px] text-indigo-400">📚 KB</span>}
        </div>
        <p className="text-xs text-slate-400 truncate">{item.message}</p>
        <span className="text-[10px] text-slate-600">{item.time}</span>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_BADGE[item.priority]}`}>
        {item.priority}
      </span>
    </div>
  );
}

// ── Chat sub-components ────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AgentBadge({ agentInfo }) {

  if (!agentInfo?.agent) return null;

  const colors =
    AGENT_COLORS[agentInfo.color] || AGENT_COLORS.slate;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs mb-2 ${colors.bg}`}
    >

      <span className="text-base leading-none">
        {agentInfo.emoji}
      </span>

      <div>
        <span className={`font-semibold ${colors.text}`}>
          {agentInfo.agent}
        </span>

        <span className="text-slate-500 ml-1.5">
          · {agentInfo.department}
        </span>
      </div>

    </div>
  );
}

function Avatar({ from }) {
  return from === "user" ? (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      U
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-400 fill-current">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1H5v1M3 16h18v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2z" />
      </svg>
    </div>
  );
}

function EscalationBanner({ ticketId, sentiment, priority }) {

  const cfg =
    SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cfg.bg} mx-1`}>

      <div className="flex items-center gap-2 mb-1.5">
        <span>⚠️</span>

        <span className="font-semibold text-white">
          Escalation Required
        </span>

        <span
          className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-md ${PRIORITY_BADGE[priority]}`}
        >
          {priority.toUpperCase()}
        </span>
      </div>

      <p className={`text-xs ${cfg.color} mb-1`}>
        Sentiment detected: <strong>{cfg.label}</strong>
      </p>

      <p className="text-xs text-slate-400">
        Flagged for human agent review.
      </p>

      <div className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-2">
        <span className="text-xs text-slate-500">
          Ticket ID:
        </span>

        <span className="text-xs font-mono text-indigo-400 font-semibold">
          {ticketId}
        </span>
      </div>
    </div>
  );
}

function TicketPill({ ticket, ragUsed }) {

  const cfg =
    SENTIMENT_CONFIG[ticket.sentiment] || SENTIMENT_CONFIG.neutral;

  return (
    <div className="flex items-center gap-2 mt-1.5 ml-1 flex-wrap">

      <span className="text-[10px] font-mono text-slate-600">
        {ticket.ticket_id}
      </span>

      <span
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
        />

        {cfg.label}
      </span>

      <span
        className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[ticket.priority]}`}
      >
        {ticket.priority}
      </span>

      {ragUsed && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700">
          📚 KB
        </span>
      )}
    </div>
  );
}

function ChatMessage({ msg }) {

  const isUser = msg.from === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      <Avatar from={msg.from} />

      <div className="flex flex-col max-w-[75%]">

        {!isUser && (
          <AgentBadge agentInfo={msg.agentInfo} />
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
          ${isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"}`}
        >

          {msg.text}

          <div
            className={`text-[10px] mt-1.5 ${
              isUser
                ? "text-indigo-300 text-right"
                : "text-slate-500"
            }`}
          >
            {msg.time}
          </div>

        </div>

        {!isUser && msg.ticket && (
          <TicketPill
            ticket={msg.ticket}
            ragUsed={msg.ragUsed}
          />
        )}

      </div>
    </div>
  );
}
// ── Tab button ─────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
        ${active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
    >
      {children}
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("chat"); // "chat" | "dashboard"
  const [messages, setMessages] = useState([{
    id: 0, from: "bot", ragUsed: false, ticket: null,
    text: "Hi! I'm SupportFlow AI. How can I help you today?",
    time: now(),
  }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [ticketLog, setTicketLog] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [summaries, setSummaries] = useState([]);

  // Escalation trend: count per-message (last 10)
  const [trendPoints, setTrendPoints] = useState([0]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Derived analytics ──────────────────────────────────────────

  const analytics = useMemo(() => {
    const total      = ticketLog.length;
    const escalated  = ticketLog.filter((t) => t.escalate).length;
    const critical   = ticketLog.filter((t) => t.priority === "critical").length;
    const kbUsed     = ticketLog.filter((t) => t.ragUsed).length;
    const escRate    = total ? Math.round((escalated / total) * 100) : 0;
    const aiResolved = total ? Math.round(((total - escalated) / total) * 100) : 0;

    const sentimentCounts = { angry: 0, frustrated: 0, neutral: 0, positive: 0 };
    ticketLog.forEach((t) => { if (sentimentCounts[t.sentiment] !== undefined) sentimentCounts[t.sentiment]++; });

    const sentimentBars = Object.entries(sentimentCounts).map(([k, v]) => ({
      label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar,
    }));

    const donutData = Object.entries(sentimentCounts).map(([k, v]) => ({
      label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar,
    }));

    const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    ticketLog.forEach((t) => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
    const priorityBars = [
      { label: "Critical", value: priorityCounts.critical, color: "#f87171" },
      { label: "High",     value: priorityCounts.high,     color: "#fb923c" },
      { label: "Medium",   value: priorityCounts.medium,   color: "#94a3b8" },
      { label: "Low",      value: priorityCounts.low,      color: "#34d399" },
    ];

    return { total, escalated, critical, kbUsed, escRate, aiResolved, sentimentBars, donutData, priorityBars };
  }, [ticketLog]);

  // ── Send message ───────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const t      = now();
    const userMsg = { id: Date.now(), from: "user", text, time: t, ticket: null, ragUsed: false };
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
      if (data.summary) {
  setSummaries((prev) => [data.summary, ...prev]);
}
      const ticket = data.ticket;

      const botMsg = {
        id: Date.now() + 1, from: "bot",
        text: data.reply,
        time: now(),
        ticket,
        ragUsed: data.rag_used ?? false,
        agentInfo: data.agent_info ?? null,
      };

      const newMsgs = ticket?.escalate
        ? [...updated, { id: Date.now() + 2, from: "escalation", ticket, text: "", time: t }, botMsg]
        : [...updated, botMsg];

      setMessages(newMsgs);

      const entry = { ...ticket, message: text, time: t, ragUsed: data.rag_used ?? false };
      setTicketLog((prev) => [...prev, entry]);

      // Update escalation trend (keep last 12 points)
      setTrendPoints((prev) => {
        const next = [...prev, ticket?.escalate ? 1 : 0];
        return next.slice(-12);
      });

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
      id: 0, from: "bot", ragUsed: false, ticket: null,
      text: "Hi! I'm SupportFlow AI. How can I help you today?",
      time: now(),
    }]);
    setError(null);
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ══ HERO HEADER ══════════════════════════════════════════════ */}
      <header className="border-b border-slate-800 bg-slate-950">
        {/* Top brand bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1H5v1M3 16h18v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-tight">SupportFlow AI</h1>
              <p className="text-slate-500 text-[11px]">Enterprise Support Intelligence Platform</p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="hidden md:flex items-center gap-2">
            {["🧠 Sentiment AI", "📚 RAG Knowledge", "🎫 Auto Tickets", "⚡ Live Escalation"].map((b) => (
              <span key={b} className="text-[11px] px-2.5 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-400">
                {b}
              </span>
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Live</span>
          </div>
        </div>

    {/* Tab nav */}
<div className="px-6 pb-3 flex items-center gap-2">
  <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
    💬 Chat
  </TabBtn>

  <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
    📊 Analytics
    {analytics.total > 0 && (
      <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
        {analytics.total}
      </span>
    )}
  </TabBtn>

  <TabBtn
    active={tab === "summaries"}
    onClick={() => setTab("summaries")}
  >
    📝 Summaries
  </TabBtn>
</div>
      </header>

      {/* ══ CHAT VIEW ════════════════════════════════════════════════ */}
      {tab === "chat" && (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 112px)" }}>

          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
              <div className="px-4 py-4 border-b border-slate-800">
                <h2 className="text-white font-semibold text-sm">Ticket Log</h2>
                <p className="text-slate-500 text-xs mt-0.5">{ticketLog.length} tickets this session</p>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-800">
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-red-400 font-bold text-lg">{analytics.escalated}</div>
                  <div className="text-slate-500 text-[10px]">Escalated</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-orange-400 font-bold text-lg">{analytics.critical}</div>
                  <div className="text-slate-500 text-[10px]">Critical</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-indigo-400 font-bold text-lg">{analytics.kbUsed}</div>
                  <div className="text-slate-500 text-[10px]">KB Used</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {ticketLog.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center mt-8">Ticket activity will appear here.</p>
                ) : (
                  [...ticketLog].reverse().map((t) => {
                    const cfg = SENTIMENT_CONFIG[t.sentiment] || SENTIMENT_CONFIG.neutral;
                    return (
                      <div key={t.ticket_id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-indigo-400">{t.ticket_id}</span>
                          <div className="flex gap-1.5 items-center">
                            {t.ragUsed && <span className="text-[10px] text-indigo-400">📚</span>}
                            {t.escalate && <span className="text-[10px] text-red-400 font-semibold">ESC</span>}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-1.5">{t.message}</p>
                        <div className="flex gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Chat panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setSidebarOpen((v) => !v)}
                  className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                  </svg>
                </button>
                <span className="text-slate-400 text-xs">
                  {messages.filter((m) => m.from === "user").length} messages sent
                </span>
              </div>
              <button onClick={clearChat}
                className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                Clear
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {messages.map((msg) => {
                if (msg.from === "escalation") {
                  return <EscalationBanner key={`esc-${msg.ticket.ticket_id}`}
                    ticketId={msg.ticket.ticket_id} sentiment={msg.ticket.sentiment} priority={msg.ticket.priority} />;
                }
                return <ChatMessage key={msg.id} msg={msg} />;
              })}
              {loading && (
                <div className="flex gap-3">
                  <Avatar from="bot" />
                  <div className="flex flex-col gap-1">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm">
                      <TypingDots />
                    </div>
                    <span className="text-[11px] text-slate-500 ml-1">SupportFlow AI is typing...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <div><span className="font-medium">Connection error: </span>{error}
                    <span className="text-red-400"> — Is FastAPI running on port 8000?</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-slate-800 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Try: "What is your return policy?" or "I am furious, my order never arrived!"'
                  rows={1} disabled={loading}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500
                    rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500
                    focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 max-h-32"
                  style={{ fieldSizing: "content" }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className="shrink-0 w-11 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700
                    disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg">
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-slate-600 text-[11px] text-center mt-2.5">
                Enter to send · Sentiment AI · RAG Knowledge Base · Auto Escalation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ DASHBOARD VIEW ═══════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {analytics.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-1">No data yet</h3>
              <p className="text-slate-500 text-sm">Go to Chat and send a few messages to start seeing analytics.</p>
              <button onClick={() => setTab("chat")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                Open Chat →
              </button>
            </div>
          ) : (
            <>
              {/* ── KPI cards ── */}
              <div>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Key Metrics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Tickets"   value={analytics.total}       sub="This session"           accent="text-white"        icon="🎫" />
                  <StatCard label="Critical Cases"  value={analytics.critical}    sub="Highest priority"       accent="text-red-400"      icon="🔴" />
                  <StatCard label="Escalation Rate" value={`${analytics.escRate}%`} sub={`${analytics.escalated} escalated`} accent="text-orange-400" icon="⚡" />
                  <StatCard label="AI Resolution"   value={`${analytics.aiResolved}%`} sub="Resolved without agent" accent="text-emerald-400" icon="✅" />
                </div>
              </div>

              {/* ── Charts row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Sentiment donut */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Sentiment Distribution</h3>
                  <DonutChart data={analytics.donutData} />
                </div>

                {/* Priority breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Priority Breakdown</h3>
                  <BarChart data={analytics.priorityBars} />
                </div>

                {/* Escalation trend */}
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

              {/* ── Sentiment bars full width ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Sentiment Volume</h3>
                <BarChart data={analytics.sentimentBars} />
              </div>

              {/* ── Live activity feed ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Live Activity Feed</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[11px]">Live</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {[...ticketLog].reverse().map((t) => (
                    <ActivityItem key={t.ticket_id} item={t} />
                  ))}
                </div>
              </div>

              {/* ── Summary row ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "KB Assisted",   value: analytics.kbUsed,                         color: "text-indigo-400", icon: "📚" },
                  { label: "Auto-Resolved", value: analytics.total - analytics.escalated,     color: "text-emerald-400",icon: "🤖" },
                  { label: "Angry Cases",   value: ticketLog.filter(t=>t.sentiment==="angry").length,  color: "text-red-400",    icon: "😠" },
                  { label: "Positive",      value: ticketLog.filter(t=>t.sentiment==="positive").length,color: "text-emerald-400",icon: "😊" },
                ].map((s) => (
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
      {tab === "summaries" && (
  <div className="flex-1 overflow-y-auto bg-slate-950 p-6">

    <h1 className="text-2xl font-bold text-white mb-6">
      📝 AI Conversation Summaries
    </h1>

    {summaries.length === 0 ? (
      <div className="text-slate-500">
        No conversation summaries yet.
      </div>
    ) : (
      <div className="space-y-4">

        {summaries.map((summary, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
          >

            <div className="flex items-center justify-between mb-4">
              <span className="text-indigo-400 font-mono">
                {summary.ticket_id}
              </span>

              <span className="px-3 py-1 rounded-full text-xs bg-red-900 text-red-300">
                {summary.priority}
              </span>
            </div>

            <div className="space-y-3">

              <div>
                <p className="text-slate-500 text-xs uppercase">
                  Issue
                </p>

                <p className="text-white">
                  {summary.issue}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-slate-500 text-xs uppercase">
                    Category
                  </p>

                  <p className="text-slate-300">
                    {summary.category}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs uppercase">
                    Sentiment
                  </p>

                  <p className="text-slate-300">
                    {summary.sentiment}
                  </p>
                </div>

              </div>

              <div>
                <p className="text-slate-500 text-xs uppercase">
                  Action Taken
                </p>

                <p className="text-slate-300">
                  {summary.action_taken}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-xs uppercase">
                  Resolution Status
                </p>

                <p className="text-emerald-400">
                  {summary.resolution_status}
                </p>
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
