"""
SupportFlow AI — Enterprise Conversation Memory
================================================
Maintains a structured support case context per conversation session.
Each conversation_id gets its own isolated ConversationMemory instance
stored in MEMORY_STORE. No global single instance.

Used exclusively by chat.py — never exposes memory to the user.
"""

import re
from dataclasses import dataclass, field
from typing import Optional


# ── In-memory store — keyed by conversation_id ────────────────────────────

MEMORY_STORE: dict[str, "ConversationMemory"] = {}


def get_memory(conversation_id: str) -> "ConversationMemory":
    """
    Returns the ConversationMemory for this conversation_id.
    Creates a new one if it does not exist yet.
    """
    if conversation_id not in MEMORY_STORE:
        MEMORY_STORE[conversation_id] = ConversationMemory()
    return MEMORY_STORE[conversation_id]


def reset_memory(conversation_id: str) -> None:
    """
    Fully removes the memory for this conversation_id.
    Called when the user clears the chat.
    """
    if conversation_id in MEMORY_STORE:
        del MEMORY_STORE[conversation_id]


def cleanup_old_sessions(max_sessions: int = 500) -> None:
    """
    Prevents unbounded memory growth on long-running servers.
    Drops the oldest sessions when the store exceeds max_sessions.
    Call this periodically or on each request (cheap check).
    """
    if len(MEMORY_STORE) > max_sessions:
        # MEMORY_STORE preserves insertion order (Python 3.7+)
        # Drop the oldest 20% of sessions
        to_drop = max_sessions // 5
        for key in list(MEMORY_STORE.keys())[:to_drop]:
            del MEMORY_STORE[key]


# ── Continuation signals ───────────────────────────────────────────────────

CONTINUATION_SIGNALS = [
    # English
    "still", "same", "again", "same issue", "same problem", "not fixed",
    "doesn't work", "still failing", "try again", "it failed", "didnt work",
    "didn't work", "no luck", "not working", "now broken", "worked before",
    "still not", "not resolved", "happening again", "persists", "continues",
    # Hinglish
    "abhi bhi", "phir se", "nahi hua", "kaam nahi", "wahi problem",
    "same hai", "fix nahi", "ho raha hai",
    # Tenglish
    "inkaa", "avvatledu", "same ga", "fix kaaledu", "problem undi",
]

# ── Topic switch signals ───────────────────────────────────────────────────
TOPIC_SWITCH_SIGNALS = [
    "different issue",
    "another issue",
    "another problem",
    "new issue",
    "new problem",
    "different problem",
    "actually",
    "by the way",
    "also",
    "also have",
    "now",
    "now i have",
    "i have",
    "separate issue",
    "unrelated",
    "moving on",
    "switching",

    # Conversation transitions
    "by the way",
    "actually",
]

# ── Domain keyword maps ────────────────────────────────────────────────────

DOMAIN_KEYWORDS = {
    "workflow": [
        "workflow", "trigger", "pipeline", "execution", "automation",
        "webhook", "cron", "scheduled", "avvatledu", "task engine",
    ],
    "billing": [
        "billing", "credit", "payment", "subscription", "invoice",
        "plan", "refund", "pricing", "credits",
    ],
    "api": [
        "api", "endpoint", "401", "403", "500", "token", "oauth",
        "sdk", "integration", "timeout", "request", "response",
    ],
    "access": [
        "login", "access", "password", "otp", "2fa", "permission",
        "locked", "sso", "workspace", "dashboard", "session",
    ],
}

# ── Error code extraction ──────────────────────────────────────────────────

ERROR_CODE_PATTERN = re.compile(
    r'\b(4\d{2}|5\d{2}|ERR[-_]?\w+|error\s*\w+)\b', re.IGNORECASE
)

# ── Support case dataclass ─────────────────────────────────────────────────

@dataclass
class SupportCase:
    """
    Internal memory object representing the current support case.
    Never serialized to the user — only used for AI context injection.
    """
    issue:              Optional[str]  = None
    category:           Optional[str]  = None
    secondary_category: Optional[str]  = None
    workflow_id:        Optional[str]  = None
    api_endpoint:       Optional[str]  = None
    error_codes:        list[str]      = field(default_factory=list)
    root_cause:         Optional[str]  = None
    attempts:           int            = 0
    resolution_status:  str            = "open"
    escalated:          bool           = False
    archived_issues:    list[dict]     = field(default_factory=list)
    completed_steps: list[str] = field(default_factory=list)
    ticket_id: Optional[str] = None


# ── Conversation memory class ──────────────────────────────────────────────

