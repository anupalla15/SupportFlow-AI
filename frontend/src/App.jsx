import { useState, useRef, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000/api/chat/";

// ── Sentiment config ───────────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  angry: {
    label: "Angry",
    color: "text-red-400",
    bg: "bg-red-950 border-red-800",
    dot: "bg-red-400",
    icon: "🔴",
  },
  frustrated: {
    label: "Frustrated",
    color: "text-orange-400",
    bg: "bg-orange-950 border-orange-800",
    dot: "bg-orange-400",
    icon: "🟠",
  },
  neutral: {
    label: "Neutral",
    color: "text-slate-400",
    bg: "bg-slate-800 border-slate-700",
    dot: "bg-slate-400",
    icon: "⚪",
  },
  positive: {
    label: "Positive",
    color: "text-emerald-400",
    bg: "bg-emerald-950 border-emerald-800",
    dot: "bg-emerald-400",
    icon: "🟢",
  },
};

const PRIORITY_BADGE = {
  critical: "bg-red-900 text-red-300 border border-red-700",
  high:     "bg-orange-900 text-orange-300 border border-orange-700",
  medium:   "bg-slate-700 text-slate-300 border border-slate-600",
  low:      "bg-emerald-900 text-emerald-300 border border-emerald-700",
};

// ── Small components ───────────────────────────────────────────────────────

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
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cfg.bg} mx-1`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">⚠️</span>
        <span className="font-semibold text-white">Escalation Required</span>
        <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-md ${PRIORITY_BADGE[priority]}`}>
          {priority.toUpperCase()}
        </span>
      </div>
      <p className={`text-xs ${cfg.color} mb-1`}>
        Sentiment detected: <strong>{cfg.label}</strong>
      </p>
      <p className="text-xs text-slate-400">
        This conversation has been flagged for human agent review.
      </p>
      <div className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-2">
        <span className="text-xs text-slate-500">Ticket ID:</span>
        <span className="text-xs font-mono text-indigo-400 font-semibold">{ticketId}</span>
      </div>
    </div>
  );
}

// ── CHANGE 1: added ragUsed prop and 📚 KB badge ──────────────────────────
function TicketPill({ ticket, ragUsed }) {
  const cfg = SENTIMENT_CONFIG[ticket.sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <div className="flex items-center gap-2 mt-1.5 ml-1 flex-wrap">
      <span className="text-[10px] font-mono text-slate-600">{ticket.ticket_id}</span>
      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[ticket.priority]}`}>
        {ticket.priority}
      </span>
      {/* KB badge — only shows when FAQ context was used */}
      {ragUsed && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700">
          📚 KB
        </span>
      )}
    </div>
  );
}

// ── CHANGE 3: pass ragUsed into TicketPill ────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.from === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar from={msg.from} />
      <div className="flex flex-col max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
            ${isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
            }`}
        >
          {msg.text}
          <div className={`text-[10px] mt-1.5 ${isUser ? "text-indigo-300 text-right" : "text-slate-500"}`}>
            {msg.time}
          </div>
        </div>
        {!isUser && msg.ticket && (
          <TicketPill ticket={msg.ticket} ragUsed={msg.ragUsed} />
        )}
      </div>
    </div>
  );
}

// ── Sidebar ticket log ─────────────────────────────────────────────────────

