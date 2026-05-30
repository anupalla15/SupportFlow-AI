import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import OPENROUTER_API_KEY
from app.services.sentiment import (
    analyze_sentiment, get_priority, should_escalate,
    generate_ticket_id, is_critical, generate_queue_position,  # ← updated
)
from app.services.rag_service import get_relevant_context
from app.services.summary import generate_summary
from app.services.agent_router import route_to_agent

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL          = "openai/gpt-3.5-turbo"

# ── Improved prompts ───────────────────────────────────────────────

# ── Prompts ────────────────────────────────────────────────────────

BASE_SYSTEM_PROMPT = """You are SupportFlow AI, the enterprise support assistant for FlowZint — a SaaS and AI automation platform (https://flowzint.in).

RESPONSE STYLE — follow strictly:
- Be concise. 3–5 sentences maximum for most issues.
- Use operational enterprise language: workflows, integrations, execution, synchronization, credentials, infrastructure.
- Structure responses with a brief diagnosis, then specific action steps as a short list.
- Never start with "I understand your frustration" or similar generic openers.
- Never write long paragraphs. Use line breaks between distinct points.
- End with one clear next step or offer to escalate.
- If greeted casually, respond briefly and redirect to support.
- Support Telugu-English messages naturally — respond in the same mix if used.
- NEVER invent policies, pricing, or procedures not provided to you.

RESPONSE FORMAT EXAMPLE:
"Your webhook trigger appears to be failing during endpoint validation.

Verify the following:
- Endpoint returns HTTP 200 within 5 seconds
- URL uses HTTPS (HTTP is not supported)
- Payload matches the expected JSON schema

If the issue persists after these checks, our workflow team can review the execution logs directly." """

RAG_SYSTEM_PROMPT = """You are SupportFlow AI, the enterprise support assistant for FlowZint (https://flowzint.in).

CRITICAL RULES:
1. The COMPANY KNOWLEDGE section below is the ONLY source of truth. Do not add, invent, or assume anything beyond it.
2. Answer directly and accurately using only those facts.
3. If not covered, say: "That specific detail isn't in our current documentation — please contact FlowZint support at https://flowzint.in/fz/contact.html"
4. NEVER contradict the knowledge base.

RESPONSE STYLE:
- Concise. 3–5 sentences or a short action list.
- Operational enterprise tone: no filler phrases, no generic warmth.
- Specific and actionable."""

ESCALATION_PROMPT_SUFFIX = """

ESCALATION CONTEXT: This user is experiencing a critical issue.
- Acknowledge the severity in one sentence only — no lengthy empathy.
- State clearly that a specialist has been notified.
- Provide their queue position.
- Keep total response under 4 sentences.
- Do not attempt to resolve the issue yourself."""

# ── Schemas ────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []

    class Config:
        json_schema_extra = {
            "example": {
                "message": "I am furious, this is a scam!",
                "history": []
            }
        }

class TicketMeta(BaseModel):
    ticket_id: str
    sentiment: str
    priority: str
    escalate: bool
    critical: bool = False          # ← NEW
    queue_position: int | None = None  # ← NEW

class ChatResponse(BaseModel):
    reply: str
    model: str
    status: str      = "success"
    ticket: TicketMeta
    rag_used: bool   = False
    summary: dict    = {}
    agent_info: dict = {}

# ── Endpoint ───────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    # 1. Sentiment + criticality
    sentiment      = analyze_sentiment(req.message)
    priority       = get_priority(sentiment)
    escalate       = should_escalate(sentiment)
    critical       = is_critical(sentiment)             # ← NEW
    ticket_id      = generate_ticket_id()
    queue_position = generate_queue_position() if critical else None  # ← NEW

    # 2. Agent routing
    agent        = route_to_agent(req.message)
    agent_prompt = agent["prompt"]

    # 3. RAG
    context  = get_relevant_context(req.message)
    rag_used = bool(context)

    # 4. Build system prompt — add escalation suffix for critical cases

    if rag_used:
        system_prompt = (
            f"{BASE_SYSTEM_PROMPT}\n\n"
            f"{agent_prompt}\n\n"
            "CRITICAL RULES:\n"
            "1. COMPANY KNOWLEDGE below is the ONLY source of truth.\n"
            "2. Answer ONLY using those facts.\n"
            "3. NEVER invent policies.\n\n"
            "══ COMPANY KNOWLEDGE ══\n"
            f"{context}\n"
            "══ END ══"
        )
    else:
        system_prompt = (
            f"{BASE_SYSTEM_PROMPT}\n\n"
            f"{agent_prompt}"
        )

    # Add escalation handling for critical issues
    if critical:
        system_prompt += (
            f"{ESCALATION_PROMPT_SUFFIX}\n\n"
            f"The customer's queue position is: #{queue_position}. "
            "Mention this in your response."
        )
    # 5. Build messages
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})

    grounded_message = (
        f"{req.message}\n\n[REMINDER: Answer using ONLY company knowledge provided.]"
    ) if rag_used else req.message

    messages.append({"role": "user", "content": grounded_message})
    payload = {"model": MODEL, "messages": messages}

    # 6. Call OpenRouter
    try:
        response = requests.post(
            OPENROUTER_URL, headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()
        data       = response.json()
        reply      = data["choices"][0]["message"]["content"]
        model_used = data.get("model", MODEL)

    except requests.exceptions.HTTPError:
        raise HTTPException(status_code=response.status_code, detail=f"OpenRouter error: {response.text}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timed out.")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 7. Summary
    full_convo = [{"role": m.role, "content": m.content} for m in req.history] + [
        {"role": "user",      "content": req.message},
        {"role": "assistant", "content": reply},
    ]
    summary = generate_summary(full_convo, ticket_id)

    # 8. Return
    return ChatResponse(
        reply=reply,
        model=model_used,
        rag_used=rag_used,
        summary=summary,
        agent_info={
            "agent":      agent["agent"],
            "department": agent["department"],
            "emoji":      agent["emoji"],
            "color":      agent["color"],
        },
        ticket=TicketMeta(
            ticket_id=ticket_id,
            sentiment=sentiment,
            priority=priority,
            escalate=escalate,
            critical=critical,                  # ← NEW
            queue_position=queue_position,      # ← NEW
        ),
    )