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

const QUICK_ACTIONS = [
  { label: "⚡ Workflow Failure",  query: "My workflow stopped executing — no triggers firing" },
  { label: "🔌 API Timeout",       query: "API calls timing out, getting 504 gateway errors"   },
  { label: "💳 Billing Error",     query: "Payment failed and my subscription is now inactive" },
  { label: "🔐 Access Denied",     query: "Team member getting access denied on the dashboard" },
];

// ── Utilities ──────────────────────────────────────────────────────────────

function formatHistory(messages) {
  return messages
    .filter((m) => !["system", "escalation", "queue", "critical"].includes(m.from))
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
  if (values.length < 2) return (
    <div className="text-[11px] text-slate-600 text-center py-2">Not enough data yet</div>
  );
  const w = 200, h = 40, pad = 4, max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  const [hovered, setHovered] = useState(false);

  const GLOW = {
    "text-white":        "rgba(255,255,255,0.04)",
    "text-red-400":      "rgba(248,113,113,0.08)",
    "text-orange-400":   "rgba(251,146,60,0.08)",
    "text-emerald-400":  "rgba(52,211,153,0.08)",
    "text-indigo-400":   "rgba(99,102,241,0.08)",
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 cursor-default transition-all duration-300"
      style={{
        borderColor: hovered ? "rgba(99,102,241,0.25)" : undefined,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 8px 32px ${GLOW[accent] ?? "rgba(99,102,241,0.06)"}, 0 0 0 1px rgba(99,102,241,0.1)`
          : "0 1px 3px rgba(0,0,0,0.2)",
      }}>
      <div className="flex items-start justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className={`text-xl transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}>
          {icon}
        </span>
      </div>
      <div>
        <div className={`text-3xl font-bold tabular-nums transition-all duration-300 ${accent} ${hovered ? "tracking-tight" : ""}`}>
          {value}
        </div>
        {sub && (
          <div className="text-slate-500 text-xs mt-1">{sub}</div>
        )}
      </div>
    </div>
  );
}

// ── Critical alert popup ───────────────────────────────────────────────────
// FIX: Removed broken useEffect that referenced out-of-scope App state variables.
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
            <span className="text-red-400 font-bold text-sm">Operations Alert</span>
          </div>
          <button onClick={onDismiss} className="text-slate-600 hover:text-slate-300 text-lg leading-none">&times;</button>
        </div>
        <p className="text-white text-sm font-medium mb-1">Enterprise Operations Team Notified</p>
        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
          A specialist has been assigned and will follow up shortly.
        </p>
        <div className="bg-red-950 border border-red-800 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-red-400 uppercase tracking-wider mb-0.5">Queue Position</div>
            <div className="text-white font-bold text-lg">#{alert.queue_position}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Est. Response</div>
            <div className="text-slate-300 text-sm font-medium">~{alert.queue_position * 3} min</div>
          </div>
        </div>
        <div className="mt-3 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-600 rounded-full"
            style={{ animation: "shrink 6s linear", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

// ── Summary card (admin) ───────────────────────────────────────────────────

function SummaryCard({ summary }) {
  const [expanded, setExpanded] = useState(false);
  const sentCfg = SENTIMENT_CONFIG[summary.sentiment]          || SENTIMENT_CONFIG.neutral;
  const resCfg  = RESOLUTION_CONFIG[summary.resolution_status] || RESOLUTION_CONFIG["Pending"];
  const catIcon = CATEGORY_ICONS[summary.category]             || "💬";
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-lg">
            {catIcon}
          </div>
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
          <svg viewBox="0 0 24 24"
            className={`w-4 h-4 fill-current transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </div>
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${sentCfg.bg} ${sentCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sentCfg.dot}`} />{sentCfg.label}
        </span>
        <span className={`text-[11px] px-2.5 py-1 rounded-full ${PRIORITY_BADGE[summary.priority]}`}>
          {capitalize(summary.priority)}
        </span>
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
          {item.critical && (
            <span className="text-[10px] bg-red-900 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold">
              CRITICAL
            </span>
          )}
          {item.escalate && !item.critical && (
            <span className="text-[10px] bg-orange-900 text-orange-300 border border-orange-700 px-1.5 py-0.5 rounded">
              ESC
            </span>
          )}
          {item.ragUsed && <span className="text-[10px] text-indigo-400">📚</span>}
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

// ── Chat components ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sm">
        ⚡
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
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
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 text-xs">
          👤
        </div>
        <div>
          <p className="text-slate-200 text-sm font-medium">Enterprise Operations Team Notified</p>
          <p className="text-slate-500 text-xs mt-0.5">A specialist will follow up on this shortly.</p>
        </div>
      </div>
    </div>
  );
}

function CriticalNotice({ queuePos }) {
  return (
    <div className="max-w-[85%] mx-auto">
      <div className="bg-slate-900/80 border border-red-900/40 rounded-2xl px-5 py-3.5 flex items-center gap-3">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
        <div>
          <p className="text-slate-200 text-sm font-medium">
            Priority case — Enterprise Operations Team alerted
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            Queue position #{queuePos} · estimated response in {queuePos * 3} minutes
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.from === "user";

  const SOURCE_STYLE = {
    "faq.txt":           { label: "FAQ",            color: "text-indigo-400  bg-indigo-950  border-indigo-800"  },
    "workflow_failures": { label: "Workflow Fixes",  color: "text-orange-400  bg-orange-950  border-orange-800"  },
    "auth_recovery":     { label: "Auth Recovery",   color: "text-purple-400  bg-purple-950  border-purple-800"  },
    "api_timeout_fixes": { label: "API Timeouts",    color: "text-green-400   bg-green-950   border-green-800"   },
    "billing":           { label: "Billing Docs",    color: "text-blue-400    bg-blue-950    border-blue-800"    },
    "onboarding":        { label: "Onboarding",      color: "text-emerald-400 bg-emerald-950 border-emerald-800" },
  };

  function getSourceStyle(src) {
    const key = Object.keys(SOURCE_STYLE).find(k => src.toLowerCase().includes(k));
    return key ? SOURCE_STYLE[key] : { label: src, color: "text-slate-400 bg-slate-800 border-slate-700" };
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mb-0.5">U</div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mb-0.5 text-sm">⚡</div>
      )}

      <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {!isUser && <AgentBadge agentInfo={msg.agentInfo} />}

        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line
          ${isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-sm"}`}>
          {msg.text}
        </div>

        {!isUser && msg.ragUsed && msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 px-1">
            {msg.sources.map((src, i) => {
              const style = getSourceStyle(src);
              return (
                <span key={i} className={`text-[10px] px-2 py-0.5 rounded border font-mono ${style.color}`}>
                  📄 {style.label}
                </span>
              );
            })}
          </div>
        )}

        <span className="text-[10px] text-slate-700 px-1">{msg.time}</span>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0
        ${active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
    >
      {children}
    </button>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  function handleLogin(role) {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoggingIn(true);
    setTimeout(() => { setLoggingIn(false); onLogin(role); }, 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 60% 10%, #1e1b4b 0%, #0f172a 45%, #020617 100%)" }}>

      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl shadow-2xl shadow-indigo-900/60 mb-4">
            ⚡
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">SupportFlow AI</h1>
          <p className="text-slate-500 text-xs mt-1 tracking-wide">
            Enterprise Support Platform · Powered by FlowZint
          </p>
        </div>

        <div className="rounded-2xl p-7 border border-white/[0.07]"
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>

          <h2 className="text-white font-semibold text-base mb-0.5">Sign in</h2>
          <p className="text-slate-500 text-xs mb-5">Access your enterprise workspace</p>

          <div className="space-y-3 mb-5">
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">
                Work Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-800/70 border border-slate-700/80 text-slate-200
                  placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200" />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin("user")}
                className="w-full bg-slate-800/70 border border-slate-700/80 text-slate-200
                  placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200" />
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2 mb-4">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={() => handleLogin("user")} disabled={loggingIn}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
                text-white font-medium text-sm rounded-xl py-2.5 transition-all duration-200
                shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60">
              {loggingIn ? "Signing in…" : "Login as User"}
            </button>
            <button onClick={() => handleLogin("admin")} disabled={loggingIn}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60
                border border-slate-700 hover:border-slate-600
                text-slate-300 font-medium text-sm rounded-xl py-2.5 transition-all duration-200">
              Login as Admin
            </button>
          </div>

          <p className="text-slate-700 text-[10px] text-center mt-5">
            Demo build — any credentials accepted
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Human Support Modal ────────────────────────────────────────────────────

function HumanSupportModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h3 className="text-white font-semibold text-sm">Enterprise Support Team</h3>
          </div>
          <button onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">
            &times;
          </button>
        </div>

        <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-3 mb-4">
          <p className="text-indigo-300 text-xs font-medium">✅ Enterprise support team notified.</p>
          <p className="text-indigo-400 text-xs mt-0.5">Priority escalation initiated.</p>
        </div>

        <div className="space-y-3">
          <a href="mailto:contact@flowzint.in"
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700
              rounded-xl px-4 py-3 transition-colors group">
            <span className="text-base">✉️</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
              <p className="text-slate-200 text-sm group-hover:text-white transition-colors">contact@flowzint.in</p>
            </div>
          </a>

          <a href="tel:+918884397315"
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700
              rounded-xl px-4 py-3 transition-colors group">
            <span className="text-base">📞</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Phone</p>
              <p className="text-slate-200 text-sm group-hover:text-white transition-colors">+91 8884397315</p>
            </div>
          </a>

          <a href="https://flowzint.in/fz/contact.html" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700
              rounded-xl px-4 py-3 transition-colors group">
            <span className="text-base">🌐</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Support Portal</p>
              <p className="text-slate-200 text-sm group-hover:text-white transition-colors">flowzint.in/fz/contact.html</p>
            </div>
          </a>
        </div>

        <button onClick={onClose}
          className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700
            text-slate-400 text-sm rounded-xl py-2.5 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Live System Status Panel ───────────────────────────────────────────────

const SYSTEM_SERVICES = [
  { key: "workflow", label: "Workflow Engine",  baseLatency: 42  },
  { key: "api",      label: "API Gateway",      baseLatency: 18  },
  { key: "queue",    label: "Queue Service",    baseLatency: 91  },
  { key: "rag",      label: "RAG Knowledge",    baseLatency: 63  },
  { key: "llm",      label: "Groq LLM",         baseLatency: 210 },
];

function useFluctuate(base, range = 15, interval = 3000) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(() => {
      setVal(base + Math.floor((Math.random() - 0.5) * range * 2));
    }, interval + Math.random() * 1000);
    return () => clearInterval(t);
  }, [base, range, interval]);
  return val;
}

function StatusDot({ healthy = true }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60
        ${healthy ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2
        ${healthy ? "bg-emerald-400" : "bg-red-500"}`} />
    </span>
  );
}

function ServiceRow({ label, baseLatency }) {
  const latency = useFluctuate(baseLatency, 20, 2500);
  const healthy = latency < 300;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0 group">
      <div className="flex items-center gap-2.5">
        <StatusDot healthy={healthy} />
        <span className="text-slate-400 text-xs group-hover:text-slate-200 transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000
              ${latency < 100 ? "bg-emerald-500" : latency < 200 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${Math.min((latency / 300) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-[11px] font-mono w-14 text-right tabular-nums
          ${latency < 100 ? "text-emerald-400" : latency < 200 ? "text-yellow-400" : "text-red-400"}`}>
          {latency}ms
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border
          ${healthy
            ? "bg-emerald-950 border-emerald-800 text-emerald-400"
            : "bg-red-950 border-red-800 text-red-400"}`}>
          {healthy ? "OK" : "SLOW"}
        </span>
      </div>
    </div>
  );
}

function SystemStatusPanel() {
  const [uptime]   = useState((99.1 + Math.random() * 0.8).toFixed(2));
  const [active]   = useState(Math.floor(Math.random() * 40) + 60);
  const [lastScan, setLastScan] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setLastScan(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6"
      style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.06), 0 4px 24px rgba(0,0,0,0.3)" }}>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
            <span className="text-xs">🟢</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm leading-none">System Status</h3>
            <p className="text-slate-600 text-[10px] mt-0.5">
              Last scan {lastScan.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-emerald-400 font-bold text-sm">{uptime}%</div>
            <div className="text-slate-600 text-[10px]">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-indigo-400 font-bold text-sm">{active}</div>
            <div className="text-slate-600 text-[10px]">Active flows</div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] bg-emerald-950 border border-emerald-800
            text-emerald-400 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            All systems operational
          </span>
        </div>
      </div>

      <div>
        {SYSTEM_SERVICES.map(s => <ServiceRow key={s.key} {...s} />)}
      </div>
    </div>
  );
}

// ── AI Thinking Panel ──────────────────────────────────────────────────────

const THINKING_STEPS = [
  "Classifying intent...",
  "Routing to specialist agent...",
  "Scanning knowledge base...",
  "Analyzing operational context...",
  "Composing enterprise response...",
];

function AIThinkingPanel() {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStep(s => (s + 1) % THINKING_STEPS.length);
        setFade(true);
      }, 200);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 text-sm relative"
        style={{ background: "rgba(30,30,50,0.9)", border: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}>
        ⚡
        <span className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: "rgba(99,102,241,0.4)" }} />
      </div>

      <div className="rounded-2xl rounded-bl-sm px-4 py-3 border"
        style={{
          background: "rgba(15,23,42,0.9)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 0 20px rgba(99,102,241,0.08)",
        }}>
        <p className="text-xs font-medium transition-opacity duration-200 mb-2"
          style={{ color: fade ? "rgba(165,180,252,0.9)" : "transparent", minWidth: "180px" }}>
          {THINKING_STEPS[step]}
        </p>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i}
              className={`h-0.5 rounded-full transition-all duration-500
                ${i <= step ? "bg-indigo-500" : "bg-slate-700"}`}
              style={{ width: i <= step ? "16px" : "8px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const DEMO_CACHE = {
  "my scheduled workflow stopped executing overnight": {
    reply: "Workflow execution failure detected at scheduled trigger layer.\n\n• Navigate to Workflows > Execution History — check the failed step and error code\n• Verify webhook endpoint returns HTTP 200 within 5 seconds\n• Confirm schedule timezone is set to UTC (IST = UTC +5:30)\n• Check if retry policy is enabled under Workflow Settings > Error Handling\n\nIf execution logs show no step-level error, escalate to FlowZint support at contact@flowzint.in with your Workflow ID.",
    agent: { agent: "Workflow Automation AI", department: "Automation & Workflows", emoji: "⚡", color: "orange" },
    sources: ["faq.txt"],
  },
  "login nahi ho raha, otp bhi nahi aa raha": {
    reply: "Login failure aur OTP delivery issue detect hua — dono ek saath ho rahe hain.\n\n• OTP ke liye registered email aur spam folder check karein\n• 5 baar galat password try kiya toh account 30 minutes ke liye lock hoga — wait karein\n• 2FA device lost hai toh contact@flowzint.in par email karein account verification ke saath\n• SSO use kar rahe hain toh apne IT admin se identity provider configuration verify karwayein\n\nTurant help ke liye: contact@flowzint.in | +91 8884397315",
    agent: { agent: "Platform Access AI", department: "Platform & Access", emoji: "🔐", color: "purple" },
    sources: ["faq.txt"],
  },
};

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {

  const [tab, setTab] = useState("chat");
  const [role, setRole] = useState(null);
  const [showHumanSupport, setShowHumanSupport] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 0,
      from: "bot",
      agentInfo: null,
      text: "SupportFlow AI — enterprise operational support for FlowZint workflows, integrations, billing, and platform systems.\n\nDescribe an issue or select a support scenario below.",
      time: now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadingSteps = [
    "⚡ Analyzing workflow logs...",
    "🔍 Checking escalation risk...",
    "📚 Searching knowledge base...",
    "🔌 Validating integrations..."
  ];
  const [loadingStep, setLoadingStep] = useState(0);

  const [error, setError] = useState(null);
  const [ticketLog, setTicketLog] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [trendPoints, setTrendPoints] = useState([0]);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [escalationQueue, setEscalationQueue] = useState([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Loading step cycling
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Analytics ──────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const total      = ticketLog.length;
    const escalated  = ticketLog.filter(t => t.escalate).length;
    const critical   = ticketLog.filter(t => t.critical).length;
    const kbUsed     = ticketLog.filter(t => t.ragUsed).length;
    const escRate    = total ? Math.round((escalated / total) * 100) : 0;
    const aiResolved = total ? Math.round(((total - escalated) / total) * 100) : 0;

    const sentimentCounts = { angry: 0, frustrated: 0, neutral: 0, positive: 0 };
    ticketLog.forEach(t => {
      if (sentimentCounts[t.sentiment] !== undefined) sentimentCounts[t.sentiment]++;
    });
    const sentimentBars = Object.entries(sentimentCounts).map(([k, v]) => ({
      label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar,
    }));
    const donutData = Object.entries(sentimentCounts).map(([k, v]) => ({
      label: SENTIMENT_CONFIG[k].label, value: v, color: SENTIMENT_CONFIG[k].bar,
    }));

    const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    ticketLog.forEach(t => {
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });
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

    // Demo cache
    const cached = DEMO_CACHE[text.toLowerCase().trim()];
    if (cached) {
      const t = now();
      const userMsg = { id: Date.now(), from: "user", text, time: t };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        const botMsg = {
          id: Date.now() + 1,
          from: "bot",
          text: cached.reply,
          time: now(),
          agentInfo: cached.agent,
          ragUsed: true,
          sources: cached.sources,
        };
        setMessages(prev => [...prev, botMsg]);
        setTicketLog(prev => [...prev, {
          ticket_id: `SF-${Math.floor(Math.random() * 9000) + 1000}`,
          sentiment: "neutral",
          priority: "medium",
          escalate: false,
          critical: false,
          message: text,
          time: t,
          ragUsed: true,
        }]);
        inputRef.current?.focus();
      }, 900);
      return;
    }

    // Backend flow
    const t = now();
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

      const data = await res.json();
      const ticket = data.ticket;

      const botMsg = {
        id: Date.now() + 1,
        from: "bot",
        text: data.reply,
        time: now(),
        agentInfo: data.agent_info ?? null,
        ragUsed: data.rag_used ?? false,
        sources: data.rag_used ? ["faq.txt"] : [],
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

      if (data.model !== "static") {
        setTicketLog(prev => [...prev, { ...ticket, message: text, time: t, ragUsed: data.rag_used ?? false }]);

        if (data.summary?.issue) {
          setSummaries(prev => [data.summary, ...prev]);
        }

        if (ticket?.critical) {
          setCriticalAlert({ ticket_id: ticket.ticket_id, queue_position: ticket.queue_position });
          setEscalationQueue(prev => [{
            ...ticket, message: text, time: t,
            agent: data.agent_info?.agent ?? "Enterprise Support AI",
          }, ...prev]);
        }

        setTrendPoints(prev => [...prev, ticket?.escalate ? 1 : 0].slice(-12));
      }
    } catch (err) {
      setError(err.message || "Could not reach backend.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // FIX: handleKeyDown and clearChat moved inside App component
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        id: 0,
        from: "bot",
        agentInfo: null,
        text: "SupportFlow AI — enterprise operational support for FlowZint workflows, integrations, billing, and platform systems.\n\nDescribe an issue or select a support scenario below.",
        time: now(),
      },
    ]);
    setError(null);
  }

  // Show login if no role
  if (!role) {
    return <LoginScreen onLogin={(r) => setRole(r)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">

      {/* Critical alert popup */}
      {criticalAlert && (
        <CriticalAlert alert={criticalAlert} onDismiss={() => setCriticalAlert(null)} />
      )}

      {/* Human support modal */}
      {showHumanSupport && (
        <HumanSupportModal onClose={() => setShowHumanSupport(false)} />
      )}

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-40 shrink-0">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-base shadow-lg shadow-indigo-900/50">
              ⚡
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none">SupportFlow AI</h1>
              <p className="text-slate-600 text-[10px] mt-0.5">FlowZint Enterprise · Operational Intelligence</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">

            {/* Human support button */}
            <button
              onClick={() => setShowHumanSupport(true)}
              className="hidden sm:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg
                bg-slate-800 border border-slate-700 text-slate-400
                hover:border-indigo-500/50 hover:text-slate-200 transition-all duration-200">
              👤 Human Support
            </button>

            {/* Clear chat */}
            <button
              onClick={clearChat}
              className="hidden sm:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg
                bg-slate-800 border border-slate-700 text-slate-400
                hover:border-slate-600 hover:text-slate-200 transition-all duration-200">
              🗑 Clear
            </button>

            {/* Online indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Online</span>
            </div>

            {/* Role badge */}
            <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium
              ${role === "admin"
                ? "bg-indigo-950 border-indigo-800 text-indigo-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
              }`}>
              {role === "admin" ? "⚙ Admin" : "👤 User"}
            </span>

            {/* Sign out */}
            <button
              onClick={() => setRole(null)}
              className="text-slate-600 hover:text-slate-400 text-[11px] transition-colors">
              Sign out
            </button>

          </div>
        </div>

        {/* Tab bar */}
        <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
            💬 Support Chat
          </TabBtn>

          {role === "admin" && (
            <>
              <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
                📊 Analytics
                {analytics.total > 0 && (
                  <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {analytics.total}
                  </span>
                )}
              </TabBtn>

              <TabBtn active={tab === "summaries"} onClick={() => setTab("summaries")}>
                📋 Summaries
                {summaries.length > 0 && (
                  <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {summaries.length}
                  </span>
                )}
              </TabBtn>

              <TabBtn active={tab === "queue"} onClick={() => setTab("queue")}>
                🚨 Queue
                {escalationQueue.length > 0 && (
                  <span className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                    {escalationQueue.length}
                  </span>
                )}
              </TabBtn>
            </>
          )}
        </div>
      </header>

      {/* ══ CHAT TAB ═════════════════════════════════════════════ */}
      {tab === "chat" && (
        <div className="flex flex-1 flex-col overflow-hidden" style={{ height: "calc(100vh - 112px)" }}>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-4 sm:py-6 space-y-4">
            <div className="max-w-2xl mx-auto w-full space-y-4">

              {messages.map((msg) => {
                if (msg.from === "escalation") return <EscalationNotice key={`esc-${msg.time}`} />;
                if (msg.from === "critical")   return <CriticalNotice key={`crit-${msg.ticket?.ticket_id}`} queuePos={msg.ticket?.queue_position ?? 1} />;
                return <ChatMessage key={msg.id} msg={msg} />;
              })}

              {loading && <AIThinkingPanel />}

              {error && (
                <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                  <span className="text-red-400">⚠</span>
                  <span><strong>Connection error:</strong> {error} — Is FastAPI running on port 8000?</span>
                </div>
              )}

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

          {/* Input pinned to bottom */}
          <div className="border-t border-slate-800/60 bg-slate-950 px-4 md:px-8 py-3.5 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-wrap gap-2 mb-3">
                {["Workflow failed overnight", "API integration timeout", "Dashboard access denied", "Subscription renewal failed"].map((item) => (
                  <button key={item} onClick={() => setInput(item)}
                    className="rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1.5 transition">
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-3 bg-slate-900 border border-slate-700/60
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
                    disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl
                    flex items-center justify-center transition-colors duration-200 shadow-lg shadow-indigo-900/30">
                  {loading
                    ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                    : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
                      </svg>
                  }
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} onClick={() => sendMessage(action.query)} disabled={loading}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700/60
                      bg-slate-900/60 text-slate-500 hover:text-slate-200 hover:border-indigo-500/40
                      hover:bg-slate-800/60 transition-all duration-200 disabled:opacity-30">
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══ ANALYTICS TAB ════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <SystemStatusPanel />
          {analytics.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-1">No data yet</h3>
              <p className="text-slate-500 text-sm">Send messages in Support Chat to populate analytics.</p>
              <button onClick={() => setTab("chat")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                Open Chat →
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Operations Center</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard label="Operational Incidents"  value={analytics.total}            sub="This session"           accent="text-white"       icon="🎫" />
                  <StatCard label="Priority Investigations" value={analytics.critical}         sub="Human queue triggered"  accent="text-red-400"     icon="🚨" />
                  <StatCard label="Escalation Rate"        value={`${analytics.escRate}%`}    sub={`${analytics.escalated} escalated`} accent="text-orange-400" icon="⚡" />
                  <StatCard label="AI Resolution Success"  value={`${analytics.aiResolved}%`} sub="Resolved by AI"         accent="text-emerald-400" icon="✅" />
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
                  <p className="text-slate-600 text-[11px] mb-4">Last {trendPoints.length} interactions</p>
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
                <div className="bg-slate-900 border border-red-900/60 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <h3 className="text-white font-semibold text-sm">Escalation Queue</h3>
                      <span className="text-xs bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                        {escalationQueue.length} active
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {escalationQueue.map((item, i) => (
                      <div key={item.ticket_id}
                        className="bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3 flex items-center gap-4">
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
                  <h3 className="text-white font-semibold text-sm">Operational Activity Stream</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[11px]">Live</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {[...ticketLog].reverse().map(t => <ActivityItem key={t.ticket_id} item={t} />)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "KB Assisted",   value: analytics.kbUsed,                                         color: "text-indigo-400",  icon: "📚" },
                  { label: "Auto-Resolved", value: analytics.total - analytics.escalated,                    color: "text-emerald-400", icon: "🤖" },
                  { label: "Priority Cases",      value: analytics.critical,                                       color: "text-red-400",     icon: "🚨" },
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
              <button onClick={() => setTab("chat")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                Start Chat →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total",     value: summaries.length,                                                    color: "text-white",       icon: "📋" },
                  { label: "Escalated", value: summaries.filter(s => s.resolution_status === "Escalated").length,   color: "text-red-400",     icon: "⚡" },
                  { label: "Resolved",  value: summaries.filter(s => s.resolution_status === "Resolved").length,    color: "text-emerald-400", icon: "✅" },
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
            <h2 className="text-white font-bold text-lg">Enterprise Operations Queue</h2>
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
                <div key={item.ticket_id}
                  className="bg-slate-900 border border-red-800/60 rounded-2xl p-5 flex items-start gap-4">
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
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[item.priority]}`}>
                        {item.priority}
                      </span>
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
