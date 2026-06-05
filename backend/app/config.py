from dotenv import load_dotenv
import os

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY       = os.getenv("GROQ_API_KEY")        # ← ADD

if not GROQ_API_KEY and not OPENROUTER_API_KEY:
    raise ValueError("Set GROQ_API_KEY or OPENROUTER_API_KEY in .env")