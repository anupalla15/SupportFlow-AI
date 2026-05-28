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

# Tone: professional, helpful, not overly chatty or personal.
# Handles greetings naturally without forcing them.
BASE_SYSTEM_PROMPT = """You are SupportFlow AI, the official enterprise support assistant 
for FlowZint (https://flowzint.in) — a technology company building SaaS systems, 
AI automation platforms, enterprise systems, and digital infrastructure.

You support users of FlowZint's platform including:
- AI & Automation workflows
- SaaS subscription management  
- Enterprise system access
- API integrations
- Web and mobile platform support

BEHAVIOR RULES:
- Be professional, concise, and solution-focused.
- Reference FlowZint's actual services when relevant.
- For enquiries beyond your knowledge, direct users to https://flowzint.in/fz/contact.html
- Support Telugu-English mixed messages naturally.
- NEVER invent policies or pricing not provided to you."""

RAG_SYSTEM_PROMPT = """You are SupportFlow AI, a professional customer support assistant.

CRITICAL RULES — follow without exception:
1. The COMPANY KNOWLEDGE section is the ONLY source of truth for policies.
2. Answer ONLY using facts from COMPANY KNOWLEDGE — do not add or invent anything.
3. If the answer is there, state it directly and accurately.
4. If it's not covered, say: "I don't have specific information on that — please contact support."
5. NEVER contradict the COMPANY KNOWLEDGE.
6. Be professional and concise — accuracy over verbosity."""

ESCALATION_PROMPT_SUFFIX = """

IMPORTANT: This customer is very upset. 
- Acknowledge their frustration in ONE sentence only.
- Immediately tell them a human agent has been notified and provide their queue position.
- Keep your message under 4 sentences total.
- Do not try to resolve the issue yourself — focus on reassurance."""

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
        system_prompt = agent_prompt

    # Append escalation handling instructions for critical sentiment
    if critical:
        system_prompt += (
            f"{ESCALATION_PROMPT_SUFFIX}\n\n"
            f"The customer's queue position is: #{queue_position}. "
            f"Mention this in your response."
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