function TicketLog({ tickets }) {
  if (tickets.length === 0) return (
    <div className="text-slate-600 text-xs text-center mt-8 px-4">
      Ticket activity will appear here as customers chat.
    </div>
  );

  return (
    <div className="space-y-2 overflow-y-auto flex-1">
      {[...tickets].reverse().map((t) => {
        const cfg = SENTIMENT_CONFIG[t.sentiment] || SENTIMENT_CONFIG.neutral;
        return (
          <div key={t.ticket_id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-indigo-400">{t.ticket_id}</span>
              <div className="flex items-center gap-1.5">
                {t.ragUsed && (
                  <span className="text-[10px] text-indigo-400">📚</span>
                )}
                {t.escalate && (
                  <span className="text-[10px] text-red-400 font-semibold">ESCALATED</span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 truncate mb-1.5">{t.message}</p>
            <div className="flex gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[t.priority]}`}>
                {t.priority}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── History formatter ──────────────────────────────────────────────────────

function formatHistory(messages) {
  return messages
    .filter((m) => m.from !== "system" && m.from !== "escalation")
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 0,
      from: "bot",
      text: "Hi! I'm SupportFlow AI. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ticket: null,
      ragUsed: false,
    },
  ]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [ticketLog, setTicketLog]     = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const time    = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { id: Date.now(), from: "user", text, time, ticket: null, ragUsed: false };
    const updated = [...messages, userMsg];

    setMessages(updated);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: formatHistory(updated),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data   = await res.json();
      const ticket = data.ticket;

      // ── CHANGE 2: store ragUsed on botMsg ─────────────────────
      const botMsg = {
        id: Date.now() + 1,
        from: "bot",
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ticket,
        ragUsed: data.rag_used ?? false,
      };

      const newMsgs = ticket?.escalate
        ? [
            ...updated,
            { id: Date.now() + 2, from: "escalation", ticket, text: "", time },
            botMsg,
          ]
        : [...updated, botMsg];

      setMessages(newMsgs);

      // Save ragUsed in ticket log too
      setTicketLog((prev) => [
        ...prev,
        { ...ticket, message: text, ragUsed: data.rag_used ?? false },
      ]);

    } catch (err) {
      setError(err.message || "Could not reach the backend.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([{
      id: 0,
      from: "bot",
      text: "Hi! I'm SupportFlow AI. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ticket: null,
      ragUsed: false,
    }]);
    setError(null);
  }

  const escalated = ticketLog.filter((t) => t.escalate).length;
  const critical  = ticketLog.filter((t) => t.priority === "critical").length;
  const kbUsed    = ticketLog.filter((t) => t.ragUsed).length;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex h-[90vh] max-h-[800px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold text-sm">Ticket Log</h2>
              <p className="text-slate-500 text-xs mt-0.5">{ticketLog.length} tickets this session</p>
            </div>

            {/* Stats row — now 3 cards */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-800">
              <div className="bg-slate-800 rounded-lg p-2 text-center">
                <div className="text-red-400 font-bold text-lg">{escalated}</div>
                <div className="text-slate-500 text-[10px]">Escalated</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2 text-center">
                <div className="text-orange-400 font-bold text-lg">{critical}</div>
                <div className="text-slate-500 text-[10px]">Critical</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2 text-center">
                <div className="text-indigo-400 font-bold text-lg">{kbUsed}</div>
                <div className="text-slate-500 text-[10px]">KB Used</div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col px-3 py-3">
              <TicketLog tickets={ticketLog} />
            </div>
          </div>
        )}

        {/* ── Chat panel ── */}
        <div className="flex-1 flex flex-col bg-slate-900 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
                title="Toggle sidebar"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1H5v1M3 16h18v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2z" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm leading-tight">SupportFlow AI</h1>
                <p className="text-emerald-400 text-xs">Online · Sentiment-aware · RAG enabled</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-slate-500 hover:text-slate-300 transition-colors text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg) => {
              if (msg.from === "escalation") {
                return (
                  <EscalationBanner
                    key={`esc-${msg.ticket.ticket_id}`}
                    ticketId={msg.ticket.ticket_id}
                    sentiment={msg.ticket.sentiment}
                    priority={msg.ticket.priority}
                  />
                );
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
                <div>
                  <span className="font-medium">Connection error: </span>{error}
                  <span className="text-red-400"> — Is your FastAPI server running on port 8000?</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-slate-800 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Try: "What is your return policy?" or "I am angry, order never arrived!"'
                rows={1}
                disabled={loading}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500
                           rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500
                           focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 max-h-32"
                style={{ fieldSizing: "content" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="shrink-0 w-11 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700
                           disabled:text-slate-500 text-white rounded-xl flex items-center justify-center
                           transition-colors shadow-lg"
              >
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
              Enter to send · Sentiment detection · RAG knowledge base · Powered by SupportFlow AI
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
