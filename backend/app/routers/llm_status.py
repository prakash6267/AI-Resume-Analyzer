import logging
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from app.services.llm_orchestrator import llm_orchestrator
from app.database import is_connected_to_mysql

logger = logging.getLogger("resumeai.router.status")
router = APIRouter(prefix="/api/system", tags=["System & AI Status"])

class SwitchProviderPayload(BaseModel):
    provider: str  # "gemini", "ollama", "openai", "groq"

@router.get("/status")
async def get_system_status():
    status_data = llm_orchestrator.get_status()
    status_data["database"] = {
        "engine": "MySQL" if is_connected_to_mysql else "SQLite",
        "is_mysql": is_connected_to_mysql,
        "status": "Connected & Synchronized"
    }
    return status_data

@router.post("/switch-provider")
async def switch_provider(payload: SwitchProviderPayload):
    valid_providers = ["gemini", "ollama", "openai", "groq"]
    if payload.provider not in valid_providers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
        )

    llm_orchestrator.set_active_provider(payload.provider)
    return {
        "message": f"Active AI Provider updated to '{payload.provider}'",
        "active_provider": payload.provider
    }
