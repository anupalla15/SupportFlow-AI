import React, { useState, useEffect, useRef, useMemo } from "react";
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN SYSTEM — SupportFlow AI
// Single source of truth for every visual decision.
// Reference DS.* instead of hardcoding values anywhere.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DS = {

  // ── Surfaces ───────────────────────────────────────────────
  // Four elevation layers. Use in order from deepest to highest.
  surface: {
    page:    "rgba(2,   6,  23, 1.0)",   // page background
    base:    "rgba(10,  15,  28, 0.98)",  // primary card
    raised:  "rgba(15,  23,  42, 0.90)",  // elevated card
    overlay: "rgba(20,  30,  55, 0.80)",  // modal / popover
    inset:   "rgba(8,   12,  24, 0.65)",  // inset / inner well
  },

  // ── Border colors ──────────────────────────────────────────
  border: {
    default: "rgba(51,  65,  85, 0.45)",
    subtle:  "rgba(51,  65,  85, 0.25)",
    strong:  "rgba(71,  85, 105, 0.65)",
    focus:   "rgba(99, 102, 241, 0.55)",
    // accent borders — used on hover or active state
    indigo:  "rgba(99,  102, 241, 0.30)",
    emerald: "rgba(52,  211, 153, 0.28)",
    red:     "rgba(248, 113, 113, 0.28)",
    orange:  "rgba(251, 146,  60, 0.28)",
    blue:    "rgba(96,  165, 250, 0.28)",
    purple:  "rgba(192, 132, 252, 0.28)",
  },

  // ── Border radius ──────────────────────────────────────────
  // Never use arbitrary values — pick from this scale.
  radius: {
    xs:  "8px",
    sm:  "10px",
    md:  "14px",
    lg:  "18px",
    xl:  "22px",
    pill:"999px",
  },

  // ── Spacing ────────────────────────────────────────────────
  // Internal padding for every card variant.
  space: {
    cardSm:   "14px",
    card:     "20px",
    cardLg:   "24px",
    section:  "32px",
    gapSm:    "12px",
    gap:      "16px",
    gapLg:    "24px",
  },

  // ── Shadows ────────────────────────────────────────────────
  shadow: {
    none:   "none",
    card:   "0 1px 3px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.02)",
    raised: "0 4px 16px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.03)",
    hover:  "0 8px 28px rgba(0,0,0,0.48), 0 0 0 1px rgba(99,102,241,0.12)",
    modal:  "0 24px 64px rgba(0,0,0,0.65)",
    // Dynamic glow — call as a function: DS.shadow.glow("#6366f1")
    glow:   (hex) => `0 0 22px ${hex}20, 0 0 0 1px ${hex}28`,
  },

  // ── Transitions ────────────────────────────────────────────
  // Always use one of these — never write duration/easing inline.
  transition: {
    fast:   "all 0.15s ease-out",
    base:   "all 0.20s ease-out",
    slow:   "all 0.35s ease-out",
    spring: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
  },

  // ── Color palette ──────────────────────────────────────────
  // color  = text / icon
  // bg     = background tint (low opacity)
  // border = matching border (low opacity)
  // bar    = chart bar / sparkline stroke
  color: {
    indigo:  { color: "#6366f1", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.25)",  bar: "#6366f1" },
    violet:  { color: "#a5b4fc", bg: "rgba(165,180,252,0.10)", border: "rgba(165,180,252,0.22)", bar: "#a5b4fc" },
    emerald: { color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)",  bar: "#34d399" },
    red:     { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)", bar: "#f87171" },
    orange:  { color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)",  bar: "#fb923c" },
    blue:    { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)",  bar: "#60a5fa" },
    purple:  { color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)", bar: "#c084fc" },
    slate:   { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)", bar: "#94a3b8" },
    yellow:  { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)",  bar: "#fbbf24" },
  },

  // ── Typography ─────────────────────────────────────────────
  // Use as className strings.
  type: {
    // Labels and metadata
    label:    "text-[10px] font-medium uppercase tracking-widest",
    caption:  "text-[11px] leading-snug",
    mono:     "text-[11px] font-mono tabular-nums",
    // Body
    body:     "text-[13px] leading-relaxed",
    bodyLg:   "text-[14px] leading-relaxed",
    // Headings
    title:    "text-[14px] font-semibold tracking-tight",
    heading:  "text-[16px] font-bold tracking-tight",
    display:  "text-[20px] font-bold tracking-tight",
    // Colors — combine with type above
    muted:    "text-slate-500",
    subdued:  "text-slate-400",
    primary:  "text-white",
    danger:   "text-red-400",
    success:  "text-emerald-400",
  },
};

// ── Deterministic Routing Confidence ──────────────────────────────────────
// Single source of truth — used by ConfidenceBar, AIMetricsCard,
// AIDecisionSummary, and AgentBadge confidence pills.
// Never call Math.random(). Same inputs always produce same output.

const CONFIDENCE_RANGES = {
  workflow:   { min: 0.950, max: 0.980 },
  billing:    { min: 0.880, max: 0.920 },
  api:        { min: 0.860, max: 0.910 },
  access:     { min: 0.910, max: 0.950 },
  general:    { min: 0.800, max: 0.860 },
  multiagent: { min: 0.960, max: 0.990 },
};

function calcConfidence(agentInfo, agentInfo2, multiAgent, ragUsed, text, p1Incident) {

  // 🚨 P1 incidents always have highest routing confidence
  if (p1Incident) {
    const hash = (text || "").split("").reduce(
      (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 100,
      0
    );

    return parseFloat((0.980 + (hash % 15) / 1000).toFixed(3));
  }

  const domain =
    multiAgent && agentInfo2?.agent
      ? "multiagent"
      : agentInfo?.color === "orange"
      ? "workflow"
      : agentInfo?.color === "blue"
      ? "billing"
      : agentInfo?.color === "green"
      ? "api"
      : agentInfo?.color === "purple"
      ? "access"
      : "general";

  const range = CONFIDENCE_RANGES[domain] ?? CONFIDENCE_RANGES.general;

  if (agentInfo?.confidence) {
    const c = agentInfo.confidence;
    if (c >= range.min - 0.05 && c <= range.max + 0.05)
      return c;
  }

  const str = (text || "").toLowerCase().trim();

  const hash = str.split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 9973,
    17
  );

  let score = range.min + (hash / 9973) * (range.max - range.min);

  if (ragUsed)
    score = Math.min(score + 0.008, range.max + 0.004);

  if (multiAgent && agentInfo2?.agent)
    score = Math.min(score + 0.005, 0.995);

  return parseFloat(score.toFixed(3));
}
// ── Single source of truth for all processing timings ─────────────────────
// Called ONCE per message in ChatMessage, result threaded to all children.
// Deterministic — same message always returns same values.
// No Math.random(). No Date.now() in the calculation.

function calculateProcessingMetrics(message) {
  const str = (message || "").toLowerCase().trim();

  // Two independent seeds prevent correlated step values
  const seedA = str.split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 9973, 17
  );
  const seedB = str.split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 3)) % 8831, 31
  );

  // Constrain seed to [min, max] without floating point drift
  const slot = (seed, min, max) => min + (seed % (max - min + 1));

  const classification_ms = slot(seedA,            12,  26);
  const memory_ms         = slot(seedB,              7,  16);
  const routing_ms        = slot(seedA * 3 % 9973,  18,  38);
  const rag_ms            = slot(seedB * 5 % 8831,  40,  90);
  const llm_ms            = slot(seedA * 7 % 9973, 580, 960);
  const escalation_ms     = slot(seedB * 9 % 8831,  10,  22);
  const ticket_ms         = slot(seedA * 11% 9973,  11,  23);

  // Total is always the explicit sum — never recalculated elsewhere
  const total_ms =
    classification_ms +
    memory_ms         +
    routing_ms        +
    rag_ms            +
    llm_ms            +
    escalation_ms     +
    ticket_ms;

  return {
    classification_ms,
    memory_ms,
    routing_ms,
    rag_ms,
    llm_ms,
    escalation_ms,
    ticket_ms,
    total_ms,
  };
}
// ── P1 Critical Incident Detection ────────────────────────────────────────
// Scans message for enterprise P1 signals.
// Returns null if not a critical incident.
// Returns a CriticalIncident object if detected.

const P1_SIGNALS = [
  // Severity keywords
  "production is down", "production down", "prod down",
  "entire platform", "platform unavailable", "complete outage",
  "total outage", "full outage", "major outage", "critical outage",
  "major incident", "p1 incident", "p1", "sev1", "sev 1",
  "severity 1", "severity one",
  // Impact keywords
  "customers affected", "users affected", "users impacted",
  "500 customers", "all customers", "all users",
  "emergency", "urgent outage", "service unavailable",
  "nothing works", "everything down", "completely down",
  "cannot access anything", "entire system",
  // Hinglish / Tenglish P1 signals
  "sab band", "kuch kaam nahi", "poora system down",
  "anni system padindi", "anni avvatledu",
];

const ESTIMATED_IMPACT = [
  { pattern: /(\d[\d,]+)\s*(customer|user|client)/i, extract: m => `~${m[1]} users affected` },
  { pattern: /all\s+(customer|user|client)/i,         extract: () => "All active users"        },
  { pattern: /500\s*(customer|user)/i,                extract: () => "~500+ users"              },
  { pattern: /production|prod\b/i,                   extract: () => "Production environment"   },
  { pattern: /entire|complete|total/i,                extract: () => "Entire platform"          },
];

// Deterministic incident ID from message content
function generateIncidentId(message) {
  const hash = message.split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 99991, 31
  );
  return `INC-${String(hash).padStart(5, "0")}`;
}

function detectCriticalIncident(message) {
  if (!message) return null;
  const lower = message.toLowerCase().trim();

  const matched = P1_SIGNALS.some(signal => lower.includes(signal));
  if (!matched) return null;

  // Estimate impact from message content
  let impact = "Platform-wide impact — scope under assessment";
  for (const rule of ESTIMATED_IMPACT) {
    const m = message.match(rule.pattern);
    if (m) { impact = rule.extract(m); break; }
  }

  // Estimate affected customers deterministically
  const hash     = lower.split("").reduce((a, c, i) => (a + c.charCodeAt(0) * (i + 1)) % 997, 7);
  const baseCount = 200 + (hash % 800);
  const customers = lower.includes("500") ? 500
                  : lower.includes("all")  ? "All active"
                  : baseCount;

  return {
    incidentId:   generateIncidentId(message),
    severity:     "P1",
    impact,
    customersAffected: typeof customers === "number" ? `~${customers}` : customers,
    commander:    "Incident Commander AI",
    agents:       ["Incident Commander AI", "Workflow Automation AI", "API Integration AI"],
    detectedAt:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}


function detectHumanHandoff(message, reply) {
  const text = `${message} ${reply}`.toLowerCase();

  const signals = [
    "contact support",
    "contact flowzint",
    "unable to",
    "cannot resolve",
    "still failing",
    "still not working",
    "human support",
    "manual investigation",
    "escalate",
    "engineering team",
    "platform team",
    "persistent issue",
  ];

  return signals.some(s => text.includes(s));
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DS COMPONENTS
// These are ADDITIONS only. Your existing components are untouched.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── DSCard ─────────────────────────────────────────────────
// Base shell for every card. All DS components use this internally.
// Props:
//   children      ReactNode
//   hover         bool        — enable lift-on-hover (default true)
//   noPad         bool        — remove internal padding (for table cards)
//   accentOnHover string      — DS.color key e.g. "indigo" — tints border+glow on hover
//   style         object      — additional inline style overrides
//   className     string      — additional Tailwind classes
//   onClick       function    — makes card clickable
function DSCard({
  children,
  hover       = true,
  noPad       = false,
  accentOnHover,
  style       = {},
  className   = "",
  onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const accent = accentOnHover ? DS.color[accentOnHover] : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      className={className}
      style={{
        background:   DS.surface.raised,
        borderRadius: DS.radius.xl,
        border:       `1px solid ${hovered && accent ? accent.border : DS.border.default}`,
        boxShadow:    hovered
          ? (accent ? DS.shadow.glow(accent.color) : DS.shadow.hover)
          : DS.shadow.card,
        padding:      noPad ? 0 : DS.space.card,
        transform:    hovered ? "translateY(-2px)" : "translateY(0)",
        transition:   DS.transition.base,
        cursor:       onClick ? "pointer" : "default",
        ...style,
      }}>
      {children}
    </div>
  );
}


// ── DSMetricCard ───────────────────────────────────────────
// Stat / KPI card.
// Props:
//   label       string   — metric name (uppercase label style)
//   value       string   — primary display value
//   sub         string   — secondary caption below value
//   icon        string   — emoji or char for top-right
//   accentKey   string   — DS.color key for value color e.g. "emerald"
//   trendValues number[] — optional sparkline data
//   onClick     function — optional
function DSMetricCard({
  label,
  value,
  sub,
  icon,
  accentKey   = "slate",
  trendValues,
  onClick,
}) {
  const accent = DS.color[accentKey] || DS.color.slate;

  return (
    <DSCard hover accentOnHover={accentKey} onClick={onClick}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <span
          className={`${DS.type.label} ${DS.type.muted}`}>
          {label}
        </span>
        {icon && <span className="text-xl leading-none">{icon}</span>}
      </div>

      {/* Primary value */}
      <div
        className="text-3xl font-bold tabular-nums leading-none mb-1"
        style={{ color: accent.color }}>
        {value}
      </div>

      {/* Optional sparkline */}
      {trendValues?.length >= 2 && (
        <div className="my-2.5" style={{ height: "28px" }}>
          <DSSparkline
            values={trendValues}
            color={accent.color}
            height={28}
          />
        </div>
      )}

      {/* Sub caption */}
      {sub && (
        <p className={`${DS.type.caption} ${DS.type.muted} mt-1`}>{sub}</p>
      )}
    </DSCard>
  );
}


// ── DSBarChart ─────────────────────────────────────────────
// Horizontal bar chart.
// Props:
//   data  { label: string, value: number, colorKey?: string, color?: string }[]
//         colorKey references DS.color; color is a raw hex fallback
//   max   number  — optional explicit max (defaults to data max)
function DSBarChart({ data = [], max: maxProp }) {
  const max = maxProp ?? Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const hex = d.color
          ?? (d.colorKey ? DS.color[d.colorKey]?.bar : null)
          ?? DS.color.slate.bar;
        const pct = max > 0 ? (d.value / max) * 100 : 0;

        return (
          <div key={d.label ?? i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`${DS.type.caption} ${DS.type.subdued}`}>
                {d.label}
              </span>
              <span
                className={`${DS.type.mono} font-semibold`}
                style={{ color: hex }}>
                {d.value}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: DS.surface.inset }}>
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${pct}%`,
                  background: hex,
                  boxShadow:  `0 0 6px ${hex}55`,
                  transition: DS.transition.slow,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ── DSDonut ────────────────────────────────────────────────
// Donut chart with legend.
// Props:
//   data    { label: string, value: number, color: string }[]
//   size    number   — outer diameter px (default 88)
//   legend  bool     — show legend (default true)
function DSDonut({ data = [], size = 88, legend = true }) {
  const total  = data.reduce((s, d) => s + d.value, 0) || 1;
  const r      = size * 0.375;
  const cx     = size / 2;
  const cy     = size / 2;
  const stroke = size * 0.145;
  const circ   = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map(d => {
    const dash = (d.value / total) * circ;
    const s    = { ...d, dash, gap: circ - dash, offset };
    offset    += dash;
    return s;
  });

  return (
    <div className={`flex items-center gap-4 ${legend ? "" : "justify-center"}`}>
      <svg
        width={size}
        height={size}
        className="shrink-0"
        style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={DS.surface.inset}
          strokeWidth={stroke}
        />
        {/* Slices */}
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            style={{ transition: DS.transition.slow }}
          />
        ))}
      </svg>

      {legend && (
        <div className="space-y-2 flex-1 min-w-0">
          {data.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: d.color }}
                />
                <span
                  className={`${DS.type.caption} ${DS.type.subdued} truncate`}>
                  {d.label}
                </span>
              </div>
              <span
                className={`${DS.type.mono} ${DS.type.primary} font-medium shrink-0`}>
                {total > 1
                  ? `${Math.round((d.value / total) * 100)}%`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── DSSparkline ────────────────────────────────────────────
// Compact area sparkline.
// Props:
//   values  number[]
//   color   string    — hex stroke color (default indigo)
//   height  number    — viewBox height px (default 40)
//   filled  bool      — show area fill (default true)
function DSSparkline({
  values  = [],
  color   = DS.color.indigo.color,
  height  = 40,
  filled  = true,
}) {
  if (values.length < 2) {
    return (
      <div
        className={`${DS.type.caption} ${DS.type.muted} text-center py-2`}>
        Collecting data…
      </div>
    );
  }

  const w     = 200;
  const h     = height;
  const pad   = 3;
  const max   = Math.max(...values, 1);
  const min   = Math.min(...values, 0);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const linePts = pts.join(" ");
  const fillPts = `${pad},${h} ${linePts} ${w - pad},${h}`;
  const gradId  = `dsspk-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {filled && (
        <polyline
          points={fillPts}
          fill={`url(#${gradId})`}
          stroke="none"
        />
      )}
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


// ── DSSection ──────────────────────────────────────────────
// Consistent section wrapper with heading + optional badge + divider.
// Props:
//   title   string
//   badge   string | number   — optional pill
//   action  ReactNode         — optional right-side element
function DSSection({ title, badge, action, children }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className={`${DS.type.heading} ${DS.type.primary}`}>
          {title}
        </h2>
        {badge !== undefined && (
          <span
            className={`${DS.type.mono} px-2 py-0.5 rounded-full`}
            style={{
              background: DS.color.indigo.bg,
              border:     `1px solid ${DS.color.indigo.border}`,
              color:      DS.color.indigo.color,
            }}>
            {badge}
          </span>
        )}
        <div
          className="flex-1 h-px ml-1"
          style={{ background: DS.border.subtle }}
        />
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// END OF DESIGN SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  { icon: "🔴", text: "Workflow failed and AI credits exhausted" },
  { icon: "🔐", text: "Team member cannot access the enterprise dashboard" },
  { icon: "🚀", text: "How do I connect FlowZint to our existing infrastructure?" },
  { icon: "📊", text: "Webhook triggers firing inconsistently in production" },
];

const QUICK_ACTIONS = [
  { label: "⚡ Workflow Failure",  query: "My workflow stopped executing — no triggers firing" },
  { label: "🔌 API Timeout",       query: "API calls timing out, getting 504 gateway errors"   },
  { label: "🤝 Multi-Agent", query: "My workflow is failing because API requests are timing out" },
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
          <div className="sf-card-inset px-4 py-3">
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
function AgentBadge({
  agentInfo,
  agentInfo2,
  multiAgent,
  p1Incident,
}) {
  if (p1Incident) {
  // temporary override
}
  if (!agentInfo?.agent) return null;

  // Multi-agent: show collaboration badge + both agent names
  if (multiAgent && agentInfo2?.agent) {
    return (
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold"
          style={{
            background:   "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(251,146,60,0.12))",
            borderColor:  "rgba(99,102,241,0.35)",
            color:        "#a5b4fc",
            boxShadow:    "0 0 16px rgba(99,102,241,0.15)",
          }}>
          <span className="text-xs">🤝</span>
          Multi-Agent Response
        </div>
        <span className="text-[11px] text-slate-500">
          {agentInfo.emoji} {agentInfo.agent}
        </span>
        <span className="text-slate-700 text-[10px]">+</span>
        <span className="text-[11px] text-slate-500">
          {agentInfo2.emoji} {agentInfo2.agent}
        </span>
      </div>
    );
  }

  // Single agent: existing behaviour
  return (
    <span className="text-[11px] text-slate-600 px-1 mb-0.5">
      {agentInfo.emoji} {agentInfo.agent}
    </span>
  );
}
// ── Critical Incident Banner ───────────────────────────────────────────────

function CriticalIncidentBanner({ incident }) {
  if (!incident) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background:  "rgba(20, 6, 6, 0.95)",
        border:      "1px solid rgba(248,113,113,0.45)",
        boxShadow:   "0 0 32px rgba(248,113,113,0.12), 0 1px 3px rgba(0,0,0,0.4)",
        animation:   "cardIn 0.25s ease both",
      }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(248,113,113,0.2)" }}>
        <span className="text-red-400 text-lg">🚨</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-red-300 tracking-tight">
              P1 Critical Incident
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(248,113,113,0.18)",
                border:     "1px solid rgba(248,113,113,0.4)",
                color:      "#f87171",
              }}>
              IMMEDIATE ESCALATION
            </span>
          </div>
          <p className="text-[11px] text-red-400/70 mt-0.5">
            {incident.incidentId} · Detected {incident.detectedAt}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[11px] text-red-400 font-medium">LIVE</span>
        </span>
      </div>

      {/* Incident details */}
      <div className="px-5 py-4 space-y-3">

        {/* Impact grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Estimated Impact",      value: incident.impact               },
            { label: "Customers Affected",     value: incident.customersAffected    },
            { label: "Incident Commander",     value: incident.commander            },
            { label: "Severity",               value: `${incident.severity} — Critical` },
          ].map(({ label, value }) => (
            <div key={label}
              className="rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(40,10,10,0.6)",
                border:     "1px solid rgba(248,113,113,0.15)",
              }}>
              <p className="text-[10px] text-red-400/60 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-[12px] text-red-200 font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* Active agents */}
        <div>
          <p className="text-[10px] text-red-400/60 uppercase tracking-wider mb-2">
            Activated Agents
          </p>
          <div className="flex flex-wrap gap-2">
            {incident.agents.map(agent => (
              <span key={agent}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background: "rgba(248,113,113,0.12)",
                  border:     "1px solid rgba(248,113,113,0.25)",
                  color:      "#fca5a5",
                }}>
                {agent}
              </span>
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: "rgba(248,113,113,0.07)",
            border:     "1px solid rgba(248,113,113,0.18)",
          }}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
          <p className="text-[12px] text-red-300">
            Enterprise Operations Team notified. All specialist agents activated.
            Human incident commander on standby.
          </p>
        </div>
      </div>
    </div>
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
// ── Response parser ────────────────────────────────────────────────────────
// Detects structured sections in AI responses and renders them as cards.
// Falls back to plain text if no structure detected.
// ── Enterprise Response Formatter ─────────────────────────────────────────

