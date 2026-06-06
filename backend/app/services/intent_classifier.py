"""
SupportFlow AI — Intent Classifier
===================================
Lightweight regex-based intent classification with multilingual support.

Supported language mixes:
  - English
  - Telugu-English (Tenglish)
  - Hindi-English (Hinglish)

Architecture decision: pure regex + heuristics.
No ML, no NLP libraries, no databases.
Unknown support messages always fall through to the LLM — never blocked here.

Intent flow:
  greeting  → static response  (no LLM call)
  casual    → static response  (no LLM call)
  emotional → empathy response (no LLM call)
  support   → full LLM + agent routing pipeline
"""

import re
import random

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1: SUPPORT SIGNALS
#
# WHY: Before running full pattern matching, a quick keyword scan lets us
# fast-path support queries. Catches Tenglish/Hinglish fragments that might
# not match full patterns but clearly indicate a technical problem.
# ─────────────────────────────────────────────────────────────────────────────

SUPPORT_SIGNALS = {
    # English technical
    "error", "fail", "failed", "failing", "not working", "broken", "bug",
    "issue", "problem", "can't", "cannot", "unable", "timeout", "crash",
    "401", "403", "404", "500", "502", "503",

    # English platform
    "workflow", "automation", "trigger", "pipeline", "webhook", "api",
    "integration", "endpoint", "credential", "token", "sso", "oauth",
    "billing", "invoice", "credit", "subscription", "payment", "plan",
    "login", "dashboard", "access", "permission", "role", "otp",
    "password", "2fa", "session", "workspace",

    # Telugu-English (Tenglish) — "not working / failed / not opening"
    "avvatledu",      # not happening / not working
    "avvatundaledu",  # is not happening
    "ayyindi",        # has happened (used for failures: "fail ayyindi")
    "raledu",         # didn't come / not received (e.g., "otp raledu")
    "povalatledu",    # can't go
    "teraleledu",     # not opening
    "vastuundi",      # is coming (e.g., "error vastuundi")
    "cheyyadaniki",   # to do
    "jarigindi",      # happened
    "padatledu",      # not working / not fitting

    # Hindi-English (Hinglish) — "not working / not happening"
    "nahi",           # not
    "nai",            # not (colloquial)
    "raha",           # happening/going (in "nahi ho raha")
    "hua",            # happened ("payment nahi hua")
    "chal",           # working ("nahi chal raha")
    "kaam",           # work ("kaam nahi kar raha")
    "dikkat",         # trouble/issue
    "stuck",          # stuck (used in both languages)
    "band",           # closed/stopped
    "khul",           # open ("nahi khul raha")
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2: INTENT PATTERNS
#
# WHY: Ordered from most specific to least specific within each intent.
# Support patterns are broadest to ensure unknown queries reach the LLM.
# Tenglish/Hinglish patterns use common verb fragments since mixed-language
# users rarely complete full grammatical sentences.
# ─────────────────────────────────────────────────────────────────────────────

INTENT_PATTERNS = {

    # ── GREETING ─────────────────────────────────────────────────────────────
    # WHY: Catch pure greetings to return instant responses without LLM cost.
    "greeting": [
        r"^(hi|hey|hello|yo|sup)[\s!?.]*$",
        r"\b(good morning|good afternoon|good evening|howdy|what'?s up)\b",
        r"\b(namaste|namaskar|vanakkam|hii+|helloo+|heyy+)\b",
        r"\b(bagunava|bagunnava|ela unnav(u|aru)?|ela unna)\b",
    ],

    # ── CASUAL ───────────────────────────────────────────────────────────────
    # WHY: Redirect off-topic messages without burning LLM tokens.
    "casual": [
        r"\b(how are you|how do you do|who are you|what are you|what is your name"
        r"|are you (a bot|human|ai|real)|what can you do|tell me (a joke|about yourself))\b",
        # Tenglish casual
        r"\b(meeru (ela unnaru|emi chestunnaru)|nuvvu (ela unnav|emi chestunnav)"
        r"|mee peru emi|meeru bot a|meeru ai a)\b",
        # Hinglish casual
        r"\b(kaise ho|kya haal|kya kar rahe|aap kaun|bot ho kya|theek ho"
        r"|aapka naam|kya aap ai ho)\b",
    ],

    # ── EMOTIONAL ────────────────────────────────────────────────────────────
    # WHY: Detect frustration early and respond with empathy before routing.
    # Reduces escalations triggered by emotional venting rather than real issues.
    "emotional": [
        r"\b(waste of time|useless|not helpful|pointless|so annoying|so frustrated"
        r"|really angry|fed up|done with this|this is terrible|worst (ever|support|platform))\b",
        # Tenglish emotional
        r"\b(time waste (avtuundi|ayindi|ga)|pani cheyyatledu ga|emi prayojanam"
        r"|chala frustrat|bore (avtuundi|ga)|naaku kashtam|enti idi|emi idi)\b",
        # Hinglish emotional
        r"\b(bahut bura|kuch kaam nahi (karta|kar raha)|time (barbad|waste) ho raha"
        r"|pareshan (ho gaya|kar diya)|iska koi fayda nahi|bahut frustrating)\b",
    ],

    # ── SUPPORT ──────────────────────────────────────────────────────────────
    # WHY: Cast wide net — better to over-classify as support and let the LLM
    # handle it than to miss a real user problem.
    "support": [
        # English: platform features + error states
        r"\b(workflow (failed|not (running|triggering|executing|working)|stuck|error|issue)"
        r"|automation (failed|broken|not (working|running))"
        r"|api (error|timeout|failing|not (working|responding)|down|issue)"
        r"|webhook (failed|not (receiving|working|firing)|issue)"
        r"|dashboard (not (loading|opening|accessible)|down|issue)"
        r"|login (failed|not (working|loading)|issue|error)"
        r"|payment (failed|declined|not (processed|working)|issue)"
        r"|billing (issue|error|problem|not (working|charged correctly))"
        r"|subscription (expired|cancelled|issue|not (working|active))"
        r"|credits? (depleted|exhausted|not (working|showing|loading))"
        r"|access (denied|issue|not (working|granted))"
        r"|otp (not (received|coming|working)|expired|issue)"
        r"|sso (failed|not (working|configured)|issue)"
        r"|permission (denied|issue|error))\b",

        # Tenglish: verb-fragment patterns (most common form in real messages)
        r"\b((workflow|automation|trigger|pipeline) (run |execute |chal )?(avvatledu|ayyindi|padatledu|jarigindi))\b",
        r"\b((api|webhook|integration) (work |call |connect )?(avvatledu|ayyindi|vastuundi))\b",
        r"\b((dashboard|login|payment|otp|access|credit) (open |load |receive |come )?(avvatledu|raledu|ayyindi|teraleledu))\b",
        r"\b(error (vastuundi|vastuundo|ochindi)|problem (vastuundi|ochindi)|issue (vastuundi|undi))\b",

        # Hinglish: nahi + verb patterns (most common form)
        r"\b((workflow|api|webhook|automation|pipeline) (nahi?|nai) (chal|ho|run|work|trigger) (raha|rahi|rhe))\b",
        r"\b((login|dashboard|payment|otp|access|credit) (nahi?|nai) (ho|aa|mil|khul|chal) (raha|rahi|rhe))\b",
        r"\b(error (aa raha|aa rahi|aa rhe)|dikkat (aa raha|ho rahi|ho gaya)|stuck (ho gaya|hai))\b",
        r"\b((payment|otp|credit) (nahi?|nai) (hua|aaya|mila|aai))\b",
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3: STATIC RESPONSES
#
# WHY: Varied responses prevent the assistant feeling robotic.
# Tenglish-flavored options for greeting/emotional create a culturally
# natural experience for regional users without forcing full translation.
# ─────────────────────────────────────────────────────────────────────────────

GREETING_RESPONSES = [
    
    "Hi! I'm SupportFlow AI — FlowZint's enterprise support assistant. What can I help you with?",
    "Hello! Ready to assist with workflows, integrations, billing, and platform operations.",
    "SupportFlow AI online. Describe the operational issue you're facing.",
    "FlowZint enterprise support active — workflow, API, billing, or access issue unte cheppandi.",
      ]  # Tenglish

CASUAL_RESPONSES = [
    "SupportFlow AI active. Workflow, API, billing, or access issue unte cheppandi.",
    "FlowZint enterprise support ready. Describe the platform issue you're facing.",
    "SupportFlow AI online — integrations, workflows, billing, and access issues supported.",
]

EMOTIONAL_RESPONSES = [
    "Issue acknowledged. Share what stopped working and when the failure started.",
    "Operational issue detected. Describe the exact error or failed workflow.",
    "Let's isolate the problem quickly. Which integration, workflow, or access flow failed?",
    "Frustration detected — exact ga emi jarigindo cheppandi, troubleshoot chestam.",
    "Problem understood — exact error share kariye, system diagnose karte hain.",
]
# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4: CLASSIFIER LOGIC
#
# WHY: Three-layer approach:
#   Layer 1 — Fast signal scan (catches Tenglish/Hinglish fragments instantly)
#   Layer 2 — Full pattern matching (catches structured phrases)
#   Layer 3 — Heuristic fallback (short messages with no signals = casual)
#
# Critically: anything ambiguous defaults to "support" so the LLM handles it.
# We never block a real support query with a static response.
# ─────────────────────────────────────────────────────────────────────────────

def _has_support_signal(text: str) -> bool:
    """
    Fast scan for support keywords across English, Tenglish, Hinglish.
    WHY: Catches 'otp raledu', 'api nahi chal raha' before full pattern matching.
    """
    words = re.findall(r"[\w']+", text.lower())
    return any(word in SUPPORT_SIGNALS for word in words)


def classify_intent(message: str) -> str:
    """
    Classify message intent.

    Returns: 'greeting' | 'casual' | 'emotional' | 'support'

    Design principle: ALWAYS route ambiguous messages to 'support' so
    the LLM pipeline handles them. Never silently drop a real user problem.
    """
    lowered = message.lower().strip()

    # Layer 1: Fast signal scan — if support signals present, skip other checks
    if _has_support_signal(lowered):
        return "support"

    # Layer 2: Full pattern matching in priority order
    for intent in ("greeting", "casual", "emotional", "support"):
        for pattern in INTENT_PATTERNS[intent]:
            if re.search(pattern, lowered):
                return intent

    # Layer 3: Heuristic fallback
    # Short messages (≤4 words) with no support signals → likely casual
    # Everything else → support (safe default, LLM handles it)
    # Only very obvious short greetings become casual
    if len(lowered.split()) <= 2 and any(
    word in lowered for word in [
        "hi", "hello", "hey", "yo", "sup"
    ]
    ):
       return "greeting"

# EVERYTHING ELSE → LLM
    return "support"

def get_static_response(intent: str) -> str | None:
    """
    Returns a pre-written response for non-support intents.
    Returns None for 'support' — caller must route to LLM pipeline.
    """
    if intent == "greeting":  return random.choice(GREETING_RESPONSES)
    if intent == "casual":    return random.choice(CASUAL_RESPONSES)
    if intent == "emotional": return random.choice(EMOTIONAL_RESPONSES)
    return None  # support → use full LLM + agent routing