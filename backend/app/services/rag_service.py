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
        "flowzint", "about", "who is flowzint", "what is flowzint",
        "company", "founded", "vision", "mission", "what do you do",
        "billion dollar", "technology company",
    ],
    "CONTACT": [
        "contact", "email", "phone", "reach", "support team",
        "helpdesk", "get in touch", "how to contact", "reach out",
        "message", "call", "enquiry",
    ],
    "FLOWZINT_AI": [
        "flowzint ai", "upcoming ai", "ai platform", "ai launch",
        "get notified", "ai product", "new ai", "ai release",
        "autonomous digital", "ai announcement",
    ],
    "SERVICES": [
        "services", "what do you offer", "what does flowzint build",
        "offerings", "solutions", "what can flowzint do",
        "service verticals", "all services",
    ],
    "WEB_INFRASTRUCTURE": [
        "web infrastructure", "web platform", "web development",
        "website", "web system", "web app", "frontend", "backend",
        "web hosting", "web architecture", "load balancing",
    ],
    "MOBILE_PLATFORMS": [
        "mobile", "ios", "android", "mobile app", "mobile platform",
        "mobile development", "cross platform", "app development",
    ],
    "SAAS_SYSTEMS": [
        "saas", "subscription", "cloud", "multi tenant", "saas platform",
        "cloud system", "software as a service", "saas product",
        "saas architecture", "cloud infrastructure",
    ],
    "AI_AUTOMATION": [
        "ai automation", "workflow automation", "automation", "workflow",
        "trigger", "pipeline", "task automation", "intelligent automation",
        "ai system", "machine learning", "process automation",
        "automated task", "ai powered", "avvatledu", "run avvatledu",
        "workflow failed", "execution failed", "not triggering",
    ],
    "ENTERPRISE_SYSTEMS": [
        "enterprise", "enterprise system", "erp", "crm", "enterprise software",
        "large scale", "enterprise platform", "organizational", "enterprise grade",
        "business system", "enterprise infrastructure",
    ],
    "DIGITAL_TRANSFORMATION": [
        "digital transformation", "modernize", "transform", "modernization",
        "digital strategy", "business transformation", "digital evolution",
    ],
    "BUSINESS_AUTOMATION": [
        "business automation", "process automation", "workflow optimization",
        "automate business", "operational automation", "reduce manual",
    ],
    "CAREERS_INTERNSHIPS": [
        "career", "job", "hiring", "internship", "work at flowzint",
        "join flowzint", "opportunities", "recruitment", "apply",
    ],
    "INNOVATION": [
        "innovation", "future", "roadmap", "new features", "upcoming",
        "technology direction", "what is flowzint building",
    ],
    "SUPPORT_CHANNELS": [
        "help", "support", "assistance", "escalate", "human agent",
        "contact support", "reach support", "need help", "urgent",
        "helpdesk", "support team",
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