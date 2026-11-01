import json
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException

from app.schemas import ChatRequest, ChatResponse
from app.services.llm_orchestrator import llm_orchestrator

logger = logging.getLogger("proresume.router.chat")
router = APIRouter(prefix="/api/chat", tags=["AI Career & Recruiter Chatbot"])

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(payload: ChatRequest):
    """
    Context-aware AI Career & Hiring Assistant chatbot.
    Can answer questions regarding resume tailoring, interview prep, ATS tips, or hiring requirements.
    """
    if not payload.messages:
        raise HTTPException(status_code=400, detail="No chat messages provided.")

    latest_msg = payload.messages[-1].content
    history_lines = [f"[{m.role.upper()}]: {m.content}" for m in payload.messages[:-1]]
    history_text = "\n".join(history_lines) if history_lines else "None"

    resume_context = ""
    if payload.resume:
        resume_context = f"Candidate: {payload.resume.personal.full_name}\nTarget Role: {payload.target_role or payload.resume.target_role}\nSummary: {payload.resume.summary}\nSkills: {[s for cat in payload.resume.skills for s in cat.items][:10]}"
    else:
        resume_context = "No specific candidate resume attached (General inquiry)."

    prompt_template = load_prompt("chat_assistant.txt")
    prompt = prompt_template.format(
        resume_context=resume_context,
        target_role=payload.target_role or "Software & Technical Engineering",
        job_description=payload.job_description or "General tech industry standards",
        conversation_history=history_text,
        user_message=latest_msg
    )

    try:
        chat_res = llm_orchestrator.call_structured(
            prompt=prompt,
            schema=ChatResponse,
            temperature=0.4
        )
        return chat_res
    except Exception as e:
        logger.warning(f"LLM Chat response failed ({e}). Returning heuristic guidance.")
        return ChatResponse(
            reply=(
                "### 💡 Career & ATS Recommendation\n\n"
                "To maximize your interview callbacks:\n"
                "1. **Align Exact Keywords**: Ensure technical tools mentioned in the job description appear explicitly in your skills and project bullets.\n"
                "2. **Quantify Metrics**: Use the **Google X-Y-Z formula** (*Accomplished [X] as measured by [Y], by doing [Z]*).\n"
                "3. **Single-Column Parsability**: ATS parsers read clean vertical flows with zero multi-column tables or icon graphics.\n\n"
                "Would you like me to tailor a specific project bullet or generate a practice interview question for your target role?"
            ),
            suggested_followups=[
                "How do I explain my technical projects in interviews?",
                "Tailor my summary for Senior Backend Engineer",
                "What salary range should I expect for this role?"
            ]
        )
