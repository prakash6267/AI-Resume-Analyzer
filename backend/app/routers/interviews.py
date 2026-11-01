import json
import uuid
import random
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, JobPosting, JobApplication, InterviewSchedule, AIEvaluation
from app.auth import get_optional_current_user, get_current_user
from app.schemas import (
    ScheduleInterviewRequest, InterviewQuestionSheet,
    AIEvalTurnRequest, AIEvalTurnResponse, AIFinalReportRequest, AIFinalReportResponse, ResumeJSON
)
from app.services.interview_service import interview_service
from app.services.email_service import email_service

logger = logging.getLogger("proresume.router.interviews")
router = APIRouter(prefix="/api/interviews", tags=["Interviews, Scheduling & AI Live Mock Room"])

def _generate_meeting_link(platform: str) -> str:
    meeting_code = f"{uuid.uuid4().hex[:3]}-{uuid.uuid4().hex[3:7]}-{uuid.uuid4().hex[7:10]}"
    if platform.lower() == "zoom":
        return f"https://zoom.us/j/{random.randint(8000000000, 9999999999)}?pwd={uuid.uuid4().hex[:10]}"
    return f"https://meet.google.com/{meeting_code}"

@router.post("/schedule")
async def schedule_interview(
    payload: ScheduleInterviewRequest,
    db: Session = Depends(get_db)
):
    """
    Schedules an online interview (Google Meet / Zoom) for a shortlisted candidate
    and automatically dispatches an email invitation with meeting link!
    """
    app_record = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found.")

    meeting_link = payload.custom_meeting_link.strip() if payload.custom_meeting_link else _generate_meeting_link(payload.platform)
    company = payload.company_name or (app_record.job.company_name if app_record.job else "Hiring Company")

    schedule_rec = InterviewSchedule(
        application_id=app_record.id,
        job_id=app_record.job_id,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        job_title=payload.job_title,
        company_name=company,
        interview_date=payload.interview_date,
        interview_time=payload.interview_time,
        platform=payload.platform,
        meeting_link=meeting_link,
        interviewer_notes=payload.interviewer_notes or "",
        status="scheduled",
        email_dispatched=True
    )
    db.add(schedule_rec)

    # Update application status
    app_record.status = "interview_scheduled"
    db.commit()
    db.refresh(schedule_rec)

    # Dispatch email invitation asynchronously
    email_result = await email_service.send_interview_invitation(
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        job_title=payload.job_title,
        company_name=company,
        interview_date=payload.interview_date,
        interview_time=payload.interview_time,
        platform=payload.platform,
        meeting_link=meeting_link,
        notes=payload.interviewer_notes or ""
    )

    logger.info(
        f"[INTERVIEW SCHEDULED] Candidate: {payload.candidate_name} ({payload.candidate_email}) | "
        f"Platform: {payload.platform} | Link: {meeting_link}"
    )

    return {
        "message": f"Interview scheduled successfully and invitation emailed to {payload.candidate_email}!",
        "interview": schedule_rec.to_dict(),
        "meeting_link": meeting_link,
        "email_delivery": email_result
    }

@router.get("/my-interviews")
async def list_interviews(
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all scheduled interviews."""
    query = db.query(InterviewSchedule)
    if email and email.strip():
        query = query.filter(InterviewSchedule.candidate_email == email.lower().strip())
    
    interviews = query.order_by(InterviewSchedule.created_at.desc()).all()
    return {
        "interviews": [i.to_dict() for i in interviews]
    }

@router.get("/{application_id}/questions", response_model=InterviewQuestionSheet)
async def get_interviewer_questions(
    application_id: int,
    db: Session = Depends(get_db)
):
    """
    Generates a customized question sheet for the human interviewer
    based on candidate's exact resume projects, bullets, and target job description.
    """
    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found.")

    try:
        resume_dict = json.loads(app_record.resume_data)
        resume_obj = ResumeJSON.model_validate(resume_dict)
    except Exception as e:
        logger.warning(f"Failed to parse resume JSON for interview questions: {e}")
        resume_obj = ResumeJSON(target_role=app_record.job.title if app_record.job else "Software Engineer")

    job_title = app_record.job.title if app_record.job else "Candidate Role"
    jd = app_record.job.job_description if app_record.job else ""

    question_sheet = interview_service.generate_interview_questions(
        resume=resume_obj,
        target_role=job_title,
        job_description=jd
    )

    return question_sheet

@router.post("/ai-interview-turn", response_model=AIEvalTurnResponse)
async def conduct_ai_interview_turn(payload: AIEvalTurnRequest):
    """
    Autonomous AI Interviewer Turn: Evaluates the candidate's answer in real-time,
    grades it 1-10, provides immediate feedback, and produces the next follow-up question.
    """
    response = interview_service.evaluate_interview_turn(payload)
    return response

@router.post("/ai-final-evaluation", response_model=AIFinalReportResponse)
async def finalize_ai_interview_evaluation(
    payload: AIFinalReportRequest,
    db: Session = Depends(get_db)
):
    """
    Synthesizes the complete AI mock interview session into an official hiring evaluation report
    and stores it in MySQL.
    """
    report = interview_service.generate_final_report(payload)

    # Save to database
    eval_record = AIEvaluation(
        interview_id=payload.interview_id,
        application_id=payload.application_id,
        candidate_name=payload.candidate_name,
        job_title=payload.job_title,
        total_score=report.total_score,
        qa_transcript=json.dumps([t.model_dump() for t in payload.transcript]),
        strengths=json.dumps(report.strengths),
        weaknesses=json.dumps(report.weaknesses),
        hire_recommendation=report.hire_recommendation,
        detailed_summary=report.detailed_summary
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)

    logger.info(
        f"[AI EVALUATION COMPLETE] Candidate '{payload.candidate_name}' for '{payload.job_title}'. "
        f"Score: {report.total_score}/10 -> Recommendation: {report.hire_recommendation}"
    )

    return report
