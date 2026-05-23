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
    "RETURNS":  ["return", "refund", "send back", "money back", "exchange"],
    "SHIPPING": ["shipping", "delivery", "ship", "arrive", "track", "package", "transit"],
    "ACCOUNT":  ["account", "password", "login", "email", "sign in", "delete account"],
    "ORDERS":   ["order", "cancel", "confirmation", "purchased", "buy", "bought"],
    "PAYMENTS": ["payment", "pay", "card", "visa", "paypal", "charge", "billing", "invoice"],
    "PRODUCT":  ["product", "warranty", "item", "custom", "bulk", "new product"],
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