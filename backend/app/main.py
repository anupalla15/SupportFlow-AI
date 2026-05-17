from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
app = FastAPI(
    title="SupportFlow AI",
    description="Autonomous AI-powered customer support automation platform",
    version="1.0.0"
)

# ---------- CORS ----------
# Add any frontend URLs you need here
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # CRA fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers ----------
app.include_router(
    chat.router,
    prefix="/api/chat",
    tags=["Chat"],
)

# ---------- Health check ----------
@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "SupportFlow AI"}