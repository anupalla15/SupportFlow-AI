import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import OPENROUTER_API_KEY

router = APIRouter()

# ── OpenRouter config ──────────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"

SYSTEM_PROMPT = (
    "You are SupportFlow AI, a friendly and efficient customer support assistant. "
    "Keep responses concise, empathetic, and solution-focused."
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
                "message": "My order hasn't arrived. What should I do?",
                "history": []
            }
        }

class ChatResponse(BaseModel):
    reply: str
    model: str
    status: str = "success"


# ── Endpoint ───────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",  # ← must be exact format
        "Content-Type": "application/json",
    }

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    payload = {
        "model": MODEL,
        "messages": messages,
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )

        # Print raw response for debugging — remove after confirmed working
        print("Status:", response.status_code)
        print("Body:  ", response.text)

        response.raise_for_status()
        data = response.json()

        reply      = data["choices"][0]["message"]["content"]
        model_used = data.get("model", MODEL)

        return ChatResponse(reply=reply, model=model_used)

    except requests.exceptions.HTTPError as e:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenRouter error {response.status_code}: {response.text}"
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="OpenRouter request timed out.")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail=f"Unexpected response format: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")