class ConversationMemory:
    """
    Manages the support case context for a single isolated chat session.
    One instance per conversation_id — stored in MEMORY_STORE.
    """

    RAW_HISTORY_LIMIT = 6

    def __init__(self):
        self.case     = SupportCase()
        self._history: list[dict] = []

    # ── Public API ─────────────────────────────────────────────────

    def update(self, user_message: str, assistant_reply: str) -> None:
        """
        Call this AFTER the LLM responds.
        Updates case context from the exchange.
        """
        self._history.append({"role": "user",      "content": user_message})
        self._history.append({"role": "assistant",  "content": assistant_reply})
        self._extract_context(user_message)
        reply = assistant_reply.lower()
        if "webhook" in reply and "webhook" not in self.case.completed_steps:
          self.case.completed_steps.append("webhook")
 
        if "trigger" in reply and "trigger" not in self.case.completed_steps:
          self.case.completed_steps.append("trigger")
 
        if "execution log" in reply and "execution log" not in self.case.completed_steps:
          self.case.completed_steps.append("execution log")

        if "api endpoint" in reply and "api endpoint" not in self.case.completed_steps:
          self.case.completed_steps.append("api endpoint")
        self._infer_status(user_message, assistant_reply)

    def is_continuation(self, message: str) -> bool:
        """
        Returns True if this message continues the current issue
        rather than starting a new topic.
        """
        lowered = message.lower().strip()
        if len(lowered.split()) <= 3 and self.case.issue:
            return True
        return any(sig in lowered for sig in CONTINUATION_SIGNALS)

    def is_topic_switch(self, message: str) -> bool:
      """
    Returns True when the user explicitly moves to a new domain.
    Requires either:
    1. A topic-switch phrase, OR
    2. A detected change in domain.
     """
      lowered = message.lower()

    # Detect the new domain first
      new_domain = self._detect_primary_domain(lowered)

    # Check for explicit switch phrases
      has_switch = any(sig in lowered for sig in TOPIC_SWITCH_SIGNALS)

    # If the user mentions a different domain, treat it as a topic switch
      if (
        self.case.category is not None
        and new_domain is not None
        and new_domain != self.case.category
      ):
        has_switch = True

      domain_changed = (
        new_domain is not None
        and new_domain != self.case.category
      )

      return has_switch and domain_changed
 
    def handle_topic_switch(self, message: str) -> None:
        """
        Archives the current case and starts a fresh context
        for the newly detected domain.
        """
        if self.case.issue:
            self.case.archived_issues.append({
                "issue":    self.case.issue,
                "category": self.case.category,
                "status":   self.case.resolution_status,
            })
        archived            = self.case.archived_issues
        new_domain          = self._detect_primary_domain(message.lower())
        self.case           = SupportCase(archived_issues=archived)
        self.case.category  = new_domain

    def build_memory_prompt(self) -> str:
        """
        Returns a system-level context block for the LLM.
        Returns empty string when no case context exists yet.
        """
        if not self.case.issue and not self.case.category:
            return ""

        lines = [
            "[SUPPORT CASE CONTEXT — internal use only, do not repeat to user]"
        ]

        if self.case.issue:
            lines.append(f"Current Issue: {self.case.issue}")
        if self.case.category:
            lines.append(f"Category: {self.case.category.title()}")
        if self.case.secondary_category:
            lines.append(f"Secondary Category: {self.case.secondary_category.title()}")
        if self.case.workflow_id:
            lines.append(f"Workflow ID: {self.case.workflow_id}")
        if self.case.api_endpoint:
            lines.append(f"API Endpoint: {self.case.api_endpoint}")
        if self.case.error_codes:
            lines.append(f"Error Codes: {', '.join(self.case.error_codes)}")
        if self.case.root_cause:
            lines.append(f"Root Cause: {self.case.root_cause}")

        lines.append(f"Troubleshooting Attempts: {self.case.attempts}")
        if self.case.completed_steps:
         lines.append(
          f"Completed Troubleshooting: {', '.join(self.case.completed_steps)}"
         )
        lines.append(f"Resolution Status: {self.case.resolution_status.title()}")

        if self.case.escalated:
            lines.append("Escalated: Yes — enterprise operations team notified")

        if self.case.archived_issues:
            lines.append("\nPreviously resolved issues this session:")
            for arch in self.case.archived_issues:
                lines.append(
                    f"  - {arch['issue']} ({arch['category']}) — {arch['status']}"
                )

        lines.append(
            "\nINSTRUCTION: Use this context to understand follow-up messages. "
            "When the user says 'still', 'same issue', 'not fixed', etc., "
            "reference the current issue above. "
            "Do NOT ask the user to repeat information already captured here."
        )

        return "\n".join(lines)

    def build_continuation_hint(self, message: str) -> str:
         """
        Enriches ambiguous follow-ups with explicit case context
        so the LLM understands what they refer to.
        """
         if not self.is_continuation(message) or not self.case.issue:
            return message

         parts = [f"Follow-up regarding: {self.case.issue}"]

         if self.case.category:
            parts.append(f"Category: {self.case.category}")

         if self.case.resolution_status:
            parts.append(f"Status: {self.case.resolution_status}")

         hint = " | ".join(parts)
         return f"[{hint}]\n\n{message}"


    # ==========================================================
    # AGENT LOCKING
    # ==========================================================

    def should_lock_agent(self, message: str) -> bool:
        lowered = message.lower().strip()

        # No active case
        if not self.case.category:
            return False

        # User changed topic?
        new_category = self._detect_primary_domain(lowered)

        if (
            new_category
            and new_category != self.case.category
        ):
            return False

        FOLLOWUP_PHRASES = [
            "still",
            "still not working",
            "still failing",
            "still happening",
            "same issue",
            "same problem",
            "same error",
            "didn't work",
            "didnt work",
            "doesn't work",
            "doesnt work",
            "again",
            "continue",
            "what next",
            "next step",
            "what should i do next",
            "what do i do",
            "then",
            "then what",
            "what now",
            "already tried",
            "tried that",
            "done that",
            "tried it",
        ]

        if any(p in lowered for p in FOLLOWUP_PHRASES):
            return True

        if len(lowered.split()) <= 6 and self.case.issue:
            return True

        if lowered.startswith(
            ("what", "why", "how", "when", "where", "then", "next")
        ):
            return True

        return False


    def get_locked_agent_key(self):
        """
        Return the agent key for the current case.
        """
        return self.case.category


    # ==========================================================


    def build_processed_history(self) -> list[dict]:
        """
        Returns conversation history for the LLM.
        Compresses old exchanges when the conversation is long
        to stay within token limits.
        """
        exchanges = self._pair_exchanges()

        if len(exchanges) <= self.RAW_HISTORY_LIMIT:
            return self._history.copy()

        old = exchanges[:-self.RAW_HISTORY_LIMIT]
        recent = exchanges[-self.RAW_HISTORY_LIMIT:]

        summary_lines = ["[EARLIER CONVERSATION SUMMARY]"]

        for user_msg, ai_msg in old:
            summary_lines.append(f"User: {user_msg[:100]}")
            snippet = ai_msg[:150] + "..." if len(ai_msg) > 150 else ai_msg
            summary_lines.append(f"AI: {snippet}")

        result = [
            {
                "role": "system",
                "content": "\n".join(summary_lines)
            }
        ]

        for user_msg, ai_msg in recent:
            result.append(
                {
                    "role": "user",
                    "content": user_msg,
                }
            )
            result.append(
                {
                    "role": "assistant",
                    "content": ai_msg,
                }
            )

        return result

    def mark_escalated(self) -> None:
        self.case.escalated         = True
        self.case.resolution_status = "escalated"

    def mark_resolved(self) -> None:
        self.case.resolution_status = "resolved"

    def reset(self) -> None:
        """Wipe this session's memory completely."""
        self.case     = SupportCase()
        self._history = []

    # ── Private helpers ────────────────────────────────────────────

    def _extract_context(self, message: str) -> None:
        lowered = message.lower()

        if not self.case.category:
            self.case.category = self._detect_primary_domain(lowered)

        if self.case.category and not self.case.secondary_category:
            self.case.secondary_category = self._detect_secondary_domain(
                lowered, self.case.category
            )

        codes = ERROR_CODE_PATTERN.findall(message)
        for code in codes:
            if code.upper() not in [c.upper() for c in self.case.error_codes]:
                self.case.error_codes.append(code.upper())

        wf_match = re.search(
            r'\b(WF[-_]?\d+|workflow[\s_-]?id[\s:]+(\S+))\b',
            message, re.IGNORECASE
        )
        if wf_match and not self.case.workflow_id:
            self.case.workflow_id = wf_match.group(0)

        ep_match = re.search(r'(https?://\S+|/[a-z0-9/_-]{3,})', message)
        if ep_match and not self.case.api_endpoint:
            self.case.api_endpoint = ep_match.group(0)

        if not self.case.issue and len(message.split()) >= 3:
            self.case.issue = message[:120].strip()

        if self.is_continuation(message):
            self.case.attempts += 1

    def _infer_status(self, user_message: str, ai_reply: str) -> None:
        user_lower = user_message.lower()
        ai_lower   = ai_reply.lower()

        resolved_signals = ["worked", "fixed", "resolved", "thank", "perfect", "solved"]
        if any(sig in user_lower for sig in resolved_signals):
            self.case.resolution_status = "resolved"
            return

        troubleshooting_signals = ["check", "verify", "navigate", "try", "restart"]
        if (any(sig in ai_lower for sig in troubleshooting_signals)
                and self.case.resolution_status == "open"):
            self.case.resolution_status = "troubleshooting"

    def _detect_primary_domain(self, lowered: str) -> Optional[str]:
        scores = {
            domain: sum(1 for kw in kws if kw in lowered)
            for domain, kws in DOMAIN_KEYWORDS.items()
        }
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else None

    def _detect_secondary_domain(
        self, lowered: str, primary: str
    ) -> Optional[str]:
        scores = {
            domain: sum(1 for kw in kws if kw in lowered)
            for domain, kws in DOMAIN_KEYWORDS.items()
            if domain != primary
        }
        if not scores:
            return None
        best = max(scores, key=scores.get)
        return best if scores[best] >= 1 else None

    def _pair_exchanges(self) -> list[tuple[str, str]]:
        pairs = []
        i = 0
        while i < len(self._history) - 1:
            if (self._history[i]["role"]   == "user"
                    and self._history[i+1]["role"] == "assistant"):
                pairs.append((
                    self._history[i]["content"],
                    self._history[i+1]["content"],
                ))
                i += 2
            else:
                i += 1
        return pairs