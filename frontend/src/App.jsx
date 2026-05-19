import { useState, useRef, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000/api/chat/";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatHistory(messages) {
  // Convert our UI messages → backend history format
  // Skip the first "bot" welcome message (no user turn before it)
  return messages
    .filter((m) => m.from !== "system")
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));
}

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

function Message({ msg }) {
  const isUser = msg.from === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar from={msg.from} />
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
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
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 0,
      from: "bot",
      text: "Hi! I'm SupportFlow AI. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message immediately
    const userMsg = { id: Date.now(), from: "user", text, time };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: formatHistory(updatedMessages),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "bot",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
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
    setMessages([
      {
        id: 0,
        from: "bot",
        text: "Hi! I'm SupportFlow AI. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col h-[90vh] max-h-[780px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
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
              <p className="text-emerald-400 text-xs">Online · Ready to help</p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="text-slate-500 hover:text-slate-300 transition-colors text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Clear chat
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 flex-row">
              <Avatar from="bot" />
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Error banner */}
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

        {/* ── Input ── */}
        <div className="px-4 py-4 border-t border-slate-800 bg-slate-900">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message… (Enter to send)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500
                         rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500
                         focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50
                         leading-relaxed max-h-32 overflow-y-auto"
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
            Shift+Enter for new line · Powered by SupportFlow AI
          </p>
        </div>

      </div>
    </div>
  );
}