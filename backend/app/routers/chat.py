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
from app.services.llm_service import call_llm

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"
# ── Prompts ────────────────────────────────────────────────────────
BASE_PROMPT = """You are SupportFlow AI — enterprise support intelligence for FlowZint (https://flowzint.in).

FlowZint builds: SaaS systems, AI & automation platforms, enterprise systems, web infrastructure, and mobile platforms.

STRICT RESPONSE RULES:
- MAXIMUM 3 sentences for simple questions. MAXIMUM 5 sentences for technical issues.
- NEVER ask follow-up questions unless absolutely required.
- Lead with the answer immediately — no preamble.
- For "what is X" questions: answer directly in 2 sentences.
- Use operational language: execution, synchronization, pipeline, provisioning.
- Telugu-English / Hindi-English: respond in the same language mix.
- Unknown issues: contact@flowzint.in or https://flowzint.in/fz/contact.html
- NEVER invent services, pricing, or policies.

TONE EXAMPLES:
✓ "FlowZint is a technology company building intelligent SaaS systems, AI automation platforms, and enterprise infrastructure. Contact: contact@flowzint.in"
✓ "Workflow execution failure detected. Check the execution log under Workflows > History, verify your webhook returns HTTP 200, then re-enable the workflow."
✗ "To help you better, could you provide more information about..." (NEVER do this for simple questions)"""

RAG_PROMPT = """You are SupportFlow AI for FlowZint (https://flowzint.in).

RULES:
1. Answer ONLY from COMPANY KNOWLEDGE below.
2. MAXIMUM 3 sentences. No bullet lists unless listing items.
3. Answer directly — no preamble, no asking for more info.
4. Not covered → "Contact FlowZint at contact@flowzint.in or https://flowzint.in/fz/contact.html"

COMPANY KNOWLEDGE:
{context}
END KNOWLEDGE"""

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
    # ── Call LLM (Groq → OpenRouter fallback) ─────────────────────
    try:
          reply, model_used = call_llm(messages)
    except Exception as e:
          raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

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
        sources=["faq.txt"] if rag_used else [],
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