import re
import random
SENTIMENT_RULES = {
    "angry": [
        "angry", "furious", "unacceptable", "ridiculous", "terrible",
        "worst", "useless", "scam", "fraud", "lawsuit", "demand",
        "legal action", "sue", "incompetent", "disgusting", "outraged",
        "pathetic", "waste of money", "total failure",
    ],
    "frustrated": [
        "frustrated", "annoyed", "disappointed", "still not working",
        "not working", "broken", "again", "waited", "waiting",
        "delayed", "never works", "keeps failing", "issue", "problem",
        "wrong", "failed", "stuck", "not triggering", "not loading",
        "can't access", "cannot login", "workflow failed",
    ],
    "positive": [
        "thank", "thanks", "great", "awesome", "excellent", "love",
        "perfect", "helpful", "amazing", "appreciate", "happy",
        "fantastic", "wonderful", "resolved", "solved", "works now",
        "superb", "brilliant",
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
    lowered = text.lower()
    for sentiment, keywords in SENTIMENT_RULES.items():
        if any(re.search(rf"\b{kw}\b", lowered) for kw in keywords):
            return sentiment
    return "neutral"


def get_priority(sentiment: str) -> str:
    return PRIORITY_MAP.get(sentiment, "medium")


def should_escalate(sentiment: str) -> bool:
    return sentiment in ESCALATION_SENTIMENTS


def is_critical(sentiment: str) -> bool:
    """True only for the most severe cases — triggers human queue."""
    return sentiment == "angry"


def generate_ticket_id() -> str:
    return f"SF-{random.randint(1000, 9999)}"


def generate_queue_position() -> int:
    """Simulate a live queue — real apps would query a database."""
    return random.randint(1, 8)