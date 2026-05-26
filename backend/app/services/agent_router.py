# ── Agent definitions ──────────────────────────────────────────────

AGENTS = {
    "billing": {
        "agent":      "Billing AI Agent",
        "department": "Billing & Payments",
        "emoji":      "💳",
        "color":      "blue",
        "keywords":   [
            "payment", "invoice", "charge", "bill", "subscription",
            "price", "cost", "fee", "card", "visa", "paypal", "transaction",
            "overcharged", "discount", "coupon", "receipt", "billing",
        ],
        "prompt": (
            "You are the Billing AI Agent for SupportFlow. "
            "You specialize in payments, invoices, charges, refunds, and billing disputes. "
            "Always verify the issue clearly and provide actionable billing solutions. "
            "If a refund is needed, explain the exact process and timeline."
        ),
    },
    "shipping": {
        "agent":      "Shipping AI Agent",
        "department": "Shipping & Delivery",
        "emoji":      "📦",
        "color":      "orange",
        "keywords":   [
            "shipping", "delivery", "ship", "arrive", "track", "package",
            "tracking", "carrier", "courier", "lost", "delayed", "transit",
            "dispatch", "order status", "estimated", "not arrived", "where is",
        ],
        "prompt": (
            "You are the Shipping AI Agent for SupportFlow. "
            "You specialize in deliveries, tracking, lost packages, and shipping delays. "
            "Always ask for the order number when relevant and provide clear next steps."
        ),
    },
    "returns": {
        "agent":      "Returns AI Agent",
        "department": "Returns & Exchanges",
        "emoji":      "↩️",
        "color":      "purple",
        "keywords":   [
            "return", "exchange", "send back", "refund", "replace", "broken",
            "damaged", "defective", "wrong item", "not as described", "return policy",
            "money back", "swap", "warranty claim",
        ],
        "prompt": (
            "You are the Returns AI Agent for SupportFlow. "
            "You specialize in returns, exchanges, and warranty claims. "
            "Guide customers through the return process step by step. "
            "Always reference the 30-day return policy and required conditions."
        ),
    },
    "account": {
        "agent":      "Account Support AI",
        "department": "Account Management",
        "emoji":      "👤",
        "color":      "green",
        "keywords":   [
            "account", "login", "password", "sign in", "email", "username",
            "profile", "settings", "delete account", "locked", "access",
            "two factor", "2fa", "verification", "forgot", "reset",
        ],
        "prompt": (
            "You are the Account Support AI for SupportFlow. "
            "You specialize in account access, password resets, profile management, and security. "
            "Guide customers through account recovery clearly and securely."
        ),
    },
    "general": {
        "agent":      "General Support AI",
        "department": "General Support",
        "emoji":      "💬",
        "color":      "slate",
        "keywords":   [],   # fallback — matches everything
        "prompt": (
            "You are the General Support AI for SupportFlow. "
            "You handle a wide range of customer inquiries. "
            "Be helpful, friendly, and solution-focused."
        ),
    },
}


# ── Public API ─────────────────────────────────────────────────────

def route_to_agent(message: str) -> dict:
    """
    Score each agent by keyword matches.
    Returns the best-matching agent dict (never None — falls back to general).
    """
    lowered = message.lower()
    scores  = {}

    for key, agent in AGENTS.items():
        if key == "general":
            continue
        score = sum(1 for kw in agent["keywords"] if kw in lowered)
        if score > 0:
            scores[key] = score

    # Pick highest scoring agent, fall back to general
    if scores:
        best_key = max(scores, key=scores.get)
    else:
        best_key = "general"

    chosen = AGENTS[best_key]
    return {
        "key":        best_key,
        "agent":      chosen["agent"],
        "department": chosen["department"],
        "emoji":      chosen["emoji"],
        "color":      chosen["color"],
        "prompt":     chosen["prompt"],
    }