const SECTION_ACCENT = {
  "Automation & Workflows":  { color: "#fb923c", icon: "⚡", border: "rgba(251,146,60,0.2)"  },
  "Billing & Subscriptions": { color: "#60a5fa", icon: "💳", border: "rgba(96,165,250,0.2)"  },
  "API & Integrations":      { color: "#34d399", icon: "🔌", border: "rgba(52,211,153,0.2)"  },
  "Platform & Access":       { color: "#c084fc", icon: "🔐", border: "rgba(192,132,252,0.2)" },
  "Coordinated Resolution":  { color: "#a5b4fc", icon: "🤝", border: "rgba(165,180,252,0.2)" },
  "Enterprise Support":      { color: "#94a3b8", icon: "🏢", border: "rgba(148,163,184,0.18)"},
};

function getAccent(title) {
  const key = Object.keys(SECTION_ACCENT).find(k =>
    title.toLowerCase().includes(k.toLowerCase())
  );
  return SECTION_ACCENT[key] || { color: "#6366f1", icon: "📋", border: "rgba(99,102,241,0.2)" };
}

// Detect [Section] pattern used by multi-agent responses
function parseMultiAgentSections(text) {
  const pattern = /\[([^\]]+)\]\n([\s\S]*?)(?=\[|$)/g;
  const sections = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const body = match[2].trim();
    if (body) sections.push({ title: match[1].trim(), body });
  }
  return sections.length >= 2 ? sections : null;
}

// Format a plain text response into enterprise incident report structure
function formatEnterpriseResponse(text) {
  if (!text) return null;

  const lines  = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = { diagnosis: "", bullets: [], nextStep: "", warnings: [] };

  let mode = "diagnosis";

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect bullets
    if (/^[•\-\*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
      if (lower.includes("warning") || lower.includes("caution") || lower.includes("note:")) {
        result.warnings.push(clean);
      } else {
        result.bullets.push(clean);
        mode = "bullets";
      }
      continue;
    }

    // Detect next step signal
    if (lower.startsWith("if ") || lower.includes("contact ") || lower.includes("escalate")) {
      result.nextStep = line;
      mode = "nextStep";
      continue;
    }

    // Everything else before bullets is diagnosis
    if (mode === "diagnosis" && line.length > 10) {
      result.diagnosis += (result.diagnosis ? " " : "") + line;
    }
  }

  return result;
}

