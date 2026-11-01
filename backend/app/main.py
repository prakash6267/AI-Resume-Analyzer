import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db, is_connected_to_mysql
from app.services.llm_orchestrator import llm_orchestrator
from app.routers import (
    resume, ats, templates, auth, user_resumes, 
    backup, llm_status, jobs, interviews, chat, email
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("proresume")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Database Tables
    init_db()
    db_type = "MySQL" if is_connected_to_mysql else "SQLite (Local Failover)"
    logger.info(f"Database initialized: Active Engine = {db_type}")

    # 2. Check AI Engine and Multi-Key Status
    gemini_keys = settings.get_gemini_keys_list()
    ollama_ok = llm_orchestrator.check_ollama_health()

    logger.info("=" * 70)
    logger.info("ProResume Enterprise Platform Ready")
    logger.info(f"Gemini API Keys Configured: {len(gemini_keys)} account key(s)")
    logger.info(f"Ollama Local Model Service: {'Online & Ready' if ollama_ok else 'Offline (Start Ollama on :11434 for local inference)'}")
    logger.info(f"Active Default Provider: {settings.DEFAULT_AI_PROVIDER}")
    logger.info("=" * 70)

    yield

app = FastAPI(
    title="ProResume ATS Enterprise API",
    description="Enterprise ATS Recruitment, Multi-LLM Key Rotation, Automated Interview Scheduling & AI Mock Evaluator",
    version="3.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount All Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(interviews.router)
app.include_router(chat.router)
app.include_router(email.router)
app.include_router(user_resumes.router)
app.include_router(backup.router)
app.include_router(llm_status.router)
app.include_router(resume.router)
app.include_router(ats.router)
app.include_router(templates.router)

@app.get("/api/health")
async def health_check():
    gemini_keys = settings.get_gemini_keys_list()
    ollama_ok = llm_orchestrator.check_ollama_health()
    return {
        "status": "healthy",
        "database": "MySQL" if is_connected_to_mysql else "SQLite",
        "gemini_keys_count": len(gemini_keys),
        "ollama_available": ollama_ok,
        "ai_ready": bool(len(gemini_keys) > 0 or ollama_ok or settings.OPENAI_API_KEY or settings.GROQ_API_KEY)
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Service error encountered. Please try again."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
