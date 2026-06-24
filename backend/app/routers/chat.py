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
from app.services.agent_router import route_to_multiple_agents, AGENTS
from app.services.intent_classifier import classify_intent, get_static_response  # ← NEW
from app.services.llm_service import call_llm
from app.services.conversation_memory import get_memory, reset_memory, cleanup_old_sessions

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
MULTI_AGENT_PROMPT = """You are coordinating a MULTI-AGENT RESPONSE from two FlowZint specialist teams.

PRIMARY AGENT:   {primary_agent} — {primary_prompt}
SECONDARY AGENT: {secondary_agent} — {secondary_prompt}

RESPONSE FORMAT (follow exactly, no deviation):
[{primary_label}]
<2-3 sentences diagnosing the primary issue>

[{secondary_label}]
<2-3 sentences diagnosing the secondary issue>

[Coordinated Resolution]
<1 unified next step addressing both issues>

RULES:
- Total response under 120 words
- Each section must be distinct — no repetition
- Enterprise operational language throughout
- End with exactly one actionable next step"""

ESCALATION_PROMPT_SUFFIX = """
ESCALATION ACTIVE: Acknowledge severity in one sentence.
State Enterprise Operations Team notified.
Give queue position.
Keep response concise.
"""
# ── Schemas ────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str
class ChatRequest(BaseModel):
    message:         str
    history:         list[Message] = []
    conversation_id: str           = "default"   # frontend passes this per session

    class Config:
        json_schema_extra = {
            "example": {
                "message":         "My scheduled workflow stopped executing overnight",
                "history":         [],
                "conversation_id": "session-abc123"
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
    status: str = "success"
    ticket: TicketMeta
    rag_used: bool = False
    summary: dict = {}
    agent_info: dict = {}
    agent_info_2: dict = {}
    multi_agent: bool = False
    sources: list = []
    

# ── Endpoint ───────────────────────────────────────────────────────
@router.post("/", response_model=ChatResponse, summary="Chat with SupportFlow AI")
async def chat(req: ChatRequest):

    # 1. Intent classification
    intent = classify_intent(req.message)
    static_reply = get_static_response(intent)

    if static_reply:
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

    # 2. Sentiment analysis
    sentiment = analyze_sentiment(req.message)
    priority = get_priority(sentiment)
    escalate = should_escalate(sentiment)
    critical = is_critical(sentiment)

    ticket_id = generate_ticket_id()
    queue_position = generate_queue_position() if critical else None

     # 3. Agent routing — memory-aware
    memory = get_memory(req.conversation_id)
    print("=" * 50)
    print("MESSAGE:", req.message)
    print("LOCK:", memory.should_lock_agent(req.message))
    print("CATEGORY:", memory.case.category)
    print("LOCKED AGENT:", memory.get_locked_agent_key())
    print("=" * 50)

    if memory.should_lock_agent(req.message):
        # Follow-up message — keep the established agent
        locked_key = memory.get_locked_agent_key()

        if locked_key and locked_key in AGENTS:
            primary = {**AGENTS[locked_key], "key": locked_key}

            sec_key = memory.case.secondary_category
            secondary = (
                {**AGENTS[sec_key], "key": sec_key}
                if sec_key and sec_key in AGENTS
                else None
            )

            multi_agent = secondary is not None

        else:
            primary, secondary = route_to_multiple_agents(req.message)
            multi_agent = secondary is not None

    else:
        # New message — handle topic switch then route normally
        if memory.is_topic_switch(req.message):
            memory.handle_topic_switch(req.message)

        primary, secondary = route_to_multiple_agents(req.message)
        multi_agent = secondary is not None

    # 4. RAG
    context = get_relevant_context(req.message)
    rag_used = bool(context)

    # 5. Build system prompt
    if multi_agent:
        system_prompt = MULTI_AGENT_PROMPT.format(
            primary_agent=primary["agent"],
            primary_prompt=primary["prompt"],
            secondary_agent=secondary["agent"],
            secondary_prompt=secondary["prompt"],
            primary_label=primary["department"],
            secondary_label=secondary["department"],
        )

        if rag_used:
            system_prompt += (
                f"\n\nCOMPANY KNOWLEDGE (use where relevant):\n"
                f"{context}\nEND KNOWLEDGE"
            )

    elif rag_used:
        system_prompt = (
            f"{BASE_PROMPT}\n\n"
            f"SPECIALIST CONTEXT: {primary['prompt']}\n\n"
            f"COMPANY KNOWLEDGE (answer ONLY from this):\n"
            f"{context}\nEND KNOWLEDGE"
        )

    else:
        system_prompt = (
            f"{BASE_PROMPT}\n\n"
            f"SPECIALIST CONTEXT: {primary['prompt']}"
        )

    if critical:
        system_prompt += (
            f"\n\n{ESCALATION_PROMPT_SUFFIX}\n"
            f"Queue position: #{queue_position}"
        )

    # 6. Build messages
    memory_block = memory.build_memory_prompt()

    full_system = (
        f"{system_prompt}\n\n{memory_block}"
        if memory_block
        else system_prompt
    )

    user_content = req.message

    if memory.should_lock_agent(req.message):
      user_content = memory.build_continuation_hint(req.message)

    if rag_used:
     user_content += "\n\n[Use ONLY company knowledge. Do not invent.]"

    memory_prompt = memory.build_memory_prompt()

    messages = [
     {
        "role": "system",
        "content": full_system,
     }
    ]
    processed = memory.build_processed_history()

    if processed:
        messages.extend(processed)
    else:
        for msg in req.history:
            messages.append(
                {
                    "role": msg.role,
                    "content": msg.content,
                }
            )

    # If this is a follow-up, enrich it with memory

    messages.append(
    {
        "role": "user",
        "content": user_content,
    }
)

     # 7. LLM Call
    try:
        print("=" * 60)
        print("MEMORY PROMPT")
        print(memory.build_memory_prompt())
        print("=" * 60)

        print("USER CONTENT")
        print(user_content)
        print("=" * 60)

        reply, model_used = call_llm(messages)

        # Update conversation memory
        memory.update(req.message, reply)

        if critical:
            memory.mark_escalated()

        print("=" * 60)
        print("MODEL:", model_used)
        print("REPLY:", repr(reply))
        print("=" * 60)

    except Exception as e:
        print("LLM ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=f"LLM error: {str(e)}"
        )

    # 8. Summary

    full_convo = [
        {
            "role": m.role,
            "content": m.content
        }
        for m in req.history
    ]

    full_convo.extend(
        [
            {
                "role": "user",
                "content": req.message
            },
            {
                "role": "assistant",
                "content": reply
            }
        ]
    )

    summary = generate_summary(
        full_convo,
        ticket_id
    )

    # 9. Response
    return ChatResponse(
        reply=reply,
        model=model_used,
        rag_used=rag_used,
        sources=["faq.txt"] if rag_used else [],
        summary=summary,
        multi_agent=multi_agent,

        agent_info={
            "agent": primary["agent"],
            "department": primary["department"],
            "emoji": primary["emoji"],
            "color": primary["color"],
        },

        agent_info_2={
            "agent": secondary["agent"],
            "department": secondary["department"],
            "emoji": secondary["emoji"],
            "color": secondary["color"],
        } if multi_agent else {},

        ticket=TicketMeta(
            ticket_id=ticket_id,
            sentiment=sentiment,
            priority=priority,
            escalate=escalate,
            critical=critical,
            queue_position=queue_position,
        ),
    )


# =====================================================================
# Conversation Memory Reset Endpoint
# PLACE THIS AFTER THE ENTIRE chat() FUNCTION
# =====================================================================

@router.post("/reset", summary="Reset conversation memory for a session")
async def reset_conversation(conversation_id: str = "default"):
    reset_memory(conversation_id)
    return {
        "status": "memory cleared",
        "conversation_id": conversation_id,
    }