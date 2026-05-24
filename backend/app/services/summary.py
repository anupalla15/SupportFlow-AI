import requests
from app.config import OPENROUTER_API_KEY

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"

SUMMARY_PROMPT = """You are a support operations analyst.
Analyze this customer support conversation and return a JSON summary.

RULES:
- Return ONLY valid JSON. No explanation, no markdown, no code fences.
- Be concise — max 15 words per field.
- Use ONLY these exact keys.

Required JSON format:
{
  "issue": "one sentence describing the core customer problem",
  "category": "one of: Billing, Shipping, Returns, Account, Technical, Product, Other",
  "sentiment": "one of: angry, frustrated, neutral, positive",
  "priority": "one of: critical, high, medium, low",
  "action_taken": "what the AI did or recommended",
  "resolution_status": "one of: Resolved, Escalated, Pending, In Progress"
}"""


def generate_summary(messages: list[dict], ticket_id: str) -> dict:
    """
    Takes conversation messages [{role, content}] and ticket_id.
    Returns a structured summary dict.
    """
    if not messages:
        return _fallback_summary(ticket_id)

    # Build readable transcript
    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in messages
        if m["role"] in ("user", "assistant")
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user",   "content": f"Conversation to summarize:\n\n{transcript}"},
        ],
        "temperature": 0.1,   # low temperature = more consistent JSON output
    }

    try:
        response = requests.post(
            OPENROUTER_URL, headers=headers, json=payload, timeout=20
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()

        # Strip accidental markdown fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        import json
        summary = json.loads(raw)

        # Ensure ticket_id is always present
        summary["ticket_id"] = ticket_id
        return summary

    except Exception as e:
        print(f"Summary generation failed: {e}")
        return _fallback_summary(ticket_id)


def _fallback_summary(ticket_id: str) -> dict:
    """Safe fallback if AI summary fails."""
    return {
        "ticket_id":         ticket_id,
        "issue":             "Unable to generate summary",
        "category":          "Other",
        "sentiment":         "neutral",
        "priority":          "medium",
        "action_taken":      "AI response provided",
        "resolution_status": "Pending",
    }