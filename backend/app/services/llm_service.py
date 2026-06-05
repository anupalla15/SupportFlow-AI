"""
LLM Service — Groq primary, OpenRouter fallback.
Swap providers here without touching chat.py or any other file.
"""

from groq import Groq
from app.config import GROQ_API_KEY, OPENROUTER_API_KEY
import requests

GROQ_MODEL       = "llama-3.3-70b-versatile"
FALLBACK_MODEL   = "meta-llama/llama-3.2-3b-instruct:free"
OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions"

# Groq client — initialised once at module load
_groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def call_llm(messages: list[dict], temperature: float = 0.3) -> tuple[str, str]:
    """
    Call Groq primary, fall back to OpenRouter if Groq fails or key missing.

    Returns: (reply_text, model_name_used)
    """
    # ── Groq ──────────────────────────────────────────────────────
    if _groq_client:
        try:
            response = _groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=512,
            )
            reply = response.choices[0].message.content.strip()
            return reply, GROQ_MODEL
        except Exception as e:
            print(f"⚠️  Groq failed: {e} — falling back to OpenRouter")

    # ── OpenRouter fallback ────────────────────────────────────────
    if not OPENROUTER_API_KEY:
        raise RuntimeError("No LLM provider available. Set GROQ_API_KEY or OPENROUTER_API_KEY.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {"model": FALLBACK_MODEL, "messages": messages}
    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data  = resp.json()
    reply = data["choices"][0]["message"]["content"].strip()
    return reply, data.get("model", FALLBACK_MODEL)