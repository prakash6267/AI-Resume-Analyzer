import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="")
    role = Column(String(50), default="candidate")  # "candidate", "recruiter", "admin"
    company_name = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resumes = relationship("SavedResume", back_populates="owner", cascade="all, delete-orphan")
    ats_history = relationship("ATSHistory", back_populates="owner", cascade="all, delete-orphan")
    job_postings = relationship("JobPosting", back_populates="recruiter", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "company_name": self.company_name,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SavedResume(Base):
    __tablename__ = "saved_resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Untitled Resume")
    target_role = Column(String(255), default="")
    template_id = Column(String(50), default="classic")
    ats_score = Column(Integer, default=0)
    resume_data = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="resumes")

    def to_dict(self):
        try:
            parsed_data = json.loads(self.resume_data) if self.resume_data else {}
        except Exception:
            parsed_data = {}

        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_role": self.target_role,
            "template_id": self.template_id,
            "ats_score": self.ats_score,
            "resume": parsed_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ATSHistory(Base):
    __tablename__ = "ats_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(Integer, nullable=True)
    filename = Column(String(255), default="uploaded_resume.pdf")
    target_role = Column(String(255), default="")
    score = Column(Integer, default=0)
    report_data = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="ats_history")

    def to_dict(self):
        try:
            parsed_report = json.loads(self.report_data) if self.report_data else {}
        except Exception:
            parsed_report = {}

        return {
            "id": self.id,
            "user_id": self.user_id,
            "resume_id": self.resume_id,
            "filename": self.filename,
            "target_role": self.target_role,
            "score": self.score,
            "report": parsed_report,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_name = Column(String(255), nullable=False, default="Enterprise Corp")
    title = Column(String(255), nullable=False)  # e.g. "Senior Full Stack Engineer"
    department = Column(String(255), default="Engineering")
    location = Column(String(255), default="Remote / Hybrid")
    experience_level = Column(String(100), default="3-5 years")
    job_description = Column(Text, nullable=False)
    required_skills = Column(Text, default="")  # comma-separated or JSON
    min_ats_cutoff = Column(Integer, default=70)  # e.g. 70/100
    status = Column(String(50), default="active")  # "active", "closed"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recruiter = relationship("User", back_populates="job_postings")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

    def to_dict(self):
        skills_list = [s.strip() for s in self.required_skills.split(",") if s.strip()] if self.required_skills else []
        return {
            "id": self.id,
            "recruiter_id": self.recruiter_id,
            "company_name": self.company_name,
            "title": self.title,
            "department": self.department,
            "location": self.location,
            "experience_level": self.experience_level,
            "job_description": self.job_description,
            "required_skills": skills_list,
            "min_ats_cutoff": self.min_ats_cutoff,
            "status": self.status,
            "total_applicants": len(self.applications) if self.applications else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    candidate_id = Column(Integer, nullable=True)  # Optional linked user ID
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    candidate_phone = Column(String(100), default="")
    resume_data = Column(Text, nullable=False)  # JSON representation of ResumeJSON
    ats_score = Column(Integer, default=0)
    score_breakdown = Column(Text, default="{}")
    status = Column(String(50), default="submitted")  # "submitted", "shortlisted", "interview_scheduled", "rejected", "hired"
    cover_note = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobPosting", back_populates="applications")
    interviews = relationship("InterviewSchedule", back_populates="application", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            parsed_resume = json.loads(self.resume_data) if self.resume_data else {}
        except Exception:
            parsed_resume = {}
        try:
            parsed_breakdown = json.loads(self.score_breakdown) if self.score_breakdown else {}
        except Exception:
            parsed_breakdown = {}

        return {
            "id": self.id,
            "job_id": self.job_id,
            "job_title": self.job.title if self.job else "",
            "company_name": self.job.company_name if self.job else "",
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "ats_score": self.ats_score,
            "score_breakdown": parsed_breakdown,
            "status": self.status,
            "is_shortlisted": bool(self.job and self.ats_score >= self.job.min_ats_cutoff),
            "cover_note": self.cover_note,
            "resume": parsed_resume,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False, index=True)
    job_id = Column(Integer, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), default="")
    interview_date = Column(String(100), nullable=False)  # e.g. "2026-09-25"
    interview_time = Column(String(100), nullable=False)  # e.g. "14:00 (2:00 PM IST)"
    platform = Column(String(50), default="Google Meet")  # "Google Meet", "Zoom"
    meeting_link = Column(String(500), nullable=False)
    interviewer_notes = Column(Text, default="")
    status = Column(String(50), default="scheduled")  # "scheduled", "completed", "cancelled"
    email_dispatched = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("JobApplication", back_populates="interviews")
    evaluations = relationship("AIEvaluation", back_populates="interview", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "job_id": self.job_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "job_title": self.job_title,
            "company_name": self.company_name,
            "interview_date": self.interview_date,
            "interview_time": self.interview_time,
            "platform": self.platform,
            "meeting_link": self.meeting_link,
            "interviewer_notes": self.interviewer_notes,
            "status": self.status,
            "email_dispatched": self.email_dispatched,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id"), nullable=True, index=True)
    application_id = Column(Integer, nullable=True, index=True)
    candidate_name = Column(String(255), default="")
    job_title = Column(String(255), default="")
    total_score = Column(Float, default=0.0)  # out of 10
    qa_transcript = Column(Text, default="[]")  # JSON list of {question, answer, score, feedback}
    strengths = Column(Text, default="[]")  # JSON list
    weaknesses = Column(Text, default="[]")  # JSON list
    hire_recommendation = Column(String(100), default="Hire")  # "Strong Hire", "Hire", "Needs Training", "Reject"
    detailed_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("InterviewSchedule", back_populates="evaluations")

    def to_dict(self):
        try:
            parsed_qa = json.loads(self.qa_transcript) if self.qa_transcript else []
        except Exception:
            parsed_qa = []
        try:
            parsed_str = json.loads(self.strengths) if self.strengths else []
        except Exception:
            parsed_str = []
        try:
            parsed_weak = json.loads(self.weaknesses) if self.weaknesses else []
        except Exception:
            parsed_weak = []

        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "application_id": self.application_id,
            "candidate_name": self.candidate_name,
            "job_title": self.job_title,
            "total_score": self.total_score,
            "qa_transcript": parsed_qa,
            "strengths": parsed_str,
            "weaknesses": parsed_weak,
            "hire_recommendation": self.hire_recommendation,
            "detailed_summary": self.detailed_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class BackupRecord(Base):
    __tablename__ = "backup_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    backup_type = Column(String(50), default="full")
    size_bytes = Column(Integer, default=0)
    record_counts = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "backup_type": self.backup_type,
            "size_bytes": self.size_bytes,
            "record_counts": self.record_counts,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
