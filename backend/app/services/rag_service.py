import os
import re

# ── Load FAQ once at startup ───────────────────────────────────────

FAQ_PATH = os.path.join(os.path.dirname(__file__), "../knowledge_base/faq.txt")

def _load_faq() -> dict[str, str]:
    """
    Parse faq.txt into a dict:
      { "RETURNS": "full section text...", "SHIPPING": "...", ... }
    """
    sections: dict[str, str] = {}

    try:
        with open(FAQ_PATH, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"⚠️  faq.txt not found at {FAQ_PATH}")
        return sections

    # Split on [SECTION_NAME] headers
    parts = re.split(r"\[([A-Z]+)\]", content)

    # parts looks like: ['', 'RETURNS', 'text...', 'SHIPPING', 'text...']
    it = iter(parts[1:])  # skip leading empty string
    for header, body in zip(it, it):
        sections[header.strip()] = body.strip()

    return sections

# Load once when module is imported — not on every request
FAQ_SECTIONS = _load_faq()

# Keyword → section mapping (add more as your FAQ grows)
TOPIC_KEYWORDS: dict[str, list[str]] = {
    "ABOUT_FLOWZINT": [
        "flowzint", "about", "company", "who are you", "what is flowzint",
        "contact", "phone", "email", "website", "services offered",
    ],
    "SERVICES": [
        "services", "saas", "mobile", "web", "enterprise system",
        "ai automation", "what do you offer", "what does flowzint do",
        "digital transformation", "software development",
    ],
    "WORKFLOW": [
        "workflow", "automation", "trigger", "action", "flow", "pipeline",
        "task", "scheduled", "cron", "execution", "failed", "not running",
        "stuck", "delay", "webhook", "automate", "not triggering",
        "workflow error", "execution failed", "avvatledu", "run avvatledu",
    ],
    "BILLING": [
        "billing", "invoice", "subscription", "plan", "upgrade", "downgrade",
        "payment", "charge", "credit", "ai credits", "credits", "quota",
        "limit", "renew", "renewal", "refund", "receipt", "overage",
        "usage", "balance", "tier", "pricing", "upi", "razorpay",
        "credit teerindi", "payment fail ayyindi",
    ],
    "ACCESS": [
        "login", "access", "dashboard", "account", "password", "sign in",
        "locked", "otp", "2fa", "two factor", "sso", "permissions",
        "role", "team", "member", "invite", "user management", "admin",
        "cannot access", "session", "logout", "profile", "settings",
        "workspace", "organization", "onboarding", "setup",
        "login avvatledu", "login nahi ho raha", "otp raledu",
    ],
    "API": [
        "api", "api key", "endpoint", "rest", "sdk", "integration",
        "connect", "oauth", "token", "rate limit", "401", "403", "500",
        "request", "response", "payload", "header", "authentication",
        "webhook", "callback", "timeout", "connection refused",
        "api work avvatledu", "api nahi chal raha",
    ],
    "ONBOARDING": [
        "onboarding", "setup", "getting started", "first time", "new account",
        "tutorial", "guide", "template", "integration template", "free trial",
        "help center", "documentation", "wizard",
    ],
    "SUPPORT_SLA": [
        "sla", "response time", "support hours", "how long", "when will",
        "emergency", "maintenance", "uptime", "99.9", "priority support",
        "enterprise support", "support plan",
    ],
}

# ── Public API ─────────────────────────────────────────────────────

def get_relevant_context(user_message: str, max_sections: int = 2) -> str:
    """
    Match user message against FAQ sections using keyword scoring.
    Returns a formatted context string ready to inject into the AI prompt.
    Returns empty string if nothing relevant is found.
    """
    lowered = user_message.lower()
    scores: dict[str, int] = {}

    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lowered)
        if score > 0:
            scores[topic] = score

    if not scores:
        return ""  # No relevant FAQ content — AI answers from general knowledge

    # Sort by score descending, take top N sections
    top_topics = sorted(scores, key=scores.get, reverse=True)[:max_sections]

    context_parts = []
    for topic in top_topics:
        if topic in FAQ_SECTIONS:
            context_parts.append(f"[{topic} POLICY]\n{FAQ_SECTIONS[topic]}")

    return "\n\n".join(context_parts)