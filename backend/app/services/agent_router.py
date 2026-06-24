# ── FlowZint Enterprise AI Agent Routing ───────────────────────────
import re
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
    "workflow", "trigger", "action",  "pipeline",
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
    "retry policy, execution logs, workflow dependencies and intelligent automation. "

    "Always start with a diagnosis, then provide numbered troubleshooting steps. "

    "IMPORTANT: The conversation memory may contain a section called "
    "'Completed Troubleshooting'. "

    "Never repeat any troubleshooting step that already appears in "
    "'Completed Troubleshooting'. "

    "Instead, continue from the next logical diagnostic step. "

    "For example, if webhook, trigger configuration or execution log "
    "have already been checked, do NOT ask the user to check them again. "

    "Move forward by investigating retry policy, workflow dependencies, "
    "AI Logic Engine, Automated Execution, platform logs, execution history, "
    "resource provisioning or possible platform-side failures. "

    "Ask only for information that has not already been collected. "

    "Reference FlowZint's Automated Task Engine components when appropriate: "
    "Data Ingestion, AI Logic Engine and Automated Execution. "

    "Escalate confirmed platform-side issues to contact@flowzint.in."
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
print("AGENTS =", AGENTS.keys())
def route_to_multiple_agents(message: str) -> tuple[dict, dict | None]:
    lowered = message.lower()
    scores = {}

    for key, agent in AGENTS.items():

        if not agent["keywords"]:
            continue

        score = 0

        for kw in agent["keywords"]:
            if kw.lower() in lowered:
                score += 1

        print(f"{key} -> {score}")

        if score > 0:
            scores[key] = score

    print("FINAL SCORES =", scores)

    if not scores:
        return {**AGENTS["general"], "key": "general"}, None

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    print("RANKED =", ranked)

    primary_key = ranked[0][0]
    primary_agent = {**AGENTS[primary_key], "key": primary_key}

    secondary_agent = None
    if len(ranked) >= 2 and ranked[1][1] > 0:
        secondary_key = ranked[1][0]
        secondary_agent = {**AGENTS[secondary_key], "key": secondary_key}

    return primary_agent, secondary_agent


def route_to_agent(message: str):
    primary_agent, _ = route_to_multiple_agents(message)
    return primary_agent
