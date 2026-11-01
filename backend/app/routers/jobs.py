import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, JobPosting, JobApplication
from app.auth import get_optional_current_user, get_current_user
from app.schemas import JobCreateRequest, JobApplyRequest
from app.services.ats_service import ats_service

logger = logging.getLogger("proresume.router.jobs")
router = APIRouter(prefix="/api/jobs", tags=["Company Job Openings & Candidate Applications"])

@router.get("")
async def list_jobs(db: Session = Depends(get_db)):
    """List all open job postings."""
    jobs = db.query(JobPosting).filter(JobPosting.status == "active").order_by(JobPosting.created_at.desc()).all()
    
    # If no jobs exist in DB yet, auto-seed 3 sample tech openings so recruiter & candidate features work out-of-the-box
    if not jobs:
        sample_jobs = [
            JobPosting(
                company_name="ApexCloud Technologies",
                title="Senior Full Stack Engineer (Python & React)",
                department="Platform Engineering",
                location="Remote / Hybrid",
                experience_level="3-6 years",
                job_description="Seeking a Senior Full Stack Engineer experienced with FastAPI, React, TypeScript, Docker, and PostgreSQL to scale distributed cloud APIs and microservices.",
                required_skills="Python, FastAPI, React, TypeScript, Docker, PostgreSQL, REST APIs, CI/CD",
                min_ats_cutoff=70,
                status="active"
            ),
            JobPosting(
                company_name="DataForge Analytics",
                title="Data Scientist / AI Engineer",
                department="AI & Insights",
                location="San Francisco, CA / Remote",
                experience_level="2-5 years",
                job_description="Looking for an AI/ML specialist with deep expertise in PyTorch, NLP, Vector Databases, and LLM fine-tuning to build enterprise generative intelligence products.",
                required_skills="Python, PyTorch, LangChain, Vector DB, SQL, NLP, HuggingFace, FastAPI",
                min_ats_cutoff=75,
                status="active"
            ),
            JobPosting(
                company_name="FinCore Global",
                title="DevOps & Cloud Infrastructure Engineer",
                department="Site Reliability",
                location="New York, NY / Remote",
                experience_level="4+ years",
                job_description="Seeking a Cloud & DevOps engineer proficient in AWS, Terraform, Kubernetes, and Linux to maintain zero-downtime financial platforms.",
                required_skills="AWS, Kubernetes, Terraform, Docker, Linux, CI/CD, Prometheus, Bash",
                min_ats_cutoff=70,
                status="active"
            )
        ]
        db.add_all(sample_jobs)
        db.commit()
        jobs = db.query(JobPosting).filter(JobPosting.status == "active").all()

    return {"jobs": [j.to_dict() for j in jobs]}

@router.post("")
async def create_job(
    payload: JobCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Company/Recruiter posts a new job opening."""
    skills_str = ", ".join(payload.required_skills) if payload.required_skills else ""
    company = payload.company_name or (current_user.company_name if current_user and current_user.company_name else "TechCorp Global")

    new_job = JobPosting(
        recruiter_id=current_user.id if current_user else None,
        company_name=company,
        title=payload.title.strip(),
        department=payload.department.strip(),
        location=payload.location.strip(),
        experience_level=payload.experience_level.strip(),
        job_description=payload.job_description.strip(),
        required_skills=skills_str,
        min_ats_cutoff=payload.min_ats_cutoff,
        status="active"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "message": f"Job opening '{new_job.title}' posted successfully!",
        "job": new_job.to_dict()
    }

@router.get("/{job_id}")
async def get_job_details(job_id: int, db: Session = Depends(get_db)):
    """Get specific job details."""
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")
    return {"job": job.to_dict()}

@router.post("/{job_id}/apply")
async def apply_for_job(
    job_id: int,
    payload: JobApplyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate applies for a job with their resume.
    The system automatically scores the resume against the job description with the 100-point rubric
    and auto-shortlists if score >= min_ats_cutoff.
    """
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    # 1. Audit resume against this exact job posting
    ats_report = ats_service.analyze_and_score(
        resume=payload.resume,
        target_role=job.title,
        job_description=job.job_description
    )

    score = ats_report.score
    is_shortlisted = score >= job.min_ats_cutoff
    status_label = "shortlisted" if is_shortlisted else "submitted"

    # 2. Save application record
    app_record = JobApplication(
        job_id=job.id,
        candidate_id=current_user.id if current_user else None,
        candidate_name=payload.candidate_name.strip(),
        candidate_email=payload.candidate_email.lower().strip(),
        candidate_phone=payload.candidate_phone.strip(),
        resume_data=payload.resume.model_dump_json(),
        ats_score=score,
        score_breakdown=json.dumps([b.model_dump() for b in ats_report.breakdown]),
        status=status_label,
        cover_note=payload.cover_note or ""
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)

    logger.info(
        f"[JOB APPLICATION] Candidate '{payload.candidate_name}' applied for '{job.title}'. "
        f"Score: {score}/100 (Cutoff: {job.min_ats_cutoff}). Status: {status_label.upper()}"
    )

    return {
        "message": f"Application submitted successfully! Your ATS Match Score is {score}/100.",
        "application_id": app_record.id,
        "ats_score": score,
        "is_shortlisted": is_shortlisted,
        "status": status_label,
        "cutoff_score": job.min_ats_cutoff,
        "report": ats_report
    }

@router.get("/{job_id}/applications")
async def get_job_applicants(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Recruiter view of all applicants for a job opening, ranked by ATS Score."""
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    applications = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).order_by(JobApplication.ats_score.desc()).all()

    return {
        "job": job.to_dict(),
        "total_applicants": len(applications),
        "shortlisted_count": len([a for a in applications if a.ats_score >= job.min_ats_cutoff]),
        "applications": [a.to_dict() for a in applications]
    }
