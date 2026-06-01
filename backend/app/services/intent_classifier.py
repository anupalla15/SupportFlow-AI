import re
import random

# ── Intent pattern rules ───────────────────────────────────────────

INTENT_PATTERNS = {
    "greeting": [
    r"\b(hi|hello|hey|good morning|morning|good afternoon|afternoon|good evening|evening|howdy|sup|what'?s up)\b",
    r"^(hi|hey|hello|yo|morning|evening)[\s!.]*$",
    ],

    "farewell": [
    r"\b(bye|goodbye|see you|cya|take care|later|good night|night)\b",
    ],

    "casual": [
        r"\b(how are you|how do you do|how old are you|what are you doing|who are you"
        r"|what is your name|are you a bot|are you human|are you ai|what can you do)\b",

        r"\b(tell me (a joke|something|about yourself))\b",

        # Telugu-English casual
        r"\b(em chestunav|bagunava|tinnava|enti|ela unnnav)\b",
    ],

    "emotional": [
        r"\b(waste of time|useless|not helpful|pointless|annoying|frustrated|angry|"
        r"furious|terrible|horrible|worst|pathetic|disgusting|fed up|done with this)\b",

        # Telugu-English emotional expressions
        r"\b(bakwaas|bekar|cheta|pani cheyyatledu|time waste)\b",
    ],

    "support": [
        r"\b(workflow|automation|trigger|api|integration|webhook|endpoint|"
        r"billing|invoice|credit|subscription|payment|plan|"
        r"login|dashboard|access|password|sso|permission|"
        r"error|failed|not working|issue|problem|bug|broken|"
        r"can't|cannot|unable|doesn't work|not loading)\b",

        # Telugu-English support patterns
        r"\b(avvatledu|ayyindi|chesindi|work avvatledu|fail|run avvatledu|"
        r"login avvatledu|pay|credit teerindi)\b",
    ],
}


# ── Static responses ───────────────────────────────────────────────
GREETING_RESPONSES = [
    "Hey 😄 SupportFlow AI here.",
    "Hello 😄 Ready to help with workflows, integrations, or platform operations.",
    "Good to see you 😄 What’s happening today?",
]

CASUAL_RESPONSES = [
    "Just monitoring workflows and keeping systems operational 😄",
    "Running smoothly so far 🚀",
    "Keeping an eye on automations and enterprise operations 😄",
    "SupportFlow AI active and operational 🚀",
    "Everything looks stable right now 😄",
]
FAREWELL_RESPONSES = [
    "Good night 😄",
    "Take care 🚀",
    "See you later 😄",
    "Goodbye 🚀 Reach out anytime if a workflow breaks.",
]

EMOTIONAL_RESPONSES = [
    "Understood — let's cut straight to fixing this. What's the issue you're running into?",
    "I hear you. Let's get this sorted. Can you tell me what's not working?",
    "Got it. Let's focus on resolving this. What's the specific problem?",
]


# ── Intent classifier ──────────────────────────────────────────────

def classify_intent(message: str) -> str:
    """
    Returns:
    - greeting
    - farewell
    - casual
    - emotional
    - support

    Support is the default fallback.
    """

    lowered = message.lower().strip()

    # Pattern matching
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lowered):
                return intent

    # Short casual fallback
    if (
        len(lowered.split()) <= 4
        and not any(
            kw in lowered
            for kw in [
                "workflow",
                "api",
                "billing",
                "payment",
                "error",
                "fail",
                "issue",
                "broken",
                "login",
                "dashboard",
                "subscription",
                "can't",
                "cannot",
                "not working",
            ]
        )
    ):
        return "casual"

    # Default fallback
    return "support"


# ── Static response handler ────────────────────────────────────────

def get_static_response(intent: str) -> str | None:
    """
    Returns a static response for non-support intents.
    Returns None for support intent → should route to AI agent.
    """

    if intent == "greeting":
        return random.choice(GREETING_RESPONSES)

    if intent == "casual":
        return random.choice(CASUAL_RESPONSES)

    if intent == "farewell":
        return random.choice(FAREWELL_RESPONSES)

    if intent == "emotional":
        return random.choice(EMOTIONAL_RESPONSES)

    return None