function StructuredResponse({ text, streaming }) {
  // While streaming — plain text with cursor
  if (streaming) {
    return (
      <span>
        {text}
        <span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-sm"
          style={{ backgroundColor: "#6366f1", animation: "blink 1s step-end infinite" }} />
      </span>
    );
  }

  if (!text) return null;

  // Multi-agent sectioned response
  const sections = parseMultiAgentSections(text);
  if (sections) {
    return (
      <div className="space-y-2.5">
        {sections.map((sec, i) => {
          const accent = getAccent(sec.title);
          return (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${accent.border}`, background: `${accent.color}07` }}>
              <div className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: `1px solid ${accent.border}` }}>
                <span className="text-xs">{accent.icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: accent.color }}>
                  {sec.title}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <EnterpriseBody text={sec.body} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single-agent enterprise format
  const parsed = formatEnterpriseResponse(text);
  if (!parsed || (!parsed.bullets.length && !parsed.nextStep)) {
    return <EnterpriseBody text={text} />;
  }

  return (
    <div className="space-y-3">
      {/* Diagnosis */}
      {parsed.diagnosis && (
        <p className="text-[13px] text-slate-200 leading-relaxed">
          {parsed.diagnosis}
        </p>
      )}

      {/* Recommended Actions */}
      {parsed.bullets.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
            Recommended Actions
          </p>
          <div className="space-y-1.5">
            {parsed.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center
                    text-[10px] font-bold shrink-0 mt-0.5"
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    color:      "#a5b4fc",
                    border:     "1px solid rgba(99,102,241,0.2)",
                  }}>
                  {i + 1}
                </span>
                <span className="text-[13px] text-slate-300 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {parsed.warnings.length > 0 && (
        <div className="rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(251,191,36,0.06)",
            border:     "1px solid rgba(251,191,36,0.18)",
          }}>
          <p className="text-[10px] text-yellow-500 uppercase tracking-wider mb-1.5">
            ⚠ Notice
          </p>
          {parsed.warnings.map((w, i) => (
            <p key={i} className="text-[12px] text-yellow-200/80">{w}</p>
          ))}
        </div>
      )}

      {/* Next Step */}
      {parsed.nextStep && (
        <div className="rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(52,211,153,0.06)",
            border:     "1px solid rgba(52,211,153,0.18)",
          }}>
          <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">
            Next Step
          </p>
          <p className="text-[12px] text-emerald-200/80">{parsed.nextStep}</p>
        </div>
      )}
    </div>
  );
}

// Plain text with enhanced bullet rendering — used internally
function EnterpriseBody({ text }) {
  const lines = (text || "").split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const isBullet = /^[•\-\*]\s/.test(line.trim());
        const isNum    = /^\d+\.\s/.test(line.trim());
        if (!line.trim()) return null;

        if (isBullet || isNum) {
          const clean = line.replace(/^[•\-\*\d\.]\s*/, "").trim();
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
              <span className="text-[13px] text-slate-300 leading-relaxed">{clean}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-[13px] text-slate-200 leading-relaxed">{line}</p>
        );
      }).filter(Boolean)}
    </div>
  );
}
 

// ── AI Decision Summary ────────────────────────────────────────────────────
function buildReasoning(msg) {
  // P1 override reasoning
  if (msg.p1Incident) {
    return `Critical P1 incident signals detected — production impact terminology triggered immediate escalation protocol. Incident Commander AI assumed coordination authority. Workflow Automation AI and API Integration AI activated in parallel for simultaneous platform and integration diagnosis. Enterprise Operations Team notified. All specialist agents operating in incident response mode.`;
  }

  const primary   = msg.agentInfo?.agent   || "Enterprise Support AI";
  const secondary = msg.agentInfo2?.agent  || null;
  const domain    = msg.agentInfo?.color === "orange" ? "workflow"
                  : msg.agentInfo?.color === "blue"   ? "billing"
                  : msg.agentInfo?.color === "green"  ? "api"
                  : msg.agentInfo?.color === "purple" ? "access"
                  : "general";

  const REASONING = {
    workflow: `Workflow execution terminology triggered specialist routing to ${primary}. Execution log patterns and trigger configuration keywords matched the automation domain with high confidence.`,
    billing:  `Subscription and credit consumption keywords activated ${primary}. Billing cycle indicators and payment state terminology confirmed domain classification.`,
    api:      `API authentication error patterns activated ${primary}. HTTP status codes and endpoint configuration terminology confirmed integration domain routing.`,
    access:   `Authentication failure indicators routed this request to ${primary}. Login state and permission configuration terminology matched the access management domain.`,
    general:  `Broad operational query routed to ${primary} for enterprise support triage. No single specialist domain matched with sufficient confidence for specialist routing.`,
  };

  if (msg.multiAgent && secondary) {
    return `Cross-domain incident detected. ${primary} and ${secondary} were activated simultaneously. Overlapping domain signals exceeded the multi-agent activation threshold. Both specialists contributed independent analyses before producing a coordinated resolution.`;
  }

  return REASONING[domain] ?? REASONING.general;
}
function AIDecisionSummary({ msg, metrics }) {
  const [open, setOpen] = useState(true);
  const hasMemory =
  msg.pipeline?.some(step => step.id === "memory") || false;

  // Deterministic processing time from message hash
  const msgHash = (msg.text || "").split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 10000, 0
  );
  // All timings come from the shared helper
const m = metrics ?? calculateProcessingMetrics(msg.text || "");

const intentMs  = m.classification_ms;
const memoryMs  = m.memory_ms;
const routingMs = m.routing_ms;
const ragMs     = msg.ragUsed ? m.rag_ms : 0;
const llmMs     = m.llm_ms;
const ticketMs  = m.ticket_ms;
const totalMs   = m.total_ms;
// P1 presentation override for decision summary rows
  const p1 = msg.p1Incident;

  const rows = p1 ? [
    { label: "Incident ID",         value: p1.incidentId                              },
    { label: "Severity",            value: `${p1.severity} — Critical`                },
    { label: "Incident Commander",  value: p1.commander                               },
    { label: "Supporting Agents",   value: "Workflow Automation AI, API Integration AI"},
    { label: "Estimated Impact",    value: p1.impact                                  },
    { label: "Customers Affected",  value: String(p1.customersAffected)               },
    { label: "Knowledge Base",      value: msg.ragUsed ? "Enterprise Knowledge Retrieved" : "Not Matched" },
    { label: "Processing Time",     value: `${totalMs}ms total`                       },
  ] : [
    { label: "Intent",             value: "Operational Support Request"                        },
    { label: "Primary Agent",      value: msg.agentInfo?.agent || "Enterprise Support AI"      },
    msg.multiAgent && msg.agentInfo2?.agent
      ? { label: "Supporting Agent", value: msg.agentInfo2.agent }
      : null,
    { label: "Routing Confidence", value: `${Math.round(
        calcConfidence(msg.agentInfo, msg.agentInfo2, msg.multiAgent, msg.ragUsed, msg.text)
        * 100)}%` },
    { label: "Case Memory",        value: msg.memoryActive ? "Previous Context Retrieved" : "New Session" },
    { label: "Knowledge Base",     value: msg.ragUsed ? "Enterprise Knowledge Retrieved" : "Not Matched" },
    { label: "Processing Time",    value: `${totalMs}ms total`                                },
  ].filter(Boolean).filter(r => r.value);
  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background:  "rgba(15,23,42,0.75)",
        border:      "1px solid rgba(99,102,241,0.14)",
        boxShadow:   "0 1px 3px rgba(0,0,0,0.2)",
      }}>

      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Collapse AI Decision Summary" : "Expand AI Decision Summary"}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-2.5
          hover:bg-white/[0.02] transition-colors duration-150 text-left">
        <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
          ⚙ AI Decision Summary
        </span>
        <span
          className="ml-auto text-slate-600 text-[10px] transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {/* Body */}
      <div style={{
        maxHeight:  open ? "480px" : "0px",
        overflow:   "hidden",
        transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div className="px-4 pb-4 pt-0.5 space-y-3"
          style={{ borderTop: "1px solid rgba(99,102,241,0.10)" }}>

          {/* Data rows */}
          <div className="space-y-1.5 pt-2">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider
                  w-36 shrink-0 pt-px">
                  {label}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Reasoning */}
          <div className="rounded-xl px-3 py-2.5"
            style={{
              background: "rgba(8,12,24,0.6)",
              border:     "1px solid rgba(51,65,85,0.3)",
            }}>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">
              Routing Reasoning
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {buildReasoning(msg)}
            </p>
          </div>

          {/* Processing breakdown */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
              Processing Breakdown
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Classification", value: `${intentMs}ms`  },
                { label: "Memory",         value: `${memoryMs}ms`  },
                { label: "Routing",        value: `${routingMs}ms` },
                { label: "KB Search",      value: msg.ragUsed ? `${ragMs}ms` : "—" },
                { label: "LLM",            value: `${llmMs}ms`     },
                { label: "Ticket",         value: `${ticketMs}ms`  },
              ].map(s => (
                <div key={s.label}
                  className="rounded-lg px-2 py-2 text-center"
                  style={{
                    background: "rgba(20,30,55,0.6)",
                    border:     "1px solid rgba(51,65,85,0.28)",
                  }}>
                  <div className="text-[9px] text-slate-600 mb-0.5">{s.label}</div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-1.5">
              <span className="text-[10px] text-slate-600">
                Total · <span className="text-slate-400 font-mono">{totalMs}ms</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ChatMessage({ msg }) {
  console.log("CHAT MESSAGE");
  console.log(msg);
  console.log("Pipeline:", msg.pipeline);
  const isUser = msg.from === "user";
  // Compute once for all child components
const metrics = !isUser
  ? calculateProcessingMetrics(msg.text || "")
  : null;

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
    <div className={`flex gap-3 message-enter ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mb-0.5">U</div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mb-0.5 text-sm">⚡</div>
      )}

      <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {/* P1 Critical Incident Banner */}
{!isUser && msg.p1Incident && (
  <CriticalIncidentBanner incident={msg.p1Incident} />
)}
{!isUser && (
  (msg.p1Incident || (msg.multiAgent && msg.agentInfo2))
    ? (
      <MultiAgentCollaboration
        agentInfo={msg.agentInfo}
        agentInfo2={msg.agentInfo2}
        multiAgent={msg.multiAgent}
        p1Incident={msg.p1Incident || null}
      />
    ) : (
      <AgentBadge
        agentInfo={msg.agentInfo}
        agentInfo2={msg.agentInfo2}
        multiAgent={msg.multiAgent}
        p1Incident={msg.p1Incident || null}
      />
    )
)}
{!isUser && (
 <AIDecisionSummary
   msg={msg}
   metrics={metrics}
/>
)}

{!isUser && msg.pipeline?.length > 0 && (
  <AIPipelinePanel
    pipeline={msg.pipeline}
    visible={true}
  />
)}

{/* ← ADD: execution timeline below pipeline */}
{!isUser && msg.agentInfo?.agent && (
 <AIExecutionTimeline
  pipeline={msg.pipeline || []}
  streaming={msg.streaming || false}
  ragUsed={msg.ragUsed}
  text={msg.text}
  metrics={metrics}
/>
)}

<div
  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line
    ${isUser
      ? "bg-indigo-600 text-white rounded-br-sm"
      : "bg-slate-900 text-slate-200 rounded-bl-sm"}`}
  style={
    !isUser
      ? {
          border: msg.multiAgent
            ? "1px solid rgba(99,102,241,0.3)"
            : "1px solid rgba(51,65,85,1)",
          boxShadow: msg.multiAgent
            ? "0 0 24px rgba(99,102,241,0.08)"
            : undefined,
        }
      : undefined
  }
>
 {isUser
  ? msg.text
  : <StructuredResponse
      text={msg.text}
      streaming={msg.streaming}
    />
}
</div>
        {/* RAG Sources Panel — replaces old badge row */}
       {!isUser && msg.ragUsed && msg.sources?.length > 0 && (
       <RAGSourcesPanel sources={msg.sources} />
        )}
        {!isUser && msg.ticketId && !msg.streaming && (
  <div className="rounded-xl px-4 py-3 mt-1">
    
  </div>
)}

        <span className="text-[10px] text-slate-700 px-1">{msg.time}</span>
        {!isUser && !msg.streaming && msg.agentInfo?.agent && (
        <AIDecisionSummary
  msg={msg}
  metrics={metrics}
/>
         )}
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
  const [selected, setSelected]   = useState(null); // "user" | "admin"

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    if (!selected) {
      setError("Select your access level to continue.");
      return;
    }
    setError("");
    setLoggingIn(true);
    setTimeout(() => { setLoggingIn(false); onLogin(selected); }, 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 60% 10%, #1e1b4b 0%, #0f172a 45%, #020617 100%)" }}>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center
            justify-center text-2xl shadow-2xl shadow-indigo-900/60 mb-4">⚡</div>
          <h1 className="text-white font-bold text-xl tracking-tight">SupportFlow AI</h1>
          <p className="text-slate-400 text-sm mt-2">
             Enterprise AI Support Platform
            </p>
          <p className="text-slate-600 text-xs mt-1">
              Customer Portal • Operations Center • Powered by FlowZint
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-md mx-auto">

  <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
    <div className="text-2xl font-bold text-indigo-400">
      12,481
    </div>
    <div className="text-xs text-slate-500">
      AI Requests Today
    </div>
  </div>

  <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
    <div className="text-2xl font-bold text-emerald-400">
      0.9s
    </div>
    <div className="text-xs text-slate-500">
      Avg Response
    </div>
  </div>

  <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
    <div className="text-2xl font-bold text-cyan-400">
      96%
    </div>
    <div className="text-xs text-slate-500">
      Resolution Rate
    </div>
  </div>

  <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
    <div className="text-2xl font-bold text-orange-400">
      18
    </div>
    <div className="text-xs text-slate-500">
      Active Engineers
    </div>
  </div>

</div>
            
        </div>

        {/* Portal selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            {
              key:     "user",
              icon:    "👤",
              title:   "AI Support Portal",
              desc:    "Submit and track support requests",
              border:  "rgba(99,102,241,0.5)",
              glow:    "rgba(99,102,241,0.15)",
            },
            {
              key:     "admin",
              icon:    "⚙",
              title:   "Enterprise Operations Center",
              desc:    "Monitor AI , Resolve escalations , Manage support tickets",
              border:  "rgba(251,146,60,0.5)",
              glow:    "rgba(251,146,60,0.12)",
            },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setSelected(p.key)}
              className="text-left p-4 rounded-2xl transition-all duration-200"
              style={{
                background: selected === p.key ? `${p.glow}` : "rgba(15,23,42,0.7)",
                border: selected === p.key
                  ? `1px solid ${p.border}`
                  : "1px solid rgba(51,65,85,0.5)",
                boxShadow: selected === p.key
                  ? `0 0 20px ${p.glow}`
                  : "none",
              }}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <p className="text-white text-sm font-semibold mb-0.5">{p.title}</p>
              <p className="text-slate-500 text-[11px] leading-snug">{p.desc}</p>
              {selected === p.key && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-[10px] text-indigo-400">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Credentials */}
        <div className="rounded-2xl p-6 border border-white/[0.07] mb-4"
          style={{
            background:     "rgba(15,23,42,0.85)",
            backdropFilter: "blur(24px)",
            boxShadow:      "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
          <div className="space-y-3">
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">
                Work Email
              </label>
              <input
             type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-label="Work email address"
            placeholder="you@company.com"
                className="w-full bg-slate-800/70 border border-slate-700/80 text-slate-200
                  placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all" />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-widest block mb-1.5">
                Password
              </label>
             <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-label="Password"
            placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full bg-slate-800/70 border border-slate-700/80 text-slate-200
                  placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all" />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loggingIn || !selected}
            className="w-full mt-4 font-medium text-sm rounded-xl py-2.5
              transition-all duration-200 disabled:opacity-40"
            style={{
              background: selected === "admin"
                ? "linear-gradient(135deg, #ea580c, #dc2626)"
                : "linear-gradient(135deg, #4f46e5, #6366f1)",
              color:      "#fff",
              boxShadow:  selected
                ? selected === "admin"
                  ? "0 4px 20px rgba(234,88,12,0.35)"
                  : "0 4px 20px rgba(99,102,241,0.35)"
                : "none",
            }}>
            {loggingIn
              ? "Signing in…"
              : selected === "admin"
                ? "Access Enterprise Operations Center"
                : selected === "user"
                  ? "Open AI Support Portal"
                  : "Choose AI Support Portal or Choose Operations Center"}
          </button>
        </div>

        <p className="text-slate-700 text-[10px] text-center">
          Demo build · any credentials accepted
        </p>
      </div>
    </div>
  );
}
// ── Human Support Modal ────────────────────────────────────────────────────
function HumanSupportModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h3 className="text-white font-semibold text-sm">
              Enterprise Support Team
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-3 mb-4">
          <p className="text-indigo-300 text-xs font-medium">
            ✅ Enterprise support team notified.
          </p>
          <p className="text-indigo-400 text-xs mt-0.5">
            Priority escalation initiated.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              href: "mailto:contact@flowzint.in",
              icon: "✉️",
              label: "Email Support",
              value: "contact@flowzint.in",
            },
            {
              href: "tel:+918884397315",
              icon: "📞",
              label: "Phone Support",
              value: "+91 8884397315",
            },
            {
              href: "https://flowzint.in/fz/contact.html",
              icon: "🌐",
              label: "Contact Portal",
              value: "flowzint.in/fz/contact.html",
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 transition-colors group"
            >
              <span className="text-base">{item.icon}</span>

              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {item.label}
                </p>

                <p className="text-slate-200 text-sm group-hover:text-white transition-colors">
                  {item.value}
                </p>
              </div>
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm rounded-xl py-2.5 transition-colors"
        >
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
function SystemStatusPanel({ ticketLog = [] }) {
  // Uptime derived from escalation rate — lower escalation = higher AI uptime
  const total      = ticketLog.length || 1;
  const escalated  = ticketLog.filter(t => t.escalate).length;
  const escRate    = escalated / total;
  const uptime     = Math.max(97.2, (99.9 - escRate * 12)).toFixed(2);

  // Active workflows = tickets processed in last 5 + baseline
  const recentActive = Math.min(ticketLog.length * 3 + 12, 95);
  const [active]     = useState(recentActive);
 
const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecondsAgo(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sf-card p-5"
      style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.06), 0 4px 24px rgba(0,0,0,0.3)" }}>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
            <span className="text-xs">🟢</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm leading-none">System Status</h3>
           <p className="text-slate-600 text-[10px] mt-0.5">
              Last scan {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
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

// ── Enterprise AI Reasoning Panel ──────────────────────────────────────────
const AGENT_SEQUENCES = {
  workflow: {
    header: "⚡ Workflow Automation AI",
    steps: [
      "🧠 Classifying operational intent...",
      "🔍 Retrieving execution history...",
      "📚 Loading prior case context...",
      "📄 Querying automation knowledge base...",
      "🤖 Generating enterprise resolution...",
    ],
  },
  billing: {
    header: "💳 Billing & Credits AI",
    steps: [
      "🧠 Classifying billing intent...",
      "🔍 Retrieving subscription state...",
      "📚 Loading prior case context...",
      "📄 Querying billing knowledge base...",
      "🤖 Generating enterprise resolution...",
    ],
  },
  api: {
    header: "🔌 API Integration AI",
    steps: [
      "🧠 Classifying integration intent...",
      "🔍 Validating endpoint configuration...",
      "📚 Loading prior case context...",
      "📄 Querying API knowledge base...",
      "🤖 Generating enterprise resolution...",
    ],
  },
  access: {
    header: "🔐 Platform Access AI",
    steps: [
      "🧠 Classifying access intent...",
      "🔍 Reviewing authentication state...",
      "📚 Loading prior case context...",
      "📄 Querying access documentation...",
      "🤖 Generating enterprise resolution...",
    ],
  },
  multiagent: {
    header: "🤝 Multi-Agent Coordinator",
    steps: [
      "🧠 Detecting cross-domain incident...",
      "⚡ Activating specialist agents...",
      "📚 Loading prior case context...",
      "📄 Cross-referencing knowledge base...",
      "🤖 Coordinating unified resolution...",
    ],
  },
  general: {
    header: "🏢 Enterprise Support AI",
    steps: [
      "🧠 Classifying operational intent...",
      "⚡ Assigning specialist agent...",
      "📚 Loading prior case context...",
      "📄 Querying enterprise knowledge base...",
      "🤖 Generating enterprise resolution...",
    ],
  },
};
function AIThinkingPanel({ context = "general" }) {
  const seq = AGENT_SEQUENCES[context] ?? AGENT_SEQUENCES.general;

  const [stepIndex, setStepIndex] = useState(0);

  // Reset whenever context changes (new message sent)
  useEffect(() => {
    setStepIndex(0);
  }, [context, seq]);

  // Advance one step every 750–900ms, hold on last step
  useEffect(() => {
    if (stepIndex >= seq.steps.length - 1) return;
    const delay = 750 + Math.random() * 150;
    const t = setTimeout(() => setStepIndex(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [stepIndex, seq.steps.length]);

  return (
    <>
      <style>{`
        @keyframes enterprisePulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.15; }
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>

      <div className="flex items-start gap-3">

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm relative"
          style={{
            background: "rgba(15,23,42,0.95)",
            border:     `1px solid ${seq.border}`,
            boxShadow:  `0 0 10px ${seq.glow}`,
          }}>
          <span className="relative z-10 text-xs">{seq.emoji}</span>
          {/* Soft pulse ring */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border:    `1px solid ${seq.color}`,
              opacity:   0.4,
              animation: "enterprisePulse 2.4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Panel */}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3.5 flex-1"
          style={{
            background: "rgba(15,23,42,0.97)",
            border:     `1px solid ${seq.border}`,
            boxShadow:  `0 2px 16px ${seq.glow}`,
          }}>

          {/* Agent header */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] font-semibold tracking-wide"
              style={{ color: seq.color }}>
              {seq.emoji} {seq.label}
            </span>
            {/* Live indicator dot */}
            <span
              className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
              style={{
                backgroundColor: seq.color,
                animation:       "enterprisePulse 1.4s ease-in-out infinite",
              }}
            />
          </div>

          {/* Reasoning steps */}
          <div className="space-y-2">
            {seq.steps.map((step, i) => {
              const done    = i < stepIndex;
              const active  = i === stepIndex;
              const pending = i > stepIndex;

              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5"
                  style={{
                    opacity:   pending ? 0.3 : 1,
                    animation: active ? "stepFadeIn 0.25s ease" : "none",
                  }}>

                  {/* Status icon */}
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {done && (
                      // Green checkmark
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                        <circle cx="8" cy="8" r="7" fill="rgba(52,211,153,0.15)"
                          stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                        <path d="M4.5 8.5l2.5 2.5 4-5"
                          stroke="#34d399" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {active && (
                      // Pulsing filled circle in agent color
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="7"
                          fill={`${seq.color}18`}
                          stroke={`${seq.color}60`} strokeWidth="1" />
                        <circle cx="8" cy="8" r="3"
                          fill={seq.color}
                          style={{ animation: "enterprisePulse 1.2s ease-in-out infinite" }} />
                      </svg>
                    )}
                    {pending && (
                      // Empty dim circle
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="7"
                          fill="none" stroke="rgba(71,85,105,0.6)" strokeWidth="1" />
                      </svg>
                    )}
                  </span>

                  {/* Step label */}
                  <span
                    className="text-xs transition-colors duration-200"
                    style={{
                      color:      done    ? "#64748b"
                                : active  ? "#e2e8f0"
                                : "#334155",
                      fontWeight: active ? "500" : "400",
                    }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Streaming helper ───────────────────────────────────────────────────────

async function streamText(fullText, onChunk, onDone) {
  // Split on whitespace boundaries while preserving the whitespace tokens
  // This gives natural word-by-word appearance including spaces and newlines
  const tokens = fullText.split(/(\s+)/);

  for (const token of tokens) {
    onChunk(token);

    // Punctuation-aware delays create natural reading rhythm
    let delay = 18; // default: fast word flow
    if (/[.!?]/.test(token))   delay = 65; // sentence end — noticeable pause
    else if (/[,;:]/.test(token)) delay = 35; // clause pause
    else if (/\n/.test(token))    delay = 45; // line break pause

    await new Promise(r => setTimeout(r, delay));
  }

  onDone();
}
// ── Thinking context detector ───────────────────────────────────────────────

function detectThinkingContext(text) {
  const t = text.toLowerCase();

  const score = (keywords) => keywords.filter(k => t.includes(k)).length;

  const scores = {
    workflow:   score(["workflow", "trigger", "pipeline", "execution", "automation", "webhook", "cron", "avvatledu", "scheduled"]),
    billing:    score(["billing", "credit", "payment", "subscription", "invoice", "plan", "refund", "pricing"]),
    api:        score(["api", "endpoint", "401", "403", "500", "token", "integration", "oauth", "sdk", "timeout", "request"]),
    access:     score(["login", "access", "password", "otp", "2fa", "permission", "locked", "sso", "dashboard", "workspace"]),
  };

  const ranked = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (ranked.length === 0)              return "general";
  if (ranked.length >= 2 && ranked[1][1] >= 1) return "multiagent";
  return ranked[0][0];
}
// ── AI Processing Pipeline Panel ───────────────────────────────────────────
const PIPELINE_COLORS = {
  intent:     { icon: "🎯", color: "#a5b4fc" },
  memory:     { icon: "🧠", color: "#c084fc" },
  routing:    { icon: "⚡", color: "#fb923c" },
  rag:        { icon: "📄", color: "#6366f1" },
  llm:        { icon: "🤖", color: "#34d399" },
  escalation: { icon: "🚨", color: "#f87171" },
  ticket:     { icon: "🎫", color: "#60a5fa" },
};
const PIPELINE_FRIENDLY_LABELS = {
  intent:     "Request Type Identified",
  memory:     "Previous Context Retrieved",
  routing:    "Specialist Agent Assigned",
  rag:        "Enterprise Knowledge Search",
  llm:        "Enterprise Resolution Generated",
  escalation: "Priority Escalation Initiated",
  ticket:     "Incident Record Created",
};

function friendlyDetail(id, detail) {
  if (!detail) return detail;

  const replacements = {
    "no prior context":             "No previous session found",
    "no match — general knowledge": "No matching KB entry · using AI knowledge",
    "agent locked":                 "Previous agent reused · case continuity",
    "static":                       "Instant response · no LLM call needed",
  };

  return replacements[detail.toLowerCase()] ?? detail;
}
// ── Confidence Visualization ───────────────────────────────────────────────

function ConfidenceBar({ agentInfo, agentInfo2, multiAgent, ragUsed, text, p1Incident }) {
  const [animated, setAnimated] = useState(false);

  // Trigger animation after mount so the bar slides in visibly
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  // ── Confidence calculation ──────────────────────────────────────
  // Priority: real routing confidence → multi-agent average → estimation
const confidence = calcConfidence(
  agentInfo,
  agentInfo2,
  multiAgent,
  ragUsed,
  text,
  p1Incident
);

const source =
  p1Incident
    ? "p1 escalation"
    : multiAgent
      ? "collaborative"
      : agentInfo?.color === "orange"
        ? "workflow routing"
        : agentInfo?.color === "blue"
          ? "billing routing"
          : agentInfo?.color === "green"
            ? "api routing"
            : agentInfo?.color === "purple"
              ? "access routing"
              : "domain estimate";

  // ── Color thresholds ────────────────────────────────────────────
  const getColor = (p) => {
    if (p >= 85) return { bar: "#34d399", text: "#34d399", label: "High",    bg: "rgba(52,211,153,0.08)"  };
    if (p >= 68) return { bar: "#fbbf24", text: "#fbbf24", label: "Medium",  bg: "rgba(251,191,36,0.08)"  };
    return               { bar: "#f87171", text: "#f87171", label: "Low",     bg: "rgba(248,113,113,0.08)" };
  };

  const theme = getColor(pct);

  return (
    <div
      className="px-3 py-2.5 rounded-xl"
      style={{
        background: "rgba(15,23,42,0.55)",
        border:     "1px solid rgba(99,102,241,0.08)",
      }}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">
          AI Confidence
        </span>
        <div className="flex items-center gap-2">
          {/* Confidence level label */}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              color:      theme.text,
              background: theme.bg,
            }}>
            {theme.label}
          </span>
          {/* Percentage */}
          <span
            className="text-sm font-bold font-mono tabular-nums"
            style={{ color: theme.text }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Animated bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(51,65,85,0.6)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width:      animated ? `${pct}%` : "0%",
            background: `linear-gradient(90deg, ${theme.bar}99, ${theme.bar})`,
            boxShadow:  animated ? `0 0 8px ${theme.bar}50` : "none",
            transition: "width 0.7s cubic-bezier(0.4,0,0.2,1), box-shadow 0.7s ease",
          }}
        />
      </div>

      {/* Source label */}
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Tick marks at 25%, 50%, 75% */}
          {[25, 50, 75].map(mark => (
            <div key={mark} className="flex items-center gap-0.5">
              <span
                className="text-[9px] font-mono tabular-nums"
                style={{ color: pct >= mark ? theme.text + "60" : "#1e293b" }}>
                {mark}
              </span>
            </div>
          ))}
        </div>
        <span className="text-[9px] text-slate-700 font-mono">
          source === "routing"     && "routing score"
          source === "multi-agent" && "collaborative avg"
          source === "estimated"   && "domain estimate"
        </span>
      </div>
    </div>
  );
}
// ── AI Metrics Card ────────────────────────────────────────────────────────

function AIMetricsCard({ msg, metrics }) {
  // Only render on bot messages that have agent info
  if (!msg.agentInfo?.agent) return null;

  // Simulate response time — varies naturally per message so it looks real
 const m = metrics ?? calculateProcessingMetrics(msg.text || "");

const responseTime = `${m.total_ms}ms`;

  // Estimate tokens from text length — ~1 token per 4 chars is a safe approximation
  const tokenEstimate = msg.text
    ? Math.max(48, Math.round(msg.text.length / 4))
    : "—";

  // Confidence — from agent info if present, else omit
 // Single source — always via calcConfidence
const rawConf = calcConfidence(
  msg.agentInfo,
  msg.agentInfo2,
  msg.multiAgent,
  msg.ragUsed,
  msg.text
);

const confidence = `${Math.round(rawConf * 100)}%`;

  // Model name — shorten for display
  const modelRaw   = msg.model || "llama-3.3-70b";
  const modelLabel = modelRaw.includes("/")
    ? modelRaw.split("/").pop()
    : modelRaw;
const METRICS = [
    {
      label: "AI Engine",
      value: modelLabel,
      color: "#a5b4fc",
    },
    {
      label: "Resolution Latency",
      value: responseTime,
      color: "#34d399",
    },
    {
      label: "Processing Complexity",
      value: `~${tokenEstimate} tokens`,
      color: "#60a5fa",
    },
    {
     label: "Case Memory",
value: msg.pipeline?.some(step => step.id === "memory")
  ? "Active"
  : "New Session",
color: msg.pipeline?.some(step => step.id === "memory")
  ? "#c084fc"
  : "#475569"
    },
    {
      label: "Knowledge Base",
      value: msg.ragUsed ? "Retrieved" : "Not Matched",
      color: msg.ragUsed ? "#6366f1" : "#475569",
    },
    {
  label: "Agent Mode",
  value: msg.p1Incident
    ? "Incident Command"
    : msg.multiAgent
      ? "Collaborative"
      : "Specialist",
  color: msg.p1Incident
    ? "#f87171"
    : msg.multiAgent
      ? "#fb923c"
      : "#64748b",
},
    confidence && {
      label: "Routing Confidence",
      value: confidence,
      color: "#fbbf24",
    },
  ].filter(Boolean);
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 rounded-xl"
      style={{
        background:  "rgba(15,23,42,0.6)",
        border:      "1px solid rgba(99,102,241,0.1)",
        backdropFilter: "blur(6px)",
      }}>
      {METRICS.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">
            {label}
          </span>
          <span
            className="text-[11px] font-mono font-medium"
            style={{ color }}>
            {value}
          </span>
          {/* Subtle divider — hidden on last item */}
        </div>
      ))}
    </div>
  );
}
// ── Multi-Agent Collaboration Visualization ────────────────────────────────

const AGENT_THEME = {
  orange: { color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)", glow: "rgba(251,146,60,0.15)" },
  blue:   { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)", glow: "rgba(96,165,250,0.15)" },
  green:  { color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)", glow: "rgba(52,211,153,0.15)" },
  purple: { color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)", glow: "rgba(192,132,252,0.15)" },
  slate:  { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)", glow: "rgba(148,163,184,0.10)" },
};

function AgentNode({ agentInfo, side = "left", visible }) {
  const theme = AGENT_THEME[agentInfo?.color] || AGENT_THEME.slate;

  return (
    <div
      className="flex flex-col items-center gap-1.5 transition-all duration-500"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible
          ? "translateY(0)"
          : side === "left" ? "translateY(-8px)" : "translateY(-8px)",
      }}>

      {/* Agent avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg relative"
        style={{
          background: theme.bg,
          border:     `1px solid ${theme.border}`,
          boxShadow:  `0 0 16px ${theme.glow}`,
        }}>
        <span className="relative z-10">{agentInfo?.emoji}</span>
        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            border:    `1px solid ${theme.color}`,
            opacity:   0.4,
            animation: "agentPulse 2.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Agent label */}
      <div className="text-center">
        <p
          className="text-[10px] font-semibold leading-tight"
          style={{ color: theme.color }}>
          {agentInfo?.agent?.replace(" AI", "")}
        </p>
        <p className="text-[9px] text-slate-600 leading-tight">
          {agentInfo?.department}
        </p>
      </div>

      {/* Confidence chip */}
      {agentInfo?.confidence && (
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{
            color:      theme.color,
            background: theme.bg,
            border:     `1px solid ${theme.border}`,
          }}>
          {Math.round(agentInfo.confidence * 100)}%
        </span>
      )}
    </div>
  );
}

function ConnectorArrow({ visible, primaryColor, secondaryColor }) {
  return (
    <svg
      width="120" height="48"
      viewBox="0 0 120 48"
      className="shrink-0"
      style={{ overflow: "visible" }}>

      {/* Left line — from primary agent down */}
      <line
        x1="20" y1="0"
        x2="20" y2="20"
        stroke={primaryColor}
        strokeWidth="1"
        strokeDasharray="4 3"
        style={{
          opacity:   visible ? 0.5 : 0,
          transition: "opacity 0.4s ease 0.15s",
        }}
      />

      {/* Right line — from secondary agent down */}
      <line
        x1="100" y1="0"
        x2="100" y2="20"
        stroke={secondaryColor}
        strokeWidth="1"
        strokeDasharray="4 3"
        style={{
          opacity:   visible ? 0.5 : 0,
          transition: "opacity 0.4s ease 0.2s",
        }}
      />

      {/* Horizontal merge line */}
      <line
        x1="20" y1="20"
        x2="100" y2="20"
        stroke="rgba(99,102,241,0.35)"
        strokeWidth="1"
        style={{
          opacity:           visible ? 1 : 0,
          strokeDasharray:   "80",
          strokeDashoffset:  visible ? "0" : "80",
          transition:        "stroke-dashoffset 0.45s ease 0.3s, opacity 0.3s ease 0.3s",
        }}
      />

      {/* Center merge node */}
      <circle
        cx="60" cy="20"
        r="3"
        fill="#6366f1"
        style={{
          opacity:   visible ? 0.9 : 0,
          transform: visible ? "scale(1)" : "scale(0)",
          transformOrigin: "60px 20px",
          transition: "opacity 0.3s ease 0.55s, transform 0.3s ease 0.55s",
        }}
      />

      {/* Arrow down to unified response */}
      <line
        x1="60" y1="22"
        x2="60" y2="40"
        stroke="#6366f1"
        strokeWidth="1.5"
        style={{
          opacity:           visible ? 0.7 : 0,
          strokeDasharray:   "20",
          strokeDashoffset:  visible ? "0" : "20",
          transition:        "stroke-dashoffset 0.3s ease 0.65s, opacity 0.3s ease 0.65s",
        }}
      />

      {/* Arrowhead */}
      <path
        d="M55 37 L60 44 L65 37"
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity:   visible ? 0.7 : 0,
          transition: "opacity 0.25s ease 0.8s",
        }}
      />
    </svg>
  );
}
// ── RAG Sources Panel ──────────────────────────────────────────────────────

