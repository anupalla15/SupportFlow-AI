import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import OPENROUTER_API_KEY
from app.services.sentiment import (
    analyze_sentiment,
    get_priority,
    should_escalate,
    generate_ticket_id,
)
from app.services.rag_service import get_relevant_context          # ← ADD

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-3.2-3b-instruct:free"                   # ← free model

BASE_SYSTEM_PROMPT = (
    "You are SupportFlow AI, a friendly and efficient customer support assistant. "
    "Keep responses concise, empathetic, and solution-focused. "
    "If an issue is urgent or unresolved, acknowledge frustration and offer clear next steps. "
    "When company policy information is provided, always use it in your answer."
)

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
                "message": "I'm really angry, my order never arrived!",
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
    rag_used: bool = False                                          # ← ADD

# ── Endpoint ───────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    # 1. Sentiment analysis
    sentiment = analyze_sentiment(req.message)
    priority  = get_priority(sentiment)
    escalate  = should_escalate(sentiment)
    ticket_id = generate_ticket_id()

    # 2. RAG — check FAQ for relevant context                      ← ADD block
    context  = get_relevant_context(req.message)
    rag_used = bool(context)

    if rag_used:
        system_prompt = (
            f"{BASE_SYSTEM_PROMPT}\n\n"
            f"Use the following company knowledge to answer accurately:\n\n"
            f"{context}"
        )
    else:
        system_prompt = BASE_SYSTEM_PROMPT

    # 3. Build messages for OpenRouter
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    messages = [{"role": "system", "content": system_prompt}]     # ← was SYSTEM_PROMPT
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    payload = {"model": MODEL, "messages": messages}

    # 4. Call OpenRouter
    try:
        response = requests.post(
            OPENROUTER_URL, headers=headers, json=payload, timeout=30
        )
        response.raise_for_status()
        data       = response.json()
        reply      = data["choices"][0]["message"]["content"]
        model_used = data.get("model", MODEL)

    except requests.exceptions.HTTPError:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenRouter error: {response.text}"
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timed out.")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Return reply + ticket + rag flag
    return ChatResponse(
        reply=reply,
        model=model_used,
        rag_used=rag_used,                                         # ← ADD
        ticket=TicketMeta(
            ticket_id=ticket_id,
            sentiment=sentiment,
            priority=priority,
            escalate=escalate,
        ),
    )