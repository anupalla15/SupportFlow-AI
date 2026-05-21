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

router = APIRouter()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"

SYSTEM_PROMPT = (
    "You are SupportFlow AI, a friendly and efficient customer support assistant. "
    "Keep responses concise, empathetic, and solution-focused. "
    "If an issue is urgent or unresolved, acknowledge frustration and offer clear next steps."
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
    ticket: TicketMeta          # ← always returned, frontend decides what to show

# ── Endpoint ──────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    # 1. Analyze sentiment before hitting the AI
    sentiment  = analyze_sentiment(req.message)
    priority   = get_priority(sentiment)
    escalate   = should_escalate(sentiment)
    ticket_id  = generate_ticket_id()

    # 2. Build messages for OpenRouter
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    payload = {"model": MODEL, "messages": messages}

    # 3. Call OpenRouter
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

    # 4. Return reply + ticket metadata
    return ChatResponse(
        reply=reply,
        model=model_used,
        ticket=TicketMeta(
            ticket_id=ticket_id,
            sentiment=sentiment,
            priority=priority,
            escalate=escalate,
        ),
    )