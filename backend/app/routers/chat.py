import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import OPENROUTER_API_KEY
from app.services.sentiment import (
    analyze_sentiment, get_priority, should_escalate, generate_ticket_id,
)
from app.services.rag_service import get_relevant_context

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"

# ── Prompts ────────────────────────────────────────────────────────

# Used when NO FAQ match found — general assistant mode
BASE_SYSTEM_PROMPT = (
    "You are SupportFlow AI, a customer support assistant. "
    "Be concise, empathetic, and solution-focused. "
    "If an issue is urgent or unresolved, recommend escalating to a human agent. "
    "If you do not know the answer, say: 'I don't have that information — "
    "please contact our support team directly.' "
    "NEVER invent policies, prices, timelines, or procedures that are not provided to you."
)

# Used when FAQ match found — strict grounding mode
RAG_SYSTEM_PROMPT = (
    "You are SupportFlow AI, a customer support assistant. "
    "CRITICAL RULES — you MUST follow these without exception:\n"
    "1. The COMPANY KNOWLEDGE section below is the ONLY source of truth for policies.\n"
    "2. Answer ONLY using facts from the COMPANY KNOWLEDGE. Do not add, invent, or assume anything.\n"
    "3. If the answer is in the COMPANY KNOWLEDGE, quote or paraphrase it directly and accurately.\n"
    "4. If the COMPANY KNOWLEDGE does not cover the question, say exactly: "
    "'I don't have specific information about that — please contact our support team.'\n"
    "5. NEVER contradict the COMPANY KNOWLEDGE. If it says 30 days, say 30 days.\n"
    "6. Be friendly and concise, but ACCURACY comes before tone.\n"
)

# ── Schemas ────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is your return policy?",
                "history": []
            }
        }

class TicketMeta(BaseModel):
    ticket_id: str
    sentiment: str
    priority: str
    escalate: bool

class ChatResponse(BaseModel):
    reply: str
    model: str
    status: str = "success"
    ticket: TicketMeta
    rag_used: bool = False

# ── Endpoint ───────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    # 1. Sentiment analysis
    sentiment = analyze_sentiment(req.message)
    priority  = get_priority(sentiment)
    escalate  = should_escalate(sentiment)
    ticket_id = generate_ticket_id()

    # 2. RAG — strict grounding when FAQ match found
    context  = get_relevant_context(req.message)
    rag_used = bool(context)

    if rag_used:
        system_prompt = (
            f"{RAG_SYSTEM_PROMPT}\n\n"
            "══ COMPANY KNOWLEDGE (use ONLY this — do not invent anything) ══\n"
            f"{context}\n"
            "══ END OF COMPANY KNOWLEDGE ══\n\n"
            "Now answer the customer's question using ONLY the information above."
        )
    else:
        system_prompt = BASE_SYSTEM_PROMPT

    # 3. Build messages for OpenRouter
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    messages = [{"role": "system", "content": system_prompt}]

    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})

    # Grounding reminder injected into user turn when FAQ is active
    if rag_used:
        grounded_message = (
            f"{req.message}\n\n"
            "[REMINDER: Answer using ONLY the company knowledge provided. "
            "Do not invent any policies or details not present in that knowledge.]"
        )
    else:
        grounded_message = req.message

    messages.append({"role": "user", "content": grounded_message})

    payload = {"model": MODEL, "messages": messages}

    # 4. Call OpenRouter
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data       = response.json()
        reply      = data["choices"][0]["message"]["content"]
        model_used = data.get("model", MODEL)

    except requests.exceptions.HTTPError:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenRouter error: {response.text}",
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timed out.")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Return reply + metadata
    return ChatResponse(
        reply=reply,
        model=model_used,
        rag_used=rag_used,
        ticket=TicketMeta(
            ticket_id=ticket_id,
            sentiment=sentiment,
            priority=priority,
            escalate=escalate,
        ),
    )