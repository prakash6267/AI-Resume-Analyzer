import logging
from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException

from app.config import settings
from app.schemas import (
    ResumeJSON, ATSReport, ATSScoreRequest,
    ATSEnhanceRequest, ATSEnhanceResponse
)
from app.security import rate_limiter
from app.services.parser_service import parser_service
from app.services.ats_service import ats_service

logger = logging.getLogger("resumeai.router.ats")
router = APIRouter(prefix="/api/ats", tags=["ATS"])

@router.post("/upload")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("")
):
    rate_limiter.check_and_record(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected for upload.")

    # Validate file extension
    ext = "." + file.filename.lower().split(".")[-1]
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Allowed file formats are .pdf and .docx only.")

    # Validate file size (5MB limit)
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed {settings.MAX_UPLOAD_SIZE_MB}MB limit."
        )

    extracted_text, resume_json = parser_service.parse_file(
        file_bytes=file_bytes,
        filename=file.filename
    )

    if target_role and target_role.strip():
        resume_json.target_role = target_role.strip()

    return {
        "filename": file.filename,
        "extracted_text": extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""),
        "resume": resume_json
    }

@router.post("/score", response_model=ATSReport)
async def score_resume(
    payload: ATSScoreRequest,
    request: Request
):
    rate_limiter.check_and_record(request)

    report = ats_service.analyze_and_score(
        resume=payload.resume,
        target_role=payload.target_role,
        job_description=payload.job_description
    )
    return report

@router.post("/enhance", response_model=ATSEnhanceResponse)
async def enhance_resume(
    payload: ATSEnhanceRequest,
    request: Request
):
    rate_limiter.check_and_record(request)

    enhanced = ats_service.enhance_resume(
        resume=payload.resume,
        report=payload.report,
        target_role=payload.target_role,
        job_description=payload.job_description,
        user_answers=payload.user_answers
    )
    return enhanced
