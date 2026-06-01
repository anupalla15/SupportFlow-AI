import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import OPENROUTER_API_KEY
from app.services.sentiment import (
    analyze_sentiment, get_priority, should_escalate,
    generate_ticket_id, is_critical, generate_queue_position,
)
from app.services.rag_service import get_relevant_context
from app.services.summary import generate_summary
from app.services.agent_router import route_to_agent
from app.services.intent_classifier import classify_intent, get_static_response  # ← NEW

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"

# ── Prompts ────────────────────────────────────────────────────────

BASE_SYSTEM_PROMPT = """You are SupportFlow AI, the enterprise support assistant for FlowZint (https://flowzint.in) — a SaaS and AI automation platform.

RESPONSE RULES — follow strictly:
- Maximum 4 sentences for most replies. Use a short bullet list only when listing steps.
- Start with the diagnosis or answer. Never start with "I understand" or "Great question".
- Use operational language: execution, integration, configuration, synchronization, credentials, pipeline.
- For Telugu-English messages, respond naturally in the same language mix.
- If you don't know, say: "That's outside my current knowledge — contact FlowZint support at https://flowzint.in/fz/contact.html"
- NEVER invent policies, pricing, or timelines.
- End with one clear next step.

RESPONSE FORMAT:
Diagnosis in one line.

Steps if needed:
- Step one
- Step two

Next step or offer to escalate."""

RAG_SYSTEM_PROMPT = """You are SupportFlow AI for FlowZint (https://flowzint.in).

RULES:
1. Use ONLY the COMPANY KNOWLEDGE below. Do not add or invent anything.
2. Answer directly. No preamble.
3. If not covered: "That specific detail isn't documented here — contact https://flowzint.in/fz/contact.html"
4. Max 4 sentences or a short bullet list.
5. Operational tone. No filler."""

ESCALATION_PROMPT_SUFFIX = """

ESCALATION: This user needs urgent assistance.
- One sentence acknowledging the severity.
- State that the Enterprise Operations Team has been notified.
- Give their queue position.
- Under 4 sentences total. Do not attempt to resolve the issue yourself."""

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
                "message": "My scheduled workflow stopped executing overnight",
                "history": []
            }
        }

class TicketMeta(BaseModel):
    ticket_id: str
    sentiment: str
    priority: str
    escalate: bool
    critical: bool = False
    queue_position: int | None = None

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

    # 1. Intent classification — handle non-support messages first  ← NEW
    intent = classify_intent(req.message)
    static_reply = get_static_response(intent)

    if static_reply:
        # Non-support intent: return static response, no AI call needed
        return ChatResponse(
            reply=static_reply,
            model="static",
            rag_used=False,
            ticket=TicketMeta(
                ticket_id=generate_ticket_id(),
                sentiment="neutral",
                priority="low",
                escalate=False,
                critical=False,
            ),
        )

    # 2. Sentiment analysis (support intent only)
    sentiment      = analyze_sentiment(req.message)
    priority       = get_priority(sentiment)
    escalate       = should_escalate(sentiment)
    critical       = is_critical(sentiment)
    ticket_id      = generate_ticket_id()
    queue_position = generate_queue_position() if critical else None

    # 3. Agent routing
    agent        = route_to_agent(req.message)
    agent_prompt = agent["prompt"]

    # 4. RAG
    context  = get_relevant_context(req.message)
    rag_used = bool(context)

    if rag_used:
        system_prompt = (
            f"{agent_prompt}\n\n"
            "RULES:\n"
            "1. COMPANY KNOWLEDGE below is the ONLY source of truth.\n"
            "2. Answer ONLY using those facts.\n"
            "3. NEVER invent policies.\n\n"
            "══ COMPANY KNOWLEDGE ══\n"
            f"{context}\n"
            "══ END ══"
        )
    else:
        system_prompt = agent_prompt

    if critical:
        system_prompt += (
            f"{ESCALATION_PROMPT_SUFFIX}\n\n"
            f"Queue position: #{queue_position}. Mention this."
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
        f"{req.message}\n\n[Use ONLY company knowledge. Do not invent.]"
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
            critical=critical,
            queue_position=queue_position,
        ),
    )