const SOURCE_META = {
  "faq.txt": {
    label:    "FlowZint FAQ",
    icon:     "📄",
    category: "Knowledge Base",
  },
  "workflow_failures": {
    label:    "Workflow Fixes",
    icon:     "⚡",
    category: "Runbook",
  },
  "auth_recovery": {
    label:    "Auth Recovery",
    icon:     "🔐",
    category: "Runbook",
  },
  "api_timeout_fixes": {
    label:    "API Timeouts",
    icon:     "🔌",
    category: "Runbook",
  },
  "billing": {
    label:    "Billing Docs",
    icon:     "💳",
    category: "Policy",
  },
  "onboarding": {
    label:    "Onboarding Guide",
    icon:     "🚀",
    category: "Guide",
  },
};

// Relevance scores are deterministic per source so they
// stay consistent across re-renders for the same message
function getRelevance(src, index) {
  const base   = index === 0 ? 91 : 74;
  const jitter = (src.length % 7) * 2;
  return Math.min(base + jitter, 99);
}

function relevanceBadge(score) {
  if (score >= 88) return { label: "High",   color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"  };
  if (score >= 72) return { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  };
  return               { label: "Low",    color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" };
}

function resolveSource(raw) {
  // Match raw source string against known keys
  const key   = Object.keys(SOURCE_META).find(k => raw.toLowerCase().includes(k));
  const meta  = key ? SOURCE_META[key] : null;
  return {
    raw,
    label:    meta?.label    || raw,
    icon:     meta?.icon     || "📄",
    category: meta?.category || "Document",
  };
}

// ── AI Execution Timeline ──────────────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    id:           "intent",
    label:        "Request Classified",
    icon:         "🎯",
    color:        "#a5b4fc",
    baseDuration: 4,
  },
  {
    id:           "memory",
    label:        "Context Retrieved",
    icon:         "🧠",
    color:        "#c084fc",
    baseDuration: 2,
  },
  {
    id:           "routing",
    label:        "Specialist Assigned",
    icon:         "⚡",
    color:        "#fb923c",
    baseDuration: 8,
  },
  {
    id:           "rag",
    label:        "Knowledge Search Complete",
    icon:         "📄",
    color:        "#6366f1",
    baseDuration: 18,
  },
  {
    id:           "llm",
    label:        "Resolution Generated",
    icon:         "🤖",
    color:        "#34d399",
    baseDuration: 0,
  },
  {
    id:           "ticket",
    label:        "Incident Record Created",
    icon:         "🎫",
    color:        "#60a5fa",
    baseDuration: 1,
  },
];
// Build timeline entries by enriching TIMELINE_STEPS with pipeline data
// Deterministic timing hash — same message always produces same timings
function deterministicMs(seed, min, max) {
  return min + (seed % (max - min + 1));
}

function buildTimelineEntries(pipeline, streaming, msgText = "") {
  const pipelineMap = {};
  (pipeline || []).forEach(s => { pipelineMap[s.id] = s; });

  // Generate stable seed from message content
  const seed = (msgText || "").split("").reduce(
    (acc, ch, i) => (acc + ch.charCodeAt(0) * (i + 1)) % 9973, 7
  );

  // Realistic enterprise processing times per step
  const REALISTIC_MS = {
    intent:     deterministicMs(seed,         14,  28),
    memory:     deterministicMs(seed * 3,      8,  18),
    routing:    deterministicMs(seed * 7,     20,  38),
    rag:        deterministicMs(seed * 11,    42,  95),
    llm:        deterministicMs(seed * 13,   620, 980),
    escalation: deterministicMs(seed * 17,    10,  22),
    ticket:     deterministicMs(seed * 19,    12,  24),
  };

  let cursorMs  = 0;
  const startMs = Date.now() - Object.values(REALISTIC_MS).reduce((a, b) => a + b, 0) - 200;

  return TIMELINE_STEPS.map((step, i) => {
    const pStep   = pipelineMap[step.id];
    const skipped = pStep?.status === "skipped";
    const isLlm   = step.id === "llm";
    const durMs   = REALISTIC_MS[step.id] ?? step.baseDuration ?? 10;

    const done    = skipped ? false : isLlm ? !streaming : true;
    const tsMs    = startMs + cursorMs;
    cursorMs     += durMs + 4;

    return {
      ...step,
      duration:  skipped ? null : durMs,
      skipped,
      done,
      active:    isLlm && streaming,
      timestamp: new Date(tsMs).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }),
      detail: pStep?.detail || null,
    };
  });
}
function TimelineStep({ entry, index, visible }) {
  const isLast = index === TIMELINE_STEPS.length - 1;

  return (
    <div
      className="flex gap-3"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: `opacity 0.28s ease ${index * 0.07}s,
                     transform 0.28s ease ${index * 0.07}s`,
      }}>

      {/* Spine column */}
      <div className="flex flex-col items-center" style={{ width: "20px" }}>
        {/* Node */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center
            shrink-0 relative z-10"
          style={{
            background: entry.skipped
              ? "rgba(30,41,59,0.8)"
              : entry.active
                ? `${entry.color}20`
                : entry.done
                  ? `${entry.color}18`
                  : "rgba(30,41,59,0.8)",
            border: entry.skipped
              ? "1px solid #1e293b"
              : entry.active
                ? `1px solid ${entry.color}`
                : entry.done
                  ? `1px solid ${entry.color}55`
                  : "1px solid #334155",
            boxShadow: entry.active
              ? `0 0 10px ${entry.color}40`
              : undefined,
            animation: entry.active
              ? "tlNodePulse 1.4s ease-in-out infinite"
              : undefined,
          }}>

          {/* Icon / status indicator */}
          {entry.skipped && (
            <span className="text-[8px] text-slate-700">—</span>
          )}
          {entry.active && (
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: entry.color,
                animation:  "tlNodePulse 0.9s ease-in-out infinite",
              }}
            />
          )}
          {entry.done && !entry.skipped && (
            <svg viewBox="0 0 12 12" className="w-3 h-3">
              <path
                d="M2.5 6l2.5 2.5 4.5-5"
                fill="none"
                stroke={entry.color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12"
                strokeDashoffset="0"
                style={{ animation: "tlCheckDraw 0.3s ease both" }}
              />
            </svg>
          )}
          {!entry.done && !entry.active && !entry.skipped && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#334155" }}
            />
          )}
        </div>

        {/* Vertical connector */}
        {!isLast && (
          <div
            className="flex-1 w-px mt-0.5"
            style={{
              background: entry.done || entry.active
                ? `linear-gradient(to bottom, ${entry.color}30, rgba(51,65,85,0.2))`
                : "rgba(30,41,59,0.8)",
              minHeight: "20px",
            }}
          />
        )}
      </div>
{/* Content column */}
<div className="flex-1 pb-4 min-w-0" style={{ paddingTop: "1px" }}>
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-xs shrink-0" style={{ opacity: entry.skipped ? 0.3 : 1 }}>
        {entry.icon}
      </span>
      <span className="text-[12px] font-medium truncate transition-colors duration-200"
        style={{
          color:      entry.skipped ? "#334155" : entry.active ? "#f1f5f9" : entry.done ? "#94a3b8" : "#475569",
          fontWeight: entry.active ? "600" : "500",
        }}>
        {entry.label}
      </span>
      {entry.done && !entry.skipped && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline-block"
          style={{
            color:      "#34d399",
            background: "rgba(52,211,153,0.08)",
            border:     "1px solid rgba(52,211,153,0.18)",
          }}>
          ✓ done
        </span>
      )}
      {entry.detail && (entry.done || entry.active) && !entry.skipped && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 hidden sm:inline-block"
          style={{
            color:      entry.color,
            background: `${entry.color}10`,
            boxShadow:  entry.active ? `0 0 8px ${entry.color}30` : undefined,
          }}>
          {entry.detail}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0 text-right">
      {entry.active && (
        <span className="text-[10px] font-mono" style={{ color: entry.color }}>
          processing…
        </span>
      )}
      {entry.done && !entry.skipped && entry.duration > 0 && (
        <span className="text-[10px] font-mono text-slate-700 tabular-nums">
          {entry.duration}ms
        </span>
      )}
      {entry.skipped && (
        <span className="text-[10px] text-slate-800">—</span>
      )}
      {(entry.done || entry.active) && !entry.skipped && (
        <span className="text-[10px] font-mono text-slate-700 tabular-nums w-16 text-right">
          {entry.timestamp}
        </span>
      )}
    </div>
  </div>
  {entry.active && (
    <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.4)" }}>
      <div className="h-full rounded-full" style={{
        background: `linear-gradient(90deg, ${entry.color}60, ${entry.color})`,
        animation:  "tlStreamBar 1.8s ease-in-out infinite",
      }} />
    </div>
  )}
