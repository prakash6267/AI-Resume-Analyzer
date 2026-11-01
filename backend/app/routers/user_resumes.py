import json
import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SavedResume, ATSHistory
from app.auth import get_current_user, get_optional_current_user
from app.schemas import ResumeJSON, ATSReport

logger = logging.getLogger("resumeai.router.resumes")
router = APIRouter(prefix="/api/resumes", tags=["Saved Resumes"])

class SaveResumePayload(BaseModel):
    resume_id: Optional[int] = None
    title: str = "My Resume"
    target_role: Optional[str] = ""
    template_id: str = "classic"
    ats_score: int = 0
    resume: ResumeJSON

class SaveATSHistoryPayload(BaseModel):
    resume_id: Optional[int] = None
    filename: str = "uploaded_resume.pdf"
    target_role: Optional[str] = ""
    score: int = 0
    report: ATSReport

@router.get("/my-resumes")
async def list_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(SavedResume).filter(
        SavedResume.user_id == current_user.id
    ).order_by(SavedResume.updated_at.desc()).all()

    return {
        "resumes": [r.to_dict() for r in resumes]
    }

@router.post("/save")
async def save_resume(
    payload: SaveResumePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume_json_str = payload.resume.model_dump_json()

    if payload.resume_id:
        # Update existing resume
        saved = db.query(SavedResume).filter(
            SavedResume.id == payload.resume_id,
            SavedResume.user_id == current_user.id
        ).first()

        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume record not found."
            )

        saved.title = payload.title
        saved.target_role = payload.target_role or payload.resume.target_role
        saved.template_id = payload.template_id
        saved.ats_score = payload.ats_score
        saved.resume_data = resume_json_str
        db.commit()
        db.refresh(saved)
        return {"message": "Resume updated successfully!", "resume": saved.to_dict()}
    else:
        # Create new resume
        new_resume = SavedResume(
            user_id=current_user.id,
            title=payload.title or f"{payload.resume.personal.full_name}'s Resume",
            target_role=payload.target_role or payload.resume.target_role,
            template_id=payload.template_id,
            ats_score=payload.ats_score,
            resume_data=resume_json_str
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        return {"message": "Resume saved to database successfully!", "resume": new_resume.to_dict()}

@router.get("/{resume_id}")
async def get_single_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(SavedResume).filter(
        SavedResume.id == resume_id,
        SavedResume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    return {"resume": resume.to_dict()}

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(SavedResume).filter(
        SavedResume.id == resume_id,
        SavedResume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully."}

@router.post("/history/save")
async def save_ats_audit(
    payload: SaveATSHistoryPayload,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"message": "Guest audit (not stored to account history)."}

    record = ATSHistory(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        filename=payload.filename,
        target_role=payload.target_role,
        score=payload.score,
        report_data=payload.report.model_dump_json()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"message": "Audit history stored to MySQL database!", "history": record.to_dict()}
