import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException

from app.schemas import (
    ResumeJSON, ResumeGenerateRequest, ResumeRefineRequest,
    ResumeSuggestRequest, ResumeSuggestResponse, RenderPDFRequest
)
from app.security import rate_limiter
from app.services.gemini_service import gemini_service
from app.services.suggestions_service import suggestions_service
from app.services.render_service import render_service

logger = logging.getLogger("resumeai.router.resume")
router = APIRouter(prefix="/api/resume", tags=["Resume"])

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()

@router.post("/generate", response_model=ResumeJSON)
async def generate_resume(
    payload: ResumeGenerateRequest,
    request: Request
):
    rate_limiter.check_and_record(request)

    prompt_template = load_prompt("generate.txt")
    user_data_str = json.dumps(payload.user_data, indent=2)

    prompt = prompt_template.format(
        target_role=payload.target_role,
        experience_level=payload.experience_level,
        job_description=payload.job_description or "None provided",
        user_data=user_data_str
    )

    try:
        resume_json = gemini_service.call_structured(
            prompt=prompt,
            schema=ResumeJSON,
            temperature=0.3
        )
    except Exception as e:
        logger.warning(f"LLM generate failed ({e}). Parsing directly from wizard inputs.")
        ud = payload.user_data or {}
        resume_json = ResumeJSON(
            target_role=payload.target_role,
            summary=ud.get("summary") or f"Dedicated {payload.target_role} with proven track record in software engineering, system design, and building robust modern applications.",
            personal=ud.get("personal") or {"full_name": ud.get("full_name", "Professional Candidate"), "email": ud.get("email", "candidate@example.com")},
            skills=ud.get("skills") or [{"category": "Core Competencies", "items": ["Software Engineering", "System Architecture", "Python", "React", "APIs"]}],
            experience=ud.get("experience") or [],
            education=ud.get("education") or [],
            projects=ud.get("projects") or [],
            certifications=ud.get("certifications") or []
        )

    if not resume_json.target_role:
        resume_json.target_role = payload.target_role

    return resume_json

@router.post("/refine", response_model=ResumeJSON)
async def refine_section(
    payload: ResumeRefineRequest,
    request: Request
):
    rate_limiter.check_and_record(request)

    prompt_template = load_prompt("refine.txt")
    prompt = prompt_template.format(
        section_name=payload.section,
        instruction=payload.instruction,
        resume_data=payload.resume.model_dump_json(indent=2)
    )

    try:
        refined_resume = gemini_service.call_structured(
            prompt=prompt,
            schema=ResumeJSON,
            temperature=0.3
        )
        return refined_resume
    except Exception as e:
        logger.warning(f"LLM refine failed ({e}). Returning base resume.")
        return payload.resume

@router.post("/suggest", response_model=ResumeSuggestResponse)
async def get_suggestions(
    payload: ResumeSuggestRequest,
    request: Request
):
    rate_limiter.check_and_record(request)

    response = suggestions_service.get_suggestions(
        resume=payload.resume,
        target_role=payload.target_role,
        job_description=payload.job_description
    )
    return response

@router.post("/render-pdf")
async def render_pdf(payload: RenderPDFRequest):
    pdf_bytes = await render_service.render_pdf(
        resume=payload.resume,
        template_id=payload.template_id
    )

    clean_name = "".join(c for c in (payload.resume.personal.full_name or "Resume") if c.isalnum() or c in " _-")
    filename = f"{clean_name}_{payload.template_id}.pdf".replace(" ", "_")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/render-html")
async def render_html_preview(payload: RenderPDFRequest):
    html_content = render_service.render_html(
        resume=payload.resume,
        template_id=payload.template_id
    )
    return {"html": html_content}
