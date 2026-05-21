import re

# Keywords mapped to sentiment levels
SENTIMENT_RULES = {
    "angry": [
        "angry", "furious", "outraged", "unacceptable", "ridiculous",
        "terrible", "horrible", "worst", "useless", "incompetent",
        "stupid", "hate", "disgusting", "scam", "fraud", "lawsuit",
    ],
    "frustrated": [
        "frustrated", "annoyed", "disappointed", "still not", "not working",
        "doesn't work", "broken", "again", "waited", "waiting", "delayed",
        "never", "always", "keeps", "issue", "problem", "wrong", "failed",
    ],
    "positive": [
        "thank", "thanks", "great", "awesome", "excellent", "love",
        "perfect", "helpful", "amazing", "appreciate", "happy", "good",
        "fantastic", "wonderful", "resolved", "solved",
    ],
}

PRIORITY_MAP = {
    "angry":      "critical",
    "frustrated": "high",
    "neutral":    "medium",
    "positive":   "low",
}

ESCALATION_SENTIMENTS = {"angry", "frustrated"}


def analyze_sentiment(text: str) -> str:
    """Return sentiment: angry | frustrated | positive | neutral."""
    lowered = text.lower()

    for sentiment, keywords in SENTIMENT_RULES.items():
        if any(re.search(rf"\b{kw}\b", lowered) for kw in keywords):
            return sentiment

    return "neutral"


def get_priority(sentiment: str) -> str:
    return PRIORITY_MAP.get(sentiment, "medium")


def should_escalate(sentiment: str) -> bool:
    return sentiment in ESCALATION_SENTIMENTS


def generate_ticket_id() -> str:
    """Generate a ticket ID like SF-2045."""
    import random
    return f"SF-{random.randint(1000, 9999)}"