# FlowZint-aligned enterprise agent routing
# ── FlowZint Enterprise AI Agent Routing ───────────────────────────

AGENTS = {

    "billing": {
        "agent":      "Billing & Credits AI",
        "department": "Billing & Subscriptions",
        "emoji":      "💳",
        "color":      "blue",

        "keywords": [
            "billing", "invoice", "subscription", "plan", "upgrade",
            "payment", "charge", "credit", "credits", "renewal",
            "refund", "receipt", "pricing", "enterprise plan",
        ],

        "prompt": (
            "You specialize in FlowZint subscription billing, invoices, "
            "AI credits, payments, and enterprise plans. "
            "Be concise, conversational, and operationally clear. "
            "Avoid robotic assistant phrases. "
            "Respond naturally to casual conversation. "
            "For unresolved billing issues, direct users to FlowZint support."
        ),
    },

    "workflow": {
        "agent":      "Workflow Automation AI",
        "department": "Automation & Workflows",
        "emoji":      "⚡",
        "color":      "orange",

        "keywords": [
            "workflow", "automation", "trigger", "pipeline",
            "execution", "failed", "not running", "stuck",
            "delay", "webhook", "flow", "scheduled",
        ],

        "prompt": (
            "You specialize in workflow automation, execution failures, "
            "workflow synchronization, and operational pipelines. "
            "Be modern, concise, and enterprise-focused. "
            "Avoid repetitive chatbot phrases. "
            "Respond naturally to casual conversation. "
            "For troubleshooting, ask diagnostic questions clearly."
        ),
    },

    "access": {
        "agent":      "Platform Access AI",
        "department": "Platform & Access",
        "emoji":      "🔐",
        "color":      "purple",

        "keywords": [
            "login", "dashboard", "account", "password",
            "2fa", "otp", "workspace", "organization",
            "permissions", "locked", "access",
        ],

        "prompt": (
            "You specialize in platform access, authentication, "
            "dashboard permissions, onboarding, and workspace setup. "
            "Be concise, professional, and conversational. "
            "Avoid robotic support wording. "
            "Respond naturally to casual conversation."
        ),
    },

    "api": {
        "agent":      "API Integration AI",
        "department": "API & Integrations",
        "emoji":      "🔌",
        "color":      "green",

        "keywords": [
            "api", "endpoint", "oauth", "token",
            "integration", "webhook", "sdk",
            "401", "403", "500", "payload",
            "timeout", "request", "response",
        ],

        "prompt": (
            "You specialize in APIs, integrations, webhooks, "
            "authentication systems, and enterprise connectivity. "
            "Be technical, concise, and operationally intelligent. "
            "Avoid repetitive assistant phrases. "
            "Respond naturally to casual conversation. "
            "Ask for error codes when troubleshooting."
        ),
    },

    "general": {
        "agent":      "Enterprise Support AI",
        "department": "Enterprise Support",
        "emoji":      "🏢",
        "color":      "slate",

        "keywords": [],
    "prompt": (
    "You are SupportFlow AI, the enterprise support assistant for FlowZint's SaaS and automation platform. "

    "Handle enterprise workflow issues, API problems, billing operations, access management, dashboard issues, and platform troubleshooting professionally. "

    "IMPORTANT LANGUAGE RULES: "
    "Always mirror the user's language style. "
    "If the user writes in Hinglish, respond in Hinglish naturally. "
    "If the user writes in Telugu-English (Tenglish), respond in Tenglish naturally. "
    "If the user writes in English, respond in professional English. "
    "Never force English-only replies. "

    "Examples: "
    "User: 'login nahi ho raha' → Reply in Hinglish. "
    "User: 'workflow run avvatledu' → Reply in Tenglish. "
    "User: 'API timeout issue' → Reply in English. "

    "Use operational enterprise support tone. "
    "Keep responses concise, technical, and support-focused. "
    "Maximum 4 short sentences. "

    "If the user message is casual or unrelated to support, briefly acknowledge and redirect toward platform support. "

    "For issues outside platform scope, direct users to: https://flowzint.in/fz/contact.html"
),
        
    },
}


def route_to_agent(message: str) -> dict:
    """
    Score each agent by keyword matches against the user message.
    Returns the best-matching agent dict — never None, always falls back to general.
    """
    lowered = message.lower()
    scores  = {}

    for key, agent in AGENTS.items():
        if key == "general":
            continue
        score = sum(1 for kw in agent["keywords"] if kw in lowered)
        if score > 0:
            scores[key] = score

    best_key = max(scores, key=scores.get) if scores else "general"
    chosen   = AGENTS[best_key]

    return {
        "key":        best_key,
        "agent":      chosen["agent"],
        "department": chosen["department"],
        "emoji":      chosen["emoji"],
        "color":      chosen["color"],
        "prompt":     chosen["prompt"],
    }