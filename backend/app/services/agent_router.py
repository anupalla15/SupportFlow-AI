# FlowZint-aligned enterprise agent routing

AGENTS = {
    "billing": {
        "agent":      "Billing & Credits AI",
        "department": "Billing & Subscriptions",
        "emoji":      "💳",
        "color":      "blue",
        "keywords":   [
            "billing", "invoice", "subscription", "plan", "upgrade", "downgrade",
            "payment", "charge", "credit", "ai credits", "credits", "quota",
            "limit", "renew", "renewal", "refund", "receipt", "overage",
            "usage", "balance", "tier", "pricing", "pro plan", "enterprise plan",
        ],
        "prompt": (
            "You are the Billing & Credits AI for SupportFlow, supporting FlowZint's "
            "SaaS subscription and AI credits ecosystem. "
            "Help users with: subscription plans, AI credit balance, invoice queries, "
            "payment failures, plan upgrades/downgrades, and usage overages. "
            "Be precise about billing timelines. Never guess prices — refer to official plan docs. "
            "If a payment issue needs human review, say so clearly and reassure the user."
        ),
    },

    "workflow": {
        "agent":      "Workflow Automation AI",
        "department": "Automation & Workflows",
        "emoji":      "⚡",
        "color":      "orange",
        "keywords":   [
            "workflow", "automation", "trigger", "action", "flow", "pipeline",
            "task", "scheduled", "cron", "execution", "failed", "not running",
            "stuck", "delay", "webhook", "integration", "zap", "automate",
            "not triggering", "workflow error", "execution failed", "loop",
            "condition", "step", "node", "flowzint workflow",
        ],
        "prompt": (
            "You are the Workflow Automation AI for SupportFlow, specializing in "
            "FlowZint's automation pipelines, workflow builders, and scheduled executions. "
            "Help users debug: failed workflows, stuck triggers, misconfigured steps, "
            "webhook mismatches, and execution delays. "
            "Always ask: what workflow, what trigger, and what error message they see. "
            "Provide structured diagnostic steps. Escalate if the issue is a platform bug."
        ),
    },

    "access": {
        "agent":      "Platform Access AI",
        "department": "Platform & Access",
        "emoji":      "🔐",
        "color":      "purple",
        "keywords":   [
            "login", "access", "dashboard", "account", "password", "sign in",
            "locked", "otp", "2fa", "two factor", "sso", "permissions",
            "role", "team", "member", "invite", "user management", "admin",
            "cannot access", "session", "logout", "profile", "settings",
            "workspace", "organization", "onboarding", "setup",
        ],
        "prompt": (
            "You are the Platform Access AI for SupportFlow, handling all access, "
            "authentication, and onboarding issues within the FlowZint platform. "
            "Help users with: login failures, SSO configuration, 2FA issues, "
            "team member invites, workspace setup, and role permissions. "
            "Guide new users through onboarding steps clearly. "
            "For account lockouts, provide the standard recovery process step by step."
        ),
    },

    "api": {
        "agent":      "API Integration AI",
        "department": "API & Integrations",
        "emoji":      "🔌",
        "color":      "green",
        "keywords":   [
            "api", "api key", "endpoint", "rest", "graphql", "sdk", "integration",
            "connect", "oauth", "token", "rate limit", "401", "403", "500",
            "request", "response", "payload", "header", "authentication",
            "third party", "zapier", "make", "n8n", "postman", "curl",
            "webhook", "callback", "timeout", "connection refused",
        ],
        "prompt": (
            "You are the API Integration AI for SupportFlow, specializing in "
            "FlowZint's REST APIs, webhooks, OAuth flows, and third-party integrations. "
            "Help developers debug: authentication errors, rate limiting, malformed payloads, "
            "webhook delivery failures, and SDK configuration issues. "
            "Ask for the HTTP status code and error message when relevant. "
            "Provide code-level guidance where helpful. Escalate genuine platform-side API outages."
        ),
    },

    "general": {
        "agent":      "Enterprise Support AI",
        "department": "Enterprise Support",
        "emoji":      "🏢",
        "color":      "slate",
        "keywords":   [],  # fallback
        "prompt": (
            "You are the Enterprise Support AI for SupportFlow, built for FlowZint's "
            "enterprise SaaS and automation ecosystem. "
            "Handle general queries, product guidance, feature questions, and "
            "operational support for enterprise users. "
            "If the user is asking about something casual or off-topic, "
            "gently acknowledge it and redirect toward how you can help them with "
            "FlowZint's platform, workflows, or support needs. "
            "Support Telugu-English mixed messages naturally and respond in the same language blend if used."
        ),
    },
}


def route_to_agent(message: str) -> dict:
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