</div>
    </div>
  );
}
function AIExecutionTimeline({
  pipeline,
  streaming,
  ragUsed,
  text,
  metrics,
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);
const entries = buildTimelineEntries(
  pipeline,
  streaming,
  text || "",
  metrics
);
 const doneCount = entries.filter(e => e.done && !e.skipped).length;

// Use shared metrics if available
const totalMs =
  metrics?.total_ms ??
  entries.reduce((s, e) => s + (e.duration || 0), 0);

  return (
    <>
      <style>{`
        @keyframes tlCheckDraw {
          from { stroke-dashoffset: 12; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes tlNodePulse {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1;   }
        }
        @keyframes tlStreamBar {
          0%   { width: 0%;    margin-left: 0%;   }
          50%  { width: 40%;   margin-left: 30%;  }
          100% { width: 0%;    margin-left: 100%; }
        }
      `}</style>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          background:  "rgba(15,23,42,0.62)",
          border:      "1px solid rgba(99,102,241,0.11)",
          backdropFilter: "blur(8px)",
        }}>

        {/* Header */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2.5
            hover:bg-white/[0.02] transition-colors">

          <span className="text-[10px] text-indigo-400 font-medium tracking-wide">
            🕐 Execution Timeline
          </span>

          {/* Progress pill */}
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              color:      "#a5b4fc",
              background: "rgba(99,102,241,0.1)",
              border:     "1px solid rgba(99,102,241,0.18)",
            }}>
            {doneCount}/{entries.filter(e => !e.skipped).length} steps
          </span>

          {/* Total duration */}
          {!streaming && totalMs > 0 && (
            <span className="text-[9px] font-mono text-slate-700">
              {totalMs}ms total
            </span>
          )}

          {/* Streaming indicator */}
          {streaming && (
            <span
              className="text-[9px] text-indigo-400 font-mono"
              style={{ animation: "tlNodePulse 1.2s ease-in-out infinite" }}>
              live
            </span>
          )}

          <span
            className="ml-auto text-slate-700 text-[10px] transition-transform duration-300"
            style={{ display: "inline-block",
                     transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </button>

        {/* Timeline body */}
        <div
          style={{
            maxHeight:  expanded ? "520px" : "0px",
            overflow:   "hidden",
            transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}>
          <div className="px-3 pt-2 pb-1 border-t border-slate-800/50">
            {entries.map((entry, i) => (
              <TimelineStep
                key={entry.id}
                entry={entry}
                index={i}
                visible={visible}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function RAGSourcesPanel({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources?.length) return null;

  const resolved = sources.map(resolveSource);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background:  "rgba(15,23,42,0.6)",
        border:      "1px solid rgba(99,102,241,0.12)",
        backdropFilter: "blur(6px)",
      }}>

      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2
          hover:bg-white/[0.02] transition-colors">

        {/* Icon + label */}
        <span className="text-indigo-400 text-xs">📚</span>
        <span className="text-[11px] text-indigo-400 font-medium">
          Knowledge Retrieved
        </span>

        {/* Document count pill */}
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded ml-0.5"
          style={{
            color:      "#a5b4fc",
            background: "rgba(99,102,241,0.12)",
            border:     "1px solid rgba(99,102,241,0.2)",
          }}>
          {resolved.length} {resolved.length === 1 ? "source" : "sources"}
        </span>

        {/* Expand chevron */}
        <span
          className="ml-auto text-slate-600 text-[10px] transition-transform duration-300"
          style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {/* Expandable document list */}
      <div
        style={{
          maxHeight:  expanded ? `${resolved.length * 56 + 16}px` : "0px",
          overflow:   "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}>
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-800/50">
          {resolved.map((src, i) => {
            const score = getRelevance(src.raw, i);
            const badge = relevanceBadge(score);

            return (
              <div
                key={src.raw}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  background: "rgba(30,41,59,0.5)",
                  border:     "1px solid rgba(51,65,85,0.6)",
                  animation:  expanded
                    ? `ragRowIn 0.22s ease ${i * 0.06}s both`
                    : "none",
                }}>

                {/* File icon */}
                <span className="text-base shrink-0">{src.icon}</span>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-200 font-medium truncate">
                    {src.label}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {src.category}
                  </p>
                </div>

                {/* Retrieved status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ boxShadow: "0 0 5px rgba(52,211,153,0.5)" }} />
                  <span className="text-[10px] text-emerald-400">Retrieved</span>
                </div>

                {/* Relevance badge */}
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color:      badge.color,
                    background: badge.bg,
                    border:     `1px solid ${badge.border}`,
                  }}>
                  {badge.label} · {score}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes ragRowIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}

function MultiAgentCollaboration({ agentInfo, agentInfo2, multiAgent ,p1Incident, }) {
  const [phase, setPhase] = useState(0);
  // phase 0 = hidden, 1 = agents visible, 2 = connector drawn, 3 = unified label shown

  useEffect(() => {
    if (!multiAgent || !agentInfo2) return;

    const t1 = setTimeout(() => setPhase(1), 80);   // agents appear
    const t2 = setTimeout(() => setPhase(2), 340);   // connector draws
    const t3 = setTimeout(() => setPhase(3), 900);   // unified label fades in
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [multiAgent, agentInfo2]);

  // Single agent — render nothing (AgentBadge handles it)
  if (!multiAgent || !agentInfo2) return null;

  const primaryTheme   = AGENT_THEME[agentInfo?.color]  || AGENT_THEME.slate;
  const secondaryTheme = AGENT_THEME[agentInfo2?.color] || AGENT_THEME.slate;

  return (
    <>
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 0.4; transform: scale(1);    }
          50%       { opacity: 0.1; transform: scale(1.12); }
        }
        @keyframes unifiedFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        className="rounded-xl px-4 py-3.5"
        style={{
          background: "rgba(15,23,42,0.65)",
          border:     "1px solid rgba(99,102,241,0.12)",
          backdropFilter: "blur(8px)",
        }}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: "#a5b4fc" }}>
            🤝 Multi-Agent Collaboration
          </span>
          {/* Live dot while animating */}
          {phase < 3 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto"
              style={{ animation: "agentPulse 1s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* Collaboration layout */}
        <div className="flex flex-col items-center gap-0">

          {/* Agents row */}
          <div className="flex items-start justify-between w-full px-2">
            <AgentNode agentInfo={agentInfo}  side="left"  visible={phase >= 1} />
            <AgentNode agentInfo={agentInfo2} side="right" visible={phase >= 1} />
          </div>

          {/* SVG connector */}
          <ConnectorArrow
            visible={phase >= 2}
            primaryColor={primaryTheme.color}
            secondaryColor={secondaryTheme.color}
          />

          {/* Unified response label */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(99,102,241,0.1)",
              border:     "1px solid rgba(99,102,241,0.2)",
              opacity:    phase >= 3 ? 1 : 0,
              animation:  phase >= 3 ? "unifiedFadeIn 0.35s ease both" : "none",
            }}>
            <span className="text-[10px] text-indigo-300 font-medium">
              Unified Response
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px rgba(52,211,153,0.6)" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AIPipelinePanel({ pipeline, visible }) {
  const [expanded, setExpanded]           = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [activeIndex, setActiveIndex]     = useState(-1);

  // Auto-expand when a real pipeline arrives
  useEffect(() => {
    if (pipeline?.length > 3) setExpanded(true);
  }, [pipeline]);

  // Sequential reveal — one step every 175ms, with a brief "active" glow
  useEffect(() => {
    if (!pipeline?.length) return;
    setRevealedCount(0);
    setActiveIndex(0);

    let current = 0;

    const tick = () => {
      setActiveIndex(current);

      const revealTimer = setTimeout(() => {
        setRevealedCount(current + 1);

        current += 1;
        if (current < pipeline.length) {
          stepTimer = setTimeout(tick, 175);
        } else {
          setActiveIndex(-1);   // all done — no active step
        }
      }, 180);   // step glows for 180ms before checkmark locks in

      return revealTimer;
    };

    let stepTimer = setTimeout(tick, 120);  // brief delay before first step
    return () => clearTimeout(stepTimer);
  }, [pipeline]);

  if (!visible || !pipeline?.length) return null;

  const ragStep     = pipeline.find(s => s.id === "rag");
  const routingStep = pipeline.find(s => s.id === "routing");
  const memStep     = pipeline.find(s => s.id === "memory");

  return (
    <>
      <style>{`
        @keyframes pipelineFadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 20; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes activeGlow {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1;   }
        }
      `}</style>

      <div
        className="rounded-xl border overflow-hidden transition-all duration-300"
        style={{
          background:     "rgba(15,23,42,0.8)",
          borderColor:    "rgba(99,102,241,0.15)",
          backdropFilter: "blur(8px)",
        }}>

        {/* Header */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5
            hover:bg-white/[0.02] transition-colors">

          <span className="text-[11px] text-indigo-400 font-medium tracking-wide">
            ⚙ AI Processing Pipeline
          </span>

          <div className="flex items-center gap-1.5 ml-1">
            {routingStep && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono
                bg-orange-950/60 border border-orange-800/40 text-orange-400">
                {routingStep.detail.split(" · ")[0]}
              </span>
            )}
            {ragStep?.status === "done" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono
                bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                RAG
              </span>
            )}
            {memStep?.detail && memStep.detail !== "no prior context" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono
                bg-purple-950/60 border border-purple-800/40 text-purple-400">
                mem
              </span>
            )}
          </div>

          <span className="ml-auto text-slate-600 text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </button>

        {/* Steps */}
        {expanded && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-slate-800/50 pt-2.5">
            {pipeline.map((step, i) => {
              const meta     = PIPELINE_COLORS[step.id] || { icon: "•", color: "#94a3b8" };
              const skipped  = step.status === "skipped";
              const revealed = i < revealedCount;
              const isActive = i === activeIndex;
              const pending  = !revealed && !isActive;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 transition-opacity duration-200"
                  style={{
                    opacity:   pending ? 0 : skipped ? 0.3 : 1,
                    animation: revealed
                      ? `pipelineFadeIn 0.22s ease both`
                      : undefined,
                  }}>

                  {/* Status icon */}
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">

                    {/* Revealed + not skipped → checkmark */}
                    {revealed && !skipped && (
                      <svg viewBox="0 0 14 14" className="w-3.5 h-3.5">
                        <circle
                          cx="7" cy="7" r="6"
                          fill={`${meta.color}18`}
                          stroke={`${meta.color}55`}
                          strokeWidth="1"
                        />
                        <path
                          d="M4 7l2 2 4-4"
                          fill="none"
                          stroke={meta.color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="20"
                          strokeDashoffset="0"
                          style={{ animation: "checkDraw 0.25s ease both" }}
                        />
                      </svg>
                    )}

                    {/* Active → pulsing dot with glow */}
                    {isActive && (
                      <svg viewBox="0 0 14 14" className="w-3.5 h-3.5">
                        <circle
                          cx="7" cy="7" r="6"
                          fill={`${meta.color}15`}
                          stroke={`${meta.color}70`}
                          strokeWidth="1"
                          style={{ animation: "activeGlow 0.9s ease-in-out infinite" }}
                        />
                        <circle
                          cx="7" cy="7" r="2.5"
                          fill={meta.color}
                          style={{ animation: "activeGlow 0.9s ease-in-out infinite" }}
                        />
                      </svg>
                    )}

                    {/* Skipped → dash circle */}
                    {skipped && (
                      <svg viewBox="0 0 14 14" className="w-3.5 h-3.5">
                        <circle
                          cx="7" cy="7" r="6"
                          fill="none"
                          stroke="#334155"
                          strokeWidth="1"
                        />
                        <path
                          d="M4.5 7h5"
                          stroke="#334155"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    {/* Pending → invisible placeholder keeps layout stable */}
                    {pending && (
                      <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 opacity-0">
                        <circle cx="7" cy="7" r="6" />
                      </svg>
                    )}
                  </span>

                  {/* Label */}
                  <span
                    className="text-[11px] flex-1 transition-colors duration-200"
                    style={{
                      color: isActive
                        ? "#e2e8f0"
                        : revealed
                          ? "#64748b"
                          : "#334155",
                      fontWeight: isActive ? "500" : "400",
                    }}>
                    {PIPELINE_FRIENDLY_LABELS[step.id] || step.label}
                  </span>

                  {/* Detail pill */}
                  {step.detail && (revealed || isActive) && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded
                        truncate max-w-[180px] transition-all duration-200"
                      style={{
                        color:      skipped ? "#475569" : meta.color,
                        background: skipped ? "transparent" : `${meta.color}12`,
                        boxShadow:  isActive
                          ? `0 0 8px ${meta.color}30`
                          : undefined,
                      }}>
                      {friendlyDetail(step.id, step.detail)}
                    </span>
                  )}

                  {/* Latency */}
                  {step.ms > 0 && revealed && (
                    <span className="text-[10px] text-slate-700 font-mono
                      shrink-0 w-10 text-right"
                      style={{ animation: "pipelineFadeIn 0.3s ease both" }}>
                      {step.ms}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
// ── Enterprise Analytics Dashboard ────────────────────────────────────────
// Reads entirely from existing ticketLog and summaries state.
// No new props, no backend changes.

// ── Sparkline (reuse or define if not already in file) ────────────────────
// If you already have Sparkline defined, remove this duplicate.
function AnalyticsSparkline({ values = [], color = "#6366f1", height = 36 }) {
  if (values.length < 2) {
    return (
      <div className="text-[10px] text-slate-700 text-center py-2">
        No trend data yet
      </div>
    );
  }
  const w = 200, h = height, pad = 3;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `${pad},${h} ${pts} ${w - pad},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polyline points={fillPts} fill={`url(#sg-${color.replace("#","")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Donut (reuse or define if not already in file) ────────────────────────
function AnalyticsDonut({ data, size = 80 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const stroke = size * 0.14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map(d => {
    const dash = (d.value / total) * circ;
    const s = { ...d, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#1e293b" strokeWidth={stroke} />
      {slices.map(s => (
        <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt" />
      ))}
    </svg>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────────────────
function HBar({ label, value, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium" style={{ color }}>
          {value}{suffix}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(51,65,85,0.5)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, accent, icon, trend, trendValues }) {
  const [hovered, setHovered] = useState(false);
  const trendUp = trend > 0;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-5 flex flex-col gap-2 cursor-default
        transition-all duration-300"
      style={{
        background:  "rgba(15,23,42,0.8)",
        border:      hovered
          ? "1px solid rgba(99,102,241,0.28)"
          : "1px solid rgba(51,65,85,0.5)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow:   hovered
          ? "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
      }}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</div>
      {trendValues?.length > 1 && (
        <div className="h-7">
          <AnalyticsSparkline
            values={trendValues}
            color={accent.includes("emerald") ? "#34d399"
                 : accent.includes("red")     ? "#f87171"
                 : accent.includes("orange")  ? "#fb923c"
                 :                              "#6366f1"}
            height={28}
          />
        </div>
      )}
      <div className="flex items-center justify-between mt-0.5">
        {sub && (
          <span className="text-[10px] text-slate-600">{sub}</span>
        )}
        {trend !== undefined && (
          <span
            className="text-[10px] font-mono"
            style={{ color: trendUp ? "#34d399" : "#f87171" }}>
            {trendUp ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────
function DashSection({ title, children, badge }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          {title}
        </h2>
        {badge && (
          <span className="text-[9px] bg-indigo-950 border border-indigo-800
            text-indigo-400 px-1.5 py-0.5 rounded-full font-mono">
            {badge}
          </span>
        )}
        <div className="flex-1 h-px bg-slate-800/60 ml-1" />
      </div>
      {children}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
function EnterpriseAnalyticsDashboard({
  ticketLog,
  summaries,
  escalationQueue,
  trendPoints,
}) {
  // ── Derived metrics ──────────────────────────────────────────
  const total      = ticketLog.length;
  const escalated  = ticketLog.filter(t => t.escalate).length;
  const critical   = ticketLog.filter(t => t.critical).length;
  const ragHits    = ticketLog.filter(t => t.ragUsed).length;
  const multiAgent = ticketLog.filter(t => t.multiAgent).length;
  const resolved   = summaries.filter(s => s.resolution_status === "Resolved").length;

  const escRate    = total ? Math.round((escalated / total) * 100) : 0;
  const ragRate    = total ? Math.round((ragHits   / total) * 100) : 0;
  const aiResRate  = total ? Math.round(((total - escalated) / total) * 100) : 0;

  // Sentiment breakdown
  const sentiment = { angry: 0, frustrated: 0, neutral: 0, positive: 0 };
  ticketLog.forEach(t => {
    if (sentiment[t.sentiment] !== undefined) sentiment[t.sentiment]++;
  });

  // Priority breakdown
  const priority = { critical: 0, high: 0, medium: 0, low: 0 };
  ticketLog.forEach(t => {
    if (priority[t.priority] !== undefined) priority[t.priority]++;
  });

  // Agent usage — count by agent name from ticket log
  const agentUsage = {};
  ticketLog.forEach(t => {
    const name = t.agent ?? "Enterprise Support AI";
    agentUsage[name] = (agentUsage[name] || 0) + 1;
  });
  const agentRows = Object.entries(agentUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxAgentCount = Math.max(...agentRows.map(([, v]) => v), 1);

  // Simulated latency values (based on ticket timing heuristic)
  const latencyValues = ticketLog.map((_, i) =>
    380 + Math.sin(i * 0.8) * 120 + Math.random() * 80
  );
  const avgLatency = latencyValues.length
    ? Math.round(latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length)
    : 0;

  // Escalation trend — rolling 10 tickets
  const escTrend = ticketLog
    .slice(-10)
    .map(t => t.escalate ? 1 : 0);

  // Empty state
  if (total === 0) {
    return (
  <EmptyState
    icon="📊"
    title="No AI Interactions Processed Yet"
    description="Analytical insights will populate here as customers submit support requests through the AI portal."
  />
);
  }

  return (
    <div className="space-y-8">

      {/* ── KPI row ─────────────────────────────────────────────── */}
      <DashSection title="Enterprise Operations Center" badge={`${total} tickets`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Total Incidents"
            value={total}
            sub="This session"
            accent="text-white"
            icon="🎫"
            trendValues={ticketLog.map((_, i) => i + 1)}
          />
          <KPICard
            label="AI Resolution"
            value={`${aiResRate}%`}
            sub={`${total - escalated} auto-resolved`}
            accent="text-emerald-400"
            icon="✅"
            trend={aiResRate > 80 ? 4 : -3}
            trendValues={trendPoints}
          />
          <KPICard
            label="Escalation Rate"
            value={`${escRate}%`}
            sub={`${escalated} escalated`}
            accent={escRate > 25 ? "text-red-400" : "text-orange-400"}
            icon="⚡"
            trend={escRate > 25 ? 8 : -2}
            trendValues={escTrend}
          />
          <KPICard
            label="RAG Hit Rate"
            value={`${ragRate}%`}
            sub={`${ragHits} KB-assisted`}
            accent="text-indigo-400"
            icon="📚"
            trendValues={ticketLog.map(t => t.ragUsed ? 1 : 0)}
          />
        </div>
      </DashSection>

      {/* ── Secondary KPI row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Critical Cases",  value: critical,   color: "text-red-400",    icon: "🚨" },
          { label: "Multi-Agent",     value: multiAgent, color: "text-indigo-400", icon: "🤝" },
          { label: "Resolved",        value: resolved,   color: "text-emerald-400",icon: "✅" },
          { label: "Queue Waiting",   value: escalationQueue.length,
                                             color: escalationQueue.length > 0
                                               ? "text-red-400" : "text-slate-400",
                                             icon: "🚨" },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: "rgba(15,23,42,0.7)",
              border:     "1px solid rgba(51,65,85,0.45)",
            }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sentiment donut */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-4 tracking-tight">
            Sentiment Distribution
            </h3>
          <div className="flex items-center gap-4">
            <AnalyticsDonut
              data={[
                { label: "Angry",      value: sentiment.angry,      color: "#f87171" },
                { label: "Frustrated", value: sentiment.frustrated,  color: "#fb923c" },
                { label: "Neutral",    value: sentiment.neutral,     color: "#94a3b8" },
                { label: "Positive",   value: sentiment.positive,    color: "#34d399" },
              ]}
              size={80}
            />
            <div className="space-y-1.5 flex-1">
              {[
                { label: "Angry",      value: sentiment.angry,     color: "#f87171" },
                { label: "Frustrated", value: sentiment.frustrated, color: "#fb923c" },
                { label: "Neutral",    value: sentiment.neutral,    color: "#94a3b8" },
                { label: "Positive",   value: sentiment.positive,   color: "#34d399" },
              ].map(d => (
                <div key={d.label}
                  className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: d.color }} />
                    <span className="text-[11px] text-slate-400">{d.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 tabular-nums">
                    {total > 0
                      ? `${Math.round((d.value / total) * 100)}%`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-4 tracking-tight">
              Priority Breakdown
            </h3>
          <div className="space-y-3">
            {[
              { label: "Critical", value: priority.critical, color: "#f87171" },
              { label: "High",     value: priority.high,     color: "#fb923c" },
              { label: "Medium",   value: priority.medium,   color: "#94a3b8" },
              { label: "Low",      value: priority.low,      color: "#34d399" },
            ].map(d => (
              <HBar
                key={d.label}
                label={d.label}
                value={d.value}
                max={total}
                color={d.color}
              />
            ))}
          </div>
        </div>

        {/* Escalation trend sparkline */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-1">
            Escalation Trend
          </h3>
          <p className="text-[10px] text-slate-600 mb-4">
            Last {trendPoints.length} interactions
          </p>
          <AnalyticsSparkline values={trendPoints} color="#f87171" height={40} />
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Escalations over time</span>
            <span className="text-red-400 font-medium tabular-nums">
              {escalated} total
            </span>
          </div>
        </div>
      </div>

      {/* ── Agent usage + latency ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Agent usage */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-4">
            Agent Usage
          </h3>
          {agentRows.length === 0 ? (
            <p className="text-slate-600 text-xs">No agent data yet.</p>
          ) : (
            <div className="space-y-3">
              {agentRows.map(([name, count]) => {
                const color =
                  name.includes("Workflow") ? "#fb923c" :
                  name.includes("Billing")  ? "#60a5fa" :
                  name.includes("API")      ? "#34d399" :
                  name.includes("Access")   ? "#c084fc" : "#94a3b8";
                return (
                  <HBar
                    key={name}
                    label={name.replace(" AI", "")}
                    value={count}
                    max={maxAgentCount}
                    color={color}
                    suffix=" tickets"
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Response latency */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-1">
            Response Latency
          </h3>
          <p className="text-[10px] text-slate-600 mb-3">Simulated — ms per response</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-2xl font-bold text-indigo-400 tabular-nums">
              {avgLatency}ms
            </span>
            <span className="text-[10px] text-slate-600 mb-1">avg</span>
          </div>
          <AnalyticsSparkline values={latencyValues} color="#6366f1" height={44} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Min", value: latencyValues.length
                  ? `${Math.round(Math.min(...latencyValues))}ms` : "—",
                color: "#34d399" },
              { label: "Avg", value: avgLatency ? `${avgLatency}ms` : "—",
                color: "#6366f1" },
              { label: "Max", value: latencyValues.length
                  ? `${Math.round(Math.max(...latencyValues))}ms` : "—",
                color: "#f87171" },
            ].map(s => (
              <div key={s.label}
                className="rounded-xl px-2.5 py-2 text-center"
                style={{
                  background: "rgba(30,41,59,0.5)",
                  border:     "1px solid rgba(51,65,85,0.4)",
                }}>
                <div className="text-[10px] text-slate-600 mb-0.5">{s.label}</div>
                <div className="text-xs font-mono font-semibold"
                  style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RAG + multi-agent ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* RAG hit rate */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-4">
            RAG Hit Rate
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <AnalyticsDonut
              data={[
                { label: "KB Hit",  value: ragHits,         color: "#6366f1" },
                { label: "General", value: total - ragHits, color: "#1e293b" },
              ]}
              size={72}
            />
            <div>
              <div className="text-2xl font-bold text-indigo-400 tabular-nums mb-0.5">
                {ragRate}%
              </div>
              <div className="text-[10px] text-slate-600">
                {ragHits} of {total} queries used KB
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "KB Assisted",   value: ragHits,         color: "#6366f1" },
              { label: "General AI",    value: total - ragHits, color: "#475569" },
            ].map(s => (
              <div key={s.label}
                className="rounded-xl px-3 py-2.5 text-center"
                style={{
                  background: "rgba(30,41,59,0.5)",
                  border:     "1px solid rgba(51,65,85,0.4)",
                }}>
                <div className="text-[10px] text-slate-600 mb-0.5">{s.label}</div>
                <div className="text-base font-bold tabular-nums"
                  style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-agent collaboration */}
        <div className="rounded-2xl p-5"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <h3 className="text-white font-semibold text-sm mb-4">
            Multi-Agent Collaboration
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <AnalyticsDonut
              data={[
                { label: "Multi-Agent", value: multiAgent,         color: "#a5b4fc" },
                { label: "Single",      value: total - multiAgent, color: "#1e293b" },
              ]}
              size={72}
            />
            <div>
              <div className="text-2xl font-bold text-indigo-300 tabular-nums mb-0.5">
                {total > 0 ? Math.round((multiAgent / total) * 100) : 0}%
              </div>
              <div className="text-[10px] text-slate-600">
                {multiAgent} multi-agent responses
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Multi-Agent", value: multiAgent,         color: "#a5b4fc" },
              { label: "Single Agent", value: total - multiAgent, color: "#475569" },
            ].map(s => (
              <div key={s.label}
                className="rounded-xl px-3 py-2.5 text-center"
                style={{
                  background: "rgba(30,41,59,0.5)",
                  border:     "1px solid rgba(51,65,85,0.4)",
                }}>
                <div className="text-[10px] text-slate-600 mb-0.5">{s.label}</div>
                <div className="text-base font-bold tabular-nums"
                  style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live activity feed ───────────────────────────────────── */}
      <DashSection title="Operational Activity Stream">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <div className="flex items-center justify-between px-5 py-3.5
            border-b border-slate-800/50">
            <span className="text-white font-semibold text-sm">Recent Tickets</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[11px]">Live</span>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {[...ticketLog].reverse().map(t => {
              const sentCfg = SENTIMENT_CONFIG[t.sentiment] || SENTIMENT_CONFIG.neutral;
              return (
                <div key={t.ticket_id}
                  className="flex items-start gap-3 px-5 py-3
                    border-b border-slate-800/40 last:border-0
                    hover:bg-white/[0.015] transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sentCfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[11px] font-mono text-indigo-400">
                        {t.ticket_id}
                      </span>
                      {t.critical && (
                        <span className="text-[9px] bg-red-900 text-red-300
                          border border-red-700 px-1.5 py-0.5 rounded font-bold">
                          CRITICAL
                        </span>
                      )}
                      {t.escalate && !t.critical && (
                        <span className="text-[9px] bg-orange-900 text-orange-300
                          border border-orange-700 px-1.5 py-0.5 rounded">
                          ESC
                        </span>
                      )}
                      {t.multiAgent && (
                        <span className="text-[9px] text-indigo-400">🤝</span>
                      )}
                      {t.ragUsed && (
                        <span className="text-[9px] text-indigo-400">📚</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {t.message}
                    </p>
                    <span className="text-[10px] text-slate-700">{t.time}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0
                    ${PRIORITY_BADGE[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DashSection>

    </div>
  );
}
// ── SLA timer hook ─────────────────────────────────────────────────────────

function useSLATimer(createdTime, slaMinutes) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Parse createdTime string like "02:34 PM" into a Date offset from now
    const now        = Date.now();
    const slaMs      = slaMinutes * 60 * 1000;
    const startMs    = now - (elapsed * 1000);

    const timer = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const slaMs      = slaMinutes * 60;
  const remaining  = Math.max(slaMs - elapsed, 0);
  const breached   = remaining === 0;
  const pct        = Math.min((elapsed / slaMs) * 100, 100);

  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return { remaining, breached, pct, display: fmt(remaining) };
}

// ── SLA bar ────────────────────────────────────────────────────────────────

function SLATimer({ createdTime, slaMinutes, compact = false }) {
  const { remaining, breached, pct, display } = useSLATimer(createdTime, slaMinutes);

  const color = pct < 50 ? "#34d399"
              : pct < 80 ? "#fbbf24"
              :             "#f87171";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="text-[11px] font-mono tabular-nums"
          style={{ color: breached ? "#f87171" : color }}>
          {breached ? "BREACHED" : display}
        </span>
        <div className="w-12 h-1 rounded-full overflow-hidden bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">SLA</span>
        <span
          className="text-xs font-mono font-semibold tabular-nums"
          style={{ color: breached ? "#f87171" : color }}>
          {breached ? "BREACHED" : display}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width:     `${pct}%`,
            background: color,
            boxShadow:  `0 0 6px ${color}60`,
          }}
        />
      </div>
      {breached && (
        <p className="text-[9px] text-red-400 mt-1">SLA target exceeded</p>
      )}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────

const TICKET_STATUS = {
  "New":         { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.25)"  },
  "Assigned":    { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)"  },
  "In Progress": { color: "#a5b4fc", bg: "rgba(165,180,252,0.1)",  border: "rgba(165,180,252,0.25)" },
  "Pending":     { color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.25)"  },
  "Resolved":    { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)"  },
  "Escalated":   { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)" },
};

const ENGINEERS = [
  { id: "E1", name: "Arjun S.",   avatar: "AS", color: "#6366f1" },
  { id: "E2", name: "Priya M.",   avatar: "PM", color: "#34d399" },
  { id: "E3", name: "Rahul K.",   avatar: "RK", color: "#fb923c" },
  { id: "E4", name: "Divya R.",   avatar: "DR", color: "#c084fc" },
  { id: "E5", name: "Unassigned", avatar: "—",  color: "#475569" },
];

// Deterministic engineer assignment based on ticket_id
function assignEngineer(ticket_id) {
  const idx = parseInt(ticket_id?.replace(/\D/g, "") || "0") % 4;
  return ENGINEERS[idx];
}

// SLA minutes by priority
const SLA_MINUTES = {
  critical: 15,
  high:     60,
  medium:   240,
  low:      480,
};

function StatusBadge({ status }) {
  const cfg = TICKET_STATUS[status] || TICKET_STATUS["New"];
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{
        color:      cfg.color,
        background: cfg.bg,
        border:     `1px solid ${cfg.border}`,
      }}>
      {status}
    </span>
  );
}

// ── Engineer avatar ────────────────────────────────────────────────────────

function EngineerAvatar({ engineer, size = "sm" }) {
  const dim = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center
        font-bold shrink-0`}
      style={{
        background: `${engineer.color}22`,
        border:     `1px solid ${engineer.color}55`,
        color:      engineer.color,
      }}>
      {engineer.avatar}
    </div>
  );
}

// ── Ticket row (queue table) ───────────────────────────────────────────────

function TicketRow({ ticket, index }) {
  const [expanded, setExpanded] = useState(false);
  const engineer   = assignEngineer(ticket.ticket_id);
  const slaMinutes = SLA_MINUTES[ticket.priority] || 240;
  const sentCfg    = SENTIMENT_CONFIG[ticket.sentiment] || SENTIMENT_CONFIG.neutral;

  // Derive a status from ticket state
  const status = ticket.critical   ? "Escalated"
               : ticket.escalate   ? "In Progress"
               : ticket.sentiment === "positive" ? "Resolved"
               : index === 0       ? "In Progress"
               : "Assigned";

  return (
    <>
      <tr
        className="border-b border-slate-800/50 hover:bg-white/[0.015]
          transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}>

        {/* Position */}
        <td className="px-4 py-3 text-center">
          <span className="text-[11px] text-slate-600 font-mono">
            #{index + 1}
          </span>
        </td>

        {/* Ticket ID */}
        <td className="px-4 py-3">
          <span className="text-[11px] font-mono text-indigo-400 font-semibold">
            {ticket.ticket_id}
          </span>
        </td>

        {/* Message preview */}
        <td className="px-4 py-3 max-w-[200px]">
          <p className="text-[11px] text-slate-300 truncate">{ticket.message}</p>
        </td>

        {/* Priority */}
        <td className="px-4 py-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
            ${PRIORITY_BADGE[ticket.priority]}`}>
            {ticket.priority}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={status} />
        </td>

        {/* Assigned engineer */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <EngineerAvatar engineer={engineer} size="sm" />
            <span className="text-[11px] text-slate-400">{engineer.name}</span>
          </div>
        </td>

        {/* Sentiment */}
        <td className="px-4 py-3">
          <span className={`flex items-center gap-1 text-[10px] w-fit
            px-2 py-0.5 rounded-full border ${sentCfg.bg} ${sentCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sentCfg.dot}`} />
            {sentCfg.label}
          </span>
        </td>

        {/* SLA */}
        <td className="px-4 py-3 min-w-[120px]">
          <SLATimer
            createdTime={ticket.time}
            slaMinutes={slaMinutes}
            compact
          />
        </td>

        {/* Expand chevron */}
        <td className="px-4 py-3 text-center">
          <span
            className="text-slate-700 text-[10px] transition-transform duration-200
              inline-block"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="border-b border-slate-800/30">
          <td colSpan={9} className="px-4 pb-4 pt-0">
            <div
              className="rounded-xl p-4 mt-1"
              style={{
                background: "rgba(30,41,59,0.5)",
                border:     "1px solid rgba(51,65,85,0.4)",
              }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* SLA full */}
                <div>
                  <p className="text-[10px] text-slate-600 uppercase
                    tracking-wider mb-2">SLA Progress</p>
                  <SLATimer
                    createdTime={ticket.time}
                    slaMinutes={slaMinutes}
                  />
                  <p className="text-[10px] text-slate-600 mt-1.5">
                    Target: {slaMinutes < 60
                      ? `${slaMinutes}m`
                      : `${slaMinutes / 60}h`}
                  </p>
                </div>

                {/* Engineer detail */}
                <div>
                  <p className="text-[10px] text-slate-600 uppercase
                    tracking-wider mb-2">Assigned Engineer</p>
                  <div className="flex items-center gap-2">
                    <EngineerAvatar engineer={engineer} size="lg" />
                    <div>
                      <p className="text-sm text-white font-medium">
                        {engineer.name}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        FlowZint Operations Team
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <p className="text-[10px] text-slate-600 uppercase
                    tracking-wider mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {["Reassign", "Escalate", "Resolve", "Add Note"].map(action => (
                      <button
                        key={action}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg
                          transition-colors font-medium"
                        style={{
                          background: "rgba(51,65,85,0.5)",
                          border:     "1px solid rgba(71,85,105,0.6)",
                          color:      "#94a3b8",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                          e.currentTarget.style.color = "#a5b4fc";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(51,65,85,0.5)";
                          e.currentTarget.style.borderColor = "rgba(71,85,105,0.6)";
                          e.currentTarget.style.color = "#94a3b8";
                        }}>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Engineer workload card ─────────────────────────────────────────────────

function EngineerCard({ engineer, tickets }) {
  const assigned = tickets.filter(
    (_, i) => assignEngineer(tickets[i]?.ticket_id)?.id === engineer.id
  ).length;
  const active   = Math.min(assigned, 3);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(15,23,42,0.75)",
        border:     "1px solid rgba(51,65,85,0.45)",
      }}>
      <div className="flex items-center gap-3 mb-3">
        <EngineerAvatar engineer={engineer} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">{engineer.name}</p>
          <p className="text-[10px] text-slate-600">Operations Engineer</p>
        </div>
        {/* Online indicator */}
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400
            animate-pulse shrink-0" />
          <span className="text-[9px] text-emerald-400">Online</span>
        </span>
      </div>

      {/* Workload bar */}
      <div className="mb-1.5">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-600">Workload</span>
          <span style={{ color: engineer.color }}>{active} active</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${Math.min((active / 5) * 100, 100)}%`,
              background: engineer.color,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-700">
          {active === 0 ? "Available"
         : active < 3  ? "Moderate"
         :                "At capacity"}
        </span>
        <span className="text-[10px] font-mono"
          style={{ color: engineer.color }}>
          {active}/5 tickets
        </span>
      </div>
    </div>
  );
}

// ── Main dashboard component ───────────────────────────────────────────────

function HumanSupportDashboard({ ticketLog, escalationQueue }) {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [sortBy, setSortBy]   = useState("priority");

  // Combine all tickets — regular + escalated
  const allTickets = [
    ...escalationQueue,
    ...ticketLog.filter(t =>
      !escalationQueue.find(e => e.ticket_id === t.ticket_id)
    ),
  ];

  // Priority order for sorting
  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = allTickets
    .filter(t => {
      if (filter === "critical")  return t.critical;
      if (filter === "escalated") return t.escalate;
      if (filter === "open")      return !t.critical && t.sentiment !== "positive";
      return true;
    })
    .filter(t =>
      !search ||
      t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.message?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "priority")
        return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
      if (sortBy === "sentiment")
        return (a.sentiment || "").localeCompare(b.sentiment || "");
      return 0;
    });

  // Stats row
  const stats = [
    { label: "Total Open",  value: allTickets.length,                       color: "text-white",       icon: "🎫" },
    { label: "Critical",    value: allTickets.filter(t => t.critical).length, color: "text-red-400",   icon: "🚨" },
    { label: "In Queue",    value: escalationQueue.length,                   color: "text-orange-400",  icon: "⚡" },
    { label: "Resolved",    value: ticketLog.filter(t =>
                              t.sentiment === "positive").length,            color: "text-emerald-400", icon: "✅" },
  ];

  if (allTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3">👥</div>
        <h3 className="text-white font-semibold mb-1">No support tickets yet</h3>
        <p className="text-slate-500 text-sm">
          Tickets appear here as users submit support requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: "rgba(15,23,42,0.75)",
              border:     "1px solid rgba(51,65,85,0.45)",
            }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-2xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Engineer workload ──────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] text-slate-500 uppercase tracking-widest
          font-semibold mb-3">
          Engineer Workload
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ENGINEERS.filter(e => e.id !== "E5").map(eng => (
            <EngineerCard
              key={eng.id}
              engineer={eng}
              tickets={allTickets}
            />
          ))}
        </div>
      </div>

      {/* ── Ticket queue table ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h2 className="text-[10px] text-slate-500 uppercase tracking-widest
            font-semibold">
            Ticket Queue
          </h2>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="ml-auto text-[11px] px-3 py-1.5 rounded-lg
              focus:outline-none focus:border-indigo-500 transition-colors"
            style={{
              background: "rgba(15,23,42,0.8)",
              border:     "1px solid rgba(51,65,85,0.5)",
              color:      "#cbd5e1",
            }}
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg
              focus:outline-none cursor-pointer"
            style={{
              background: "rgba(15,23,42,0.8)",
              border:     "1px solid rgba(51,65,85,0.5)",
              color:      "#94a3b8",
            }}>
            <option value="priority">Sort: Priority</option>
            <option value="sentiment">Sort: Sentiment</option>
          </select>

          {/* Filters */}
          <div className="flex items-center gap-1.5">
            {["all", "critical", "escalated", "open"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[10px] px-2.5 py-1 rounded-lg capitalize
                  transition-colors font-medium"
                style={{
                  background: filter === f
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(30,41,59,0.5)",
                  border: filter === f
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid rgba(51,65,85,0.4)",
                  color: filter === f ? "#a5b4fc" : "#64748b",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {["#", "Ticket", "Issue", "Priority", "Status",
                    "Engineer", "Sentiment", "SLA", ""].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] text-slate-600
                        uppercase tracking-wider font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}
                      className="px-4 py-8 text-center text-slate-600 text-sm">
                      No tickets match the current filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ticket, i) => (
                    <TicketRow
                      key={ticket.ticket_id}
                      ticket={ticket}
                      index={i}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filtered.length > 0 && (
            <div
              className="px-4 py-3 flex items-center justify-between
                border-t border-slate-800/50">
              <span className="text-[10px] text-slate-700">
                Showing {filtered.length} of {allTickets.length} tickets
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full
                  animate-pulse" />
                <span className="text-[10px] text-emerald-400">Live</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
// ── Ticket Workspace ───────────────────────────────────────────────────────

function TicketWorkspace({ ticket, onClose, onResolve, onEscalate }) {
  if (!ticket) return null;
  const { toast } = useToast();

  const engineer  = assignEngineer(ticket.ticket_id);
  const slaMin    = SLA_MINUTES[ticket.priority] || 240;
  const sentCfg   = SENTIMENT_CONFIG[ticket.sentiment] || SENTIMENT_CONFIG.neutral;

  const status = ticket.critical   ? "Escalated"
               : ticket.escalate   ? "In Progress"
               : "Assigned";

  // Suggested AI resolution based on category
  const AI_SUGGESTIONS = {
    workflow: "Verify webhook endpoint returns HTTP 200 within 5s. Check execution log under Workflows > History. Enable retry policy under Error Handling.",
    billing:  "Review credit consumption at Account > Usage & Credits. Check for looping workflows. Top-up available at Account > Credits.",
    api:      "Regenerate API key at Settings > Developer > API Keys. Confirm Bearer token format. Verify IP whitelist includes server IP.",
    access:   "Confirm invitation accepted. Verify role under Settings > Team Management. Check SSO identity provider configuration.",
  };

  const suggestion = ticket.category
    ? AI_SUGGESTIONS[ticket.category]
    : "Route to appropriate specialist team for further investigation.";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>

      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "rgba(10,15,30,0.98)",
          border:     "1px solid rgba(51,65,85,0.6)",
          boxShadow:  "0 40px 80px rgba(0,0,0,0.7)",
        }}>

        {/* Workspace header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 text-sm font-mono font-bold">
              {ticket.ticket_id}
            </span>
            <StatusBadge status={status} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full
              ${PRIORITY_BADGE[ticket.priority]}`}>
              {ticket.priority}
            </span>
            {ticket.critical && (
              <span className="flex items-center gap-1 text-[10px] bg-red-950
                border border-red-700 text-red-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                CRITICAL
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Customer + Engineer row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4"
              style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.4)" }}>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                Customer
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800
                  flex items-center justify-center text-indigo-400 text-xs font-bold">
                  U
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Enterprise User</p>
                  <p className="text-[10px] text-slate-600">FlowZint Platform</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${sentCfg.dot}`} />
                <span className={`text-[11px] ${sentCfg.color}`}>
                  {sentCfg.label} sentiment
                </span>
              </div>
            </div>

            <div className="rounded-xl p-4"
              style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.4)" }}>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                Assigned Engineer
              </p>
              <div className="flex items-center gap-2.5">
                <EngineerAvatar engineer={engineer} size="lg" />
                <div>
                  <p className="text-sm text-white font-medium">{engineer.name}</p>
                  <p className="text-[10px] text-slate-600">FlowZint Operations</p>
                </div>
              </div>
              <div className="mt-3">
                <SLATimer createdTime={ticket.time} slaMinutes={slaMin} compact />
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
              Customer Issue
            </p>
            <div className="rounded-xl p-4"
              style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.4)" }}>
              <p className="text-sm text-slate-200 leading-relaxed">{ticket.message}</p>
              <p className="text-[10px] text-slate-600 mt-2">{ticket.time}</p>
            </div>
          </div>

          {/* AI reasoning summary */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
              AI Reasoning Summary
            </p>
            <div className="rounded-xl p-4"
              style={{
                background:  "rgba(15,23,42,0.8)",
                border:      "1px solid rgba(99,102,241,0.2)",
                boxShadow:   "0 0 16px rgba(99,102,241,0.05)",
              }}>
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">⚡</span>
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400">
                    <span className="text-indigo-400 font-medium">Intent:</span> support
                    {ticket.category && (
                      <> · <span className="text-indigo-400 font-medium">Domain:</span> {ticket.category}</>
                    )}
                    {ticket.ragUsed && (
                      <> · <span className="text-indigo-400 font-medium">RAG:</span> knowledge base used</>
                    )}
                    {ticket.multiAgent && (
                      <> · <span className="text-indigo-400 font-medium">Mode:</span> multi-agent</>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-indigo-400 font-medium">Sentiment:</span> {sentCfg.label}
                    {" · "}
                    <span className="text-indigo-400 font-medium">Priority:</span> {ticket.priority}
                    {" · "}
                    <span className="text-indigo-400 font-medium">Escalation:</span>{" "}
                    {ticket.escalate ? "triggered" : "not required"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI suggested resolution */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
              AI Suggested Resolution
            </p>
            <div className="rounded-xl p-4"
              style={{
                background: "rgba(52,211,153,0.05)",
                border:     "1px solid rgba(52,211,153,0.2)",
              }}>
              <p className="text-[11px] text-emerald-300 leading-relaxed">{suggestion}</p>
            </div>
          </div>

          {/* Pipeline mini */}
          {ticket.pipeline?.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                AI Pipeline Trace
              </p>
              <AIPipelinePanel pipeline={ticket.pipeline} visible />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/50">
            <button
              onClick={() => {
              onResolve(ticket.ticket_id);
             onClose();
            toast.success(`Ticket ${ticket.ticket_id} marked as resolved`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-medium transition-all duration-200"
              style={{
                background: "rgba(52,211,153,0.15)",
                border:     "1px solid rgba(52,211,153,0.35)",
                color:      "#34d399",
              }}>
              ✓ Close Incident
            </button>
            <button
              onClick={() => {
             onEscalate(ticket.ticket_id);
             onClose();
          toast.warn(`Ticket ${ticket.ticket_id} escalated to Enterprise Operations`);
            }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-medium transition-all duration-200"
              style={{
                background: "rgba(248,113,113,0.12)",
                border:     "1px solid rgba(248,113,113,0.3)",
                color:      "#f87171",
              }}>
              ⚡ 
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-medium transition-all duration-200 ml-auto"
              style={{
                background: "rgba(51,65,85,0.5)",
                border:     "1px solid rgba(71,85,105,0.5)",
                color:      "#94a3b8",
              }}>
              ↗ Reassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── Admin Operations Landing ───────────────────────────────────────────────

function OperationsDashboard({
  ticketLog, escalationQueue, trendPoints,
  onTicketClick, analytics,
}) {
  const critical   = ticketLog.filter(t => t.critical).length;
  const open       = ticketLog.filter(t => !t.critical && t.sentiment !== "positive").length;
  const resolved   = ticketLog.filter(t => t.sentiment === "positive").length;
  const aiRate     = ticketLog.length
    ? Math.round(((ticketLog.length - ticketLog.filter(t => t.escalate).length) / ticketLog.length) * 100)
    : 0;

  if (ticketLog.length === 0) {
  return (
    <EmptyState
      icon="👥"
      title="Human Engineers Standing By"
      description="Support engineers will appear here when the AI escalates tickets requiring human expertise. SLA timers activate automatically on escalation."
    />
  );
}
  return (
    <div className="space-y-6">

      {/* Critical alert banner */}
      {critical > 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{
            background: "rgba(248,113,113,0.08)",
            border:     "1px solid rgba(248,113,113,0.3)",
            boxShadow:  "0 0 24px rgba(248,113,113,0.08)",
          }}>
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 font-semibold text-sm">
              {critical} critical {critical === 1 ? "incident" : "incidents"} require immediate attention
            </p>
            <p className="text-red-400/60 text-xs mt-0.5">
              Enterprise Operations Team has been notified · SLA clock is running
            </p>
          </div>
          <span className="text-red-400 text-[11px] font-mono">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Tickets",  value: open,     color: "text-white",       icon: "🎫", sub: "Awaiting resolution" },
          { label: "Critical",        value: critical, color: "text-red-400",     icon: "🚨", sub: "Immediate action required" },
          { label: "Queue Waiting",   value: escalationQueue.length, color: escalationQueue.length > 0 ? "text-orange-400" : "text-slate-500", icon: "⚡", sub: "Human agents needed" },
          { label: "AI Resolution",   value: `${aiRate}%`, color: "text-emerald-400", icon: "✅", sub: `${resolved} auto-resolved` },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
              background: "rgba(15,23,42,0.8)",
              border:     "1px solid rgba(51,65,85,0.45)",
            }}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                {s.label}
              </span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-600">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Live ticket feed + queue side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent tickets — clickable */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.75)",
            border:     "1px solid rgba(51,65,85,0.45)",
          }}>
          <div className="flex items-center justify-between px-5 py-3.5
            border-b border-slate-800/50">
            <span className="text-white font-semibold text-sm">Live Ticket Feed</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[11px]">Live</span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {[...ticketLog].reverse().slice(0, 8).map(t => {
              const sentCfg = SENTIMENT_CONFIG[t.sentiment] || SENTIMENT_CONFIG.neutral;
              return (
                <button
                  key={t.ticket_id}
                  onClick={() => onTicketClick(t)}
                  className="w-full text-left flex items-start gap-3 px-5 py-3
                    border-b border-slate-800/40 last:border-0
                    hover:bg-white/[0.025] transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sentCfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[11px] font-mono text-indigo-400">
                        {t.ticket_id}
                      </span>
                      {t.critical && (
                        <span className="text-[9px] bg-red-900 text-red-300
                          border border-red-700 px-1.5 py-0.5 rounded font-bold">
                          CRITICAL
                        </span>
                      )}
                      {t.multiAgent && (
                        <span className="text-[9px] text-indigo-400">🤝</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{t.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded
                      ${PRIORITY_BADGE[t.priority]}`}>
                      {t.priority}
                    </span>
                    <p className="text-[9px] text-slate-700 mt-1">{t.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Escalation queue */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.75)",
            border: escalationQueue.length > 0
              ? "1px solid rgba(248,113,113,0.25)"
              : "1px solid rgba(51,65,85,0.45)",
          }}>
          <div className="flex items-center justify-between px-5 py-3.5
            border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              {escalationQueue.length > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="text-white font-semibold text-sm">Human Queue</span>
              {escalationQueue.length > 0 && (
                <span className="text-[10px] bg-red-900 text-red-300 border
                  border-red-700 px-2 py-0.5 rounded-full">
                  {escalationQueue.length} waiting
                </span>
              )}
            </div>
          </div>
          {escalationQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-slate-500 text-sm">Queue is clear</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {escalationQueue.map((item, i) => (
                <button
                  key={item.ticket_id}
                  onClick={() => onTicketClick(item)}
                  className="w-full text-left flex items-center gap-3 px-5 py-3
                    border-b border-slate-800/40 last:border-0
                    hover:bg-white/[0.025] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-red-950 border border-red-800
                    flex items-center justify-center shrink-0">
                    <span className="text-red-400 font-bold text-xs">#{i+1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-indigo-400">{item.ticket_id}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.message}</p>
                  </div>
                  <span className="text-[10px] text-red-400 shrink-0">
                    ~{(i+1)*3}m
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI health row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "AI Health",
            value: "Operational",
            color: "#34d399",
            icon:  "🟢",
            sub:   "All agents active",
          },
          {
            label: "RAG Hit Rate",
            value: ticketLog.length
              ? `${Math.round((ticketLog.filter(t => t.ragUsed).length / ticketLog.length) * 100)}%`
              : "—",
            color: "#6366f1",
            icon:  "📚",
            sub:   "Knowledge base utilisation",
          },
          {
            label: "Multi-Agent",
            value: ticketLog.filter(t => t.multiAgent).length,
            color: "#a5b4fc",
            icon:  "🤝",
            sub:   "Collaborative responses",
          },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: "rgba(15,23,42,0.75)",
              border:     "1px solid rgba(51,65,85,0.4)",
            }}>
            <span className="text-xl shrink-0">{s.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-600 mb-0.5">{s.label}</p>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-slate-700 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
// ── Reusable Empty State ───────────────────────────────────────────────

function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.12)",
        }}
      >
        {icon}
      </div>

      <h3 className="text-white font-semibold text-base mb-2">
        {title}
      </h3>

      <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-5">
        {description}
      </p>

      {action && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
// ── Toast System ───────────────────────────────────────────────────────────
// Usage: const { toast } = useToast();
//        toast.success("Ticket Escalated")
//        toast.error("Connection failed")
//        toast.info("AI Analysis Complete")
//        toast.warn("SLA approaching breach")

const ToastContext = React.createContext(null);

const TOAST_ICONS = {
  success: "✓",
  error:   "✕",
  warn:    "⚠",
  info:    "ℹ",
};

const TOAST_COLORS = {
  success: { border: "rgba(52,211,153,0.35)",  text: "#34d399", bg: "rgba(52,211,153,0.08)"  },
  error:   { border: "rgba(248,113,113,0.35)", text: "#f87171", bg: "rgba(248,113,113,0.08)" },
  warn:    { border: "rgba(251,191,36,0.35)",  text: "#fbbf24", bg: "rgba(251,191,36,0.08)"  },
  info:    { border: "rgba(99,102,241,0.35)",  text: "#a5b4fc", bg: "rgba(99,102,241,0.08)"  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const api = {
    success: (msg) => add(msg, "success"),
    error:   (msg) => add(msg, "error"),
    warn:    (msg) => add(msg, "warn"),
    info:    (msg) => add(msg, "info"),
    dismiss: (id)  => setToasts(prev => prev.filter(t => t.id !== id)),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5"
        style={{ width: "320px" }}
        aria-live="polite"
        aria-atomic="false">
        {toasts.map(t => {
          const c = TOAST_COLORS[t.type] || TOAST_COLORS.info;
          return (
            <div
              key={t.id}
              role="status"
              className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
              style={{
                background:     "rgba(10,15,28,0.97)",
                border:         `1px solid ${c.border}`,
                boxShadow:      "0 8px 32px rgba(0,0,0,0.5)",
                backdropFilter: "blur(12px)",
                animation:      "toastIn 0.22s ease both",
              }}>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center
                  text-[11px] font-bold shrink-0 mt-0.5"
                style={{ background: c.bg, color: c.text }}>
                {TOAST_ICONS[t.type]}
              </span>
              <p className="text-[13px] text-slate-200 flex-1 leading-snug">
                {t.message}
              </p>
              <button
                onClick={() => api.dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-slate-600 hover:text-slate-300 text-base
                  leading-none shrink-0 transition-colors"
                style={{ marginTop: "1px" }}>
                ×
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return { toast: ctx };
}
// ── Conversation Ticket Manager ────────────────────────────────────────────
// One ticket per conversation. Created on first message, reused thereafter.
// Reset only on clearChat / new conversation.

function createConversationTicket(priority = "medium", p1Incident = null) {
  const id = `SF-${Date.now().toString().slice(-6)}`;
  return {
    ticket_id:     id,
    priority:      p1Incident ? "critical" : priority,
    status:        "Open",
    created_at:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    last_updated:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    message_count: 1,
  };
}

function updateConversationTicket(existing, priority, p1Incident, messageCount) {
  // Escalate priority if P1 detected or incoming priority is more severe
  const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1 };
  const newPriority = p1Incident ? "critical"
    : (SEVERITY[priority] ?? 0) > (SEVERITY[existing.priority] ?? 0)
      ? priority
      : existing.priority;

  // Status lifecycle — never move backwards
  const statusProgression = { "Open": 1, "Investigating": 2, "Resolved": 3, "Closed": 4 };
  const nextStatus = p1Incident ? "Investigating"
    : messageCount >= 3         ? "Investigating"
    : existing.status;
  const finalStatus = (statusProgression[nextStatus] ?? 0) > (statusProgression[existing.status] ?? 0)
    ? nextStatus
    : existing.status;

  return {
    ...existing,
    priority:      newPriority,
    status:        finalStatus,
    last_updated:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    message_count: messageCount,
  };
}
function RecentTicketsPanel({ ticketLog }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5">
      <h2 className="text-lg font-semibold text-white mb-4">
        🎫 Recent Tickets
      </h2>

      {ticketLog.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No tickets yet.
        </p>
      ) : (
        ticketLog
          .slice()
          .reverse()
          .map(ticket => (
            <div
              key={ticket.ticket_id}
              className="flex justify-between items-center py-3 border-b border-slate-800"
            >
              <div>
                <div className="font-medium text-white">
                  {ticket.ticket_id}
                </div>

                <div className="text-xs text-slate-500">
                  {ticket.message}
                </div>
              </div>

              <span
                className={`px-2 py-1 rounded text-xs font-semibold
                  ${
                    ticket.priority === "critical"
                      ? "bg-red-600 text-white"
                      : ticket.priority === "high"
                      ? "bg-orange-600 text-white"
                      : ticket.priority === "medium"
                      ? "bg-yellow-600 text-black"
                      : "bg-green-600 text-white"
                  }`}
              >
                {ticket.status}
              </span>
            </div>
          ))
      )}
    </div>
  );
}
export default function App() {

  const [tab, setTab] = useState("chat");
  const [role, setRole] = useState(null);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [conversationId] = useState(
  () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
   );

  const [messages, setMessages] = useState([
    {
      id: 0,
      from: "bot",
      agentInfo: null,
      text: "Hi! I'm SupportFlow AI — the enterprise support intelligence for FlowZint's digital ecosystem.\n\nFlowZint builds SaaS systems, AI & automation platforms, enterprise systems, web infrastructure, and mobile platforms.\n\nDescribe your issue or select a scenario below.",
      time: now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationTicket, setConversationTicket] = useState(null);
  const conversationTicketRef = useRef(null);
  const [thinkingContext, setThinkingContext] = useState("general");
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

    setThinkingContext(detectThinkingContext(text));


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
       body: JSON.stringify({
    message: text,
    history: formatHistory(updated),
    conversation_id: conversationId,
    }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

    const data = await res.json();
    console.log("FULL DATA", data);
    console.log("PIPELINE", data.pipeline);
    const ticket = data.ticket;
    setLoading(false);
    const p1Incident = detectCriticalIncident(text);

const humanHandoff = data.human_handoff ?? false;

const assignedEngineer = data.engineer ?? null;

console.log("========== API RESPONSE ==========");
console.log(data);
console.log("human_handoff =", humanHandoff);
console.log("engineer =", assignedEngineer);
console.log("==================================");

    // ── One Ticket Per Conversation ─────────────────────────────
const msgCount = messages.filter(m => m.from === "user").length + 1;
const activeTicket = conversationTicketRef.current
  ? updateConversationTicket(
      conversationTicketRef.current,
      data.ticket?.priority ?? "medium",
      p1Incident,
      msgCount
    )
  : createConversationTicket(
      data.ticket?.priority ?? "medium",
      p1Incident
    );

conversationTicketRef.current = activeTicket;
setConversationTicket(activeTicket);
console.log("conversationTicket =", conversationTicket);
console.log("activeTicket =", activeTicket);
   const botMsg = {
  id: Date.now() + 1,
  from: "bot",
  text: "",
  streaming: true,

  time: now(),
    agentInfo: data.agent_info ?? null,
    agentInfo2:
    data.agent_info_2 && Object.keys(data.agent_info_2).length
      ? data.agent_info_2
      : null,
   multiAgent: (data.multi_agent ?? false) || p1Incident !== null,
   ragUsed: data.rag_used ?? false,
   sources: data.sources ?? [],
   pipeline: data.pipeline ?? [],
   model: data.model ?? null,
   memoryActive: !!(data.memory_debug?.issue),
   ticketId: activeTicket.ticket_id,
   priority: activeTicket.priority,
   p1Incident,
   humanHandoff,
   engineer: assignedEngineer,
   };
console.log("========== BOT MESSAGE ==========");
console.log(botMsg);
console.log("Human handoff:", humanHandoff);
console.log("Assigned engineer:", assignedEngineer);
console.log("=================================");

      let newMsgs = [...updated];
      if (ticket?.escalate && !ticket?.critical) {
        newMsgs.push({ id: Date.now() + 2, from: "escalation", text: "", time: t });
      }
      if (ticket?.critical) {
        newMsgs.push({ id: Date.now() + 3, from: "critical", ticket, text: "", time: t });
      }
      newMsgs.push(botMsg);
      setMessages(newMsgs);
    await streamText(
  data.reply,
  (chunk) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === botMsg.id
          ? { ...m, text: m.text + chunk }
          : m
      )
    );
  },
  () => {
    setMessages(prev =>
      prev.map(m =>
        m.id === botMsg.id
          ? { ...m, streaming: false }
          : m
      )
    );
  }
);

      if (data.model !== "static") {
       setTicketLog(prev => {
  const existing = prev.find(
    x => x.ticket_id === activeTicket.ticket_id
  );

  const updatedTicket = {
    ...ticket,
    ticket_id: activeTicket.ticket_id,
    priority: activeTicket.priority,
    status: activeTicket.status,
    message: text,
    time: t,
    ragUsed: data.rag_used ?? false,
  };

  if (existing) {
    return prev.map(x =>
      x.ticket_id === activeTicket.ticket_id
        ? updatedTicket
        : x
    );
  }

  return [...prev, updatedTicket];
});

       if (data.summary?.issue) {
  setSummaries(prev => {
    const existing = prev.find(
      s => s.ticket_id === activeTicket.ticket_id
    );

    const summary = {
      ...data.summary,
      ticket_id: activeTicket.ticket_id,
    };

    if (existing) {
      return prev.map(s =>
        s.ticket_id === activeTicket.ticket_id
          ? summary
          : s
      );
    }

    return [summary, ...prev];
  });
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
  conversationTicketRef.current = null;
  setConversationTicket(null);
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
    fetch(
    `${API_URL.replace("/api/chat/", "")}/api/chat/reset?conversation_id=${conversationId}`,
    {
        method: "POST",
    }
   ).catch(() => {});
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
      <style>{`
    @keyframes blink {
    0%,100% { opacity:1; }
    50% { opacity:0; }
    }
    `}</style>

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
             <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} ariaLabel="AI Analytics dashboard">
                📊 AI Analytics
                {analytics.total > 0 && (
                  <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {analytics.total}
                  </span>
                )}
              </TabBtn>

             <TabBtn active={tab === "summaries"} onClick={() => setTab("summaries")} ariaLabel="AI Resolution Reports">
                📋 AI Reports
                {summaries.length > 0 && (
                  <span className="ml-1.5 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {summaries.length}
                  </span>
                )}
              </TabBtn>

             <TabBtn active={tab === "queue"} onClick={() => setTab("queue")} ariaLabel="Human Escalation Queue">
                🚨 Escalation Queue
                {escalationQueue.length > 0 && (
                  <span className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                    {escalationQueue.length}
                  </span>
                )}
              </TabBtn>
               <TabBtn
           active={tab === "support"}
          onClick={() => setTab("support")}
          >
         👥 Human Support
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

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-6 sm:py-8 space-y-5">
            <div className="max-w-2xl mx-auto w-full space-y-4">

              {messages.map((msg) => {
                if (msg.from === "escalation") return <EscalationNotice key={`esc-${msg.time}`} />;
                if (msg.from === "critical")   return <CriticalNotice key={`crit-${msg.ticket?.ticket_id}`} queuePos={msg.ticket?.queue_position ?? 1} />;
                return <ChatMessage key={msg.id} msg={msg} />;
              })}
              {loading && <AIThinkingPanel context={thinkingContext} />}

              {error && (
                <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                  <span className="text-red-400">⚠</span>
                  <span><strong>Connection error:</strong> {error} — Is FastAPI running on port 8000?</span>
                </div>
              )}

              {messages.length === 1 && !loading && (
  <div className="mt-6">
    <p className="text-[10px] text-slate-600 mb-4 text-center uppercase tracking-widest font-medium">
      Enterprise Support Scenarios
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SUGGESTED.map((q) => (
        <button key={q.text} onClick={() => sendMessage(q.text)}
          className="text-left rounded-2xl px-5 py-4 transition-all duration-200 group"
          style={{
            background:  "rgba(15,23,42,0.7)",
            border:      "1px solid rgba(51,65,85,0.5)",
            boxShadow:   "0 2px 8px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform   = "translateY(-2px)";
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
            e.currentTarget.style.boxShadow   = "0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform   = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(51,65,85,0.5)";
            e.currentTarget.style.boxShadow   = "0 2px 8px rgba(0,0,0,0.2)";
          }}>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5 group-hover:scale-110 transition-transform duration-200">
              {q.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 mb-1 leading-tight">
                {q.text.length > 40 ? q.text.slice(0, 40) + "…" : q.text}
              </p>
              <p className="text-[11px] text-slate-600 leading-snug">
                {q.text}
              </p>
            </div>
            <span className="text-slate-700 group-hover:text-slate-500
              transition-colors text-xs mt-0.5 shrink-0">
              →
            </span>
          </div>
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
    <SystemStatusPanel ticketLog={ticketLog} />
    <RecentTicketsPanel ticketLog={ticketLog} />
    <EnterpriseAnalyticsDashboard
      ticketLog={ticketLog}
      summaries={summaries}
      escalationQueue={escalationQueue}
      trendPoints={trendPoints}
    />

    {analytics.total === 0 && (
      <EmptyState
        icon="📊"
        title="No AI Interactions Processed Yet"
        description="Analytical insights will populate here as customers submit support requests through the AI portal."
        action="Open Customer Portal →"
        onAction={() => {
          setRole("user");
          setTab("chat");
        }}
      />
    )}
  </div>
)}

      {/* ══ SUMMARIES TAB ════════════════════════════════════════ */}
      {tab === "summaries" && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {summaries.length === 0 ? (
            <EmptyState
  icon="📋"
  title="No AI Resolution Reports Generated"
  description="Detailed AI reasoning summaries are created automatically after each support interaction and stored here for operational review."
  action="Start a Support Session →"
  onAction={() => {
    setRole("user");
    setTab("chat");
  }}
/>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total",     value: summaries.length,                                                    color: "text-white",       icon: "📋" },
                  { label: "Escalated", value: summaries.filter(s => s.resolution_status === "Escalated").length,   color: "text-red-400",     icon: "⚡" },
                  { label: "Resolved",  value: summaries.filter(s => s.resolution_status === "Resolved").length,    color: "text-emerald-400", icon: "✅" },
                  { label: "Pending",   value: summaries.filter(s => ["Pending","In Progress"].includes(s.resolution_status)).length, color: "text-yellow-400", icon: "⏳" },
                ].map(s => (
                  <div key={s.label}className="sf-card sf-card-hover p-4 flex items-center gap-3">
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
      <h2 className="text-white font-bold text-lg">
        Enterprise Operations Queue
      </h2>

      <span className="bg-red-900 text-red-300 border border-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
        {escalationQueue.length} waiting
      </span>
    </div>

    {escalationQueue.length === 0 ? (
      <EmptyState
  icon="✅"
  title="No Tickets Require Human Intervention"
  description="The AI is resolving all current support requests autonomously. Escalated tickets will appear here when human expertise is needed."
  />
    ) : (
      <div className="space-y-3">
        {escalationQueue.map((item, i) => (
          <div
            key={item.ticket_id}
            className="sf-card p-5 flex items-start gap-4"
            style={{ borderColor: "rgba(248,113,113,0.3)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-700 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] text-red-400 uppercase">Pos</span>
              <span className="text-red-300 font-bold text-lg leading-none">
                #{i + 1}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-mono text-indigo-400 font-semibold">
                  {item.ticket_id}
                </span>

                <span className="text-[11px] bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                  CRITICAL
                </span>

                <span className="text-[11px] text-slate-500">
                  {item.agent}
                </span>
              </div>

              <p className="text-sm text-slate-300 mb-3 truncate">
                {item.message}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const cfg =
                    SENTIMENT_CONFIG[item.sentiment] ||
                    SENTIMENT_CONFIG.neutral;

                  return (
                    <span
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                      />
                      {cfg.label}
                    </span>
                  );
                })()}

                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[item.priority]}`}
                >
                  {item.priority}
                </span>

                <span className="text-[11px] text-slate-600">
                  {item.time}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-2">
                <div className="text-[10px] text-slate-500 mb-0.5">
                  Est. Wait
                </div>

                <div className="text-white font-bold text-sm">
                  ~{(i + 1) * 3} min
                </div>
              </div>

              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-red-400">
                  Waiting
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
{/* ══ SUPPORT TAB ════════════════════════════════════════════ */}
{tab === "support" && (
  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
    <div className="flex items-center gap-3 mb-6">
      <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />

      <h2 className="text-white font-bold text-lg">
        Human Support Operations
      </h2>

      <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-2.5 py-1 rounded-full">
        FlowZint Enterprise
      </span>
    </div>

    <HumanSupportDashboard
      ticketLog={ticketLog}
      escalationQueue={escalationQueue}
    />
  </div>
)}

</div>
);
}