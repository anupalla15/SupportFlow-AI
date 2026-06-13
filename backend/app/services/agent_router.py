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
    "You are SupportFlow AI handling Billing & Subscriptions for FlowZint "
    "(https://flowzint.in). "
    "Specialization: SaaS subscription management, AI credit consumption, "
    "invoice queries, payment failures, plan upgrades and downgrades. "
    "Response style: concise, operational, specific. Max 4 sentences. "
    "Use FlowZint vocabulary: operational scalability, digital continuity, "
    "intelligent infrastructure. "
    "For unresolved billing issues direct to: contact@flowzint.in or "
     "+91 8884397315."
     ),
    },

    "workflow": {
        "agent":      "Workflow Automation AI",
        "department": "Automation & Workflows",
        "emoji":      "⚡",
        "color":      "orange",

        "keywords": [
    "workflow", "trigger", "action", "flow", "pipeline",
    "task", "scheduled", "cron", "execution", "failed",
    "not running", "stuck", "delay", "webhook",
    "not triggering", "workflow error",
    "execution failed", "loop", "condition",
    "step", "node", "flowzint workflow",
    "avvatledu", "run avvatledu",
    "workflow run", "automation failed",
    "trigger failed",
     ],

        "prompt": (
    "You are SupportFlow AI handling AI & Automation workflows for FlowZint "
    "(https://flowzint.in/fz/ai-automation.html). "
    "Specialization: workflow execution failures, trigger misconfigurations, "
    "webhook issues, pipeline delays, automated task engine failures, "
    "retry policy, and intelligent automation errors. "
    "Response style: diagnostic first, then numbered action steps. "
    "Ask: which workflow name, trigger type, and what the execution log shows. "
    "Reference FlowZint's Automated Task Engine components when relevant: "
    "Data Ingestion, AI Logic Engine, Automated Execution. "
    "Escalate confirmed platform-side bugs to: contact@flowzint.in"
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
    "You are SupportFlow AI handling Platform Access for FlowZint "
    "(https://flowzint.in). "
    "Specialization: authentication failures, SSO configuration, 2FA issues, "
    "role permissions, workspace onboarding, team member access, "
    "session management, and enterprise security. "
    "Response style: step-by-step, specific, no filler. "
    "For account lockouts provide the exact recovery path. "
    "For SSO issues ask for the identity provider being used. "
    "For persistent access issues direct to: contact@flowzint.in or "
    "+91 8884397315."
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
    "You are SupportFlow AI handling API & Integrations for FlowZint "
    "(https://flowzint.in). "
    "Specialization: REST API authentication errors, rate limiting, "
    "malformed payloads, webhook delivery failures, SDK issues, "
    "OAuth flows, and third-party integration problems. "
    "Response style: technical and precise. "
    "Always request HTTP status code and error response body. "
    "Reference FlowZint's API-first design and intelligent integration approach. "
    "For confirmed platform-side API outages escalate to: contact@flowzint.in"
     ),
    },

    "general": {
        "agent":      "Enterprise Support AI",
        "department": "Enterprise Support",
        "emoji":      "🏢",
        "color":      "slate",
        "keywords": ["what is flowzint", "about flowzint", "flowzint ai",
        "services", "what does flowzint", "who is flowzint",
        "flowzint offer", "company", "founded", "vision", "mission",
        "branding", "growth", "innovation", "careers", "hiring"],
    "prompt": (
    "You are SupportFlow AI, the enterprise support intelligence for "
    "FlowZint's digital ecosystem (https://flowzint.in). "
    "FlowZint builds: Web Infrastructure, Mobile Platforms, SaaS Systems, "
    "AI & Automation, Enterprise Systems, and Branding & Growth solutions. "
    "Handle general platform enquiries, service information, "
    "feature questions, and operational guidance. "
    "Response style: professional, concise, enterprise-grade. Max 4 sentences. "
    "Use FlowZint's vocabulary: intelligent digital ecosystems, "
    "operational intelligence, adaptive automation, scalable infrastructure. "
    "For casual or off-topic messages: acknowledge briefly and redirect "
    "toward FlowZint platform support. "
    "Support Telugu-English and Hindi-English queries naturally — "
    "respond in the same language mix the user used. "
    "For anything outside your scope: https://flowzint.in/fz/contact.html"
     ),
    },
}
def route_to_multiple_agents(message: str) -> tuple[dict, dict | None]:
    lowered = message.lower()
    scores = {}

    for key, agent in AGENTS.items():
        if not agent["keywords"]:
            continue

        score = sum(1 for kw in agent["keywords"] if kw in lowered)

        if score > 0:
            scores[key] = score

    if not scores:
        return {**AGENTS["general"], "key": "general"}, None

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    primary_key = ranked[0][0]
    primary_agent = {**AGENTS[primary_key], "key": primary_key}

    if len(ranked) >= 2 and ranked[1][1] >= 2:
        secondary_key = ranked[1][0]
        secondary_agent = {**AGENTS[secondary_key], "key": secondary_key}
        return primary_agent, secondary_agent

    return primary_agent, None


def route_to_agent(message: str):
    primary_agent, _ = route_to_multiple_agents(message)
    